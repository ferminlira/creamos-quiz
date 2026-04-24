// components/GameBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { quizQuestions, Question } from "../data/questions";

export default function GameBoard() {
    const [playerName, setPlayerName] = useState("");
    const [inLobby, setInLobby] = useState(false);
    const [gameState, setGameState] = useState<"lobby" | "playing" | "finished">("lobby");

    // Game state
    const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per round
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    // Leaderboard state
    const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);

    const [players, setPlayers] = useState<{ name: string; color: string }[]>([]);

    const channelRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playerNameRef = useRef("");
    const [isMuted, setIsMuted] = useState(false);

    const getPlayerColor = (name: string) => {
        const palette = ["#F5E600", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FF8C69", "#DDA0DD", "#98D8C8"];
        const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return palette[hash % palette.length];
    };

    // Announce self when joining the lobby
    useEffect(() => {
        if (!inLobby || !playerName.trim()) return;
        channelRef.current?.send({
            type: "broadcast",
            event: "player_joined",
            payload: { name: playerName.trim() },
        });
    }, [inLobby]);

    // Re-announce self whenever we return to the lobby (e.g. after back_to_lobby)
    useEffect(() => {
        if (gameState !== "lobby" || !inLobby || !playerNameRef.current) return;
        const t = setTimeout(() => {
            channelRef.current?.send({
                type: "broadcast",
                event: "player_joined",
                payload: { name: playerNameRef.current },
            });
        }, 150);
        return () => clearTimeout(t);
    }, [gameState]);

    // Audio setup — create once on mount, clean up on unmount
    useEffect(() => {
        const audio = new Audio("/music/funky-guitar.mp3");
        audio.loop = true;
        audio.volume = 1;
        audioRef.current = audio;
        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    // Control music based on game phase
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (gameState === "playing") {
            audio.currentTime = 0;
            audio.volume = 1;
            audio.play().catch(() => {});
        } else if (gameState === "finished") {
            const steps = 30;
            const stepMs = 100; // 30 steps × 100ms = 3s fade
            const decrement = audio.volume / steps;
            const fade = setInterval(() => {
                if (audio.volume > decrement) {
                    audio.volume = Math.max(0, audio.volume - decrement);
                } else {
                    audio.volume = 0;
                    audio.pause();
                    audio.currentTime = 0;
                    clearInterval(fade);
                }
            }, stepMs);
            return () => clearInterval(fade);
        } else {
            // back_to_lobby — stop immediately
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
        }
    }, [gameState]);

    // Setup Supabase Realtime channel
    useEffect(() => {
        // We create a room called "creamos-quiz-room"
        const channel = supabase.channel("creamos-quiz-room", {
            config: { broadcast: { self: true } },
        });

        channel
            .on("broadcast", { event: "player_joined" }, ({ payload }) => {
                setPlayers((prev) => {
                    if (prev.some((p) => p.name === payload.name)) return prev;
                    // Re-announce self so the new joiner discovers us
                    if (playerNameRef.current) {
                        channelRef.current?.send({
                            type: "broadcast",
                            event: "player_joined",
                            payload: { name: playerNameRef.current },
                        });
                    }
                    return [...prev, { name: payload.name, color: getPlayerColor(payload.name) }];
                });
            })
            .on("broadcast", { event: "start_game" }, () => {
                // When anyone starts the game, shuffle questions and begin!
                const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5);
                setLocalQuestions(shuffled);
                setGameState("playing");
                setCurrentIndex(0);
                setScore(0);
                setTimeLeft(15);
                setShowResult(false);
                setSelectedAnswer(null);
            })
            .on("broadcast", { event: "back_to_lobby" }, () => {
                setGameState("lobby");
                setPlayers([]);
                setCurrentIndex(0);
                setTimeLeft(15);
                setShowResult(false);
                setSelectedAnswer(null);
                setLocalQuestions([]);
            })
            .on("broadcast", { event: "player_finished" }, ({ payload }) => {
                // When a player finishes, add them to the leaderboard
                setLeaderboard((prev) => [...prev, payload].sort((a, b) => b.score - a.score));
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Timer logic for each round
    useEffect(() => {
        if (gameState !== "playing" || showResult) return;

        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Time is up! Show the result.
            handleRoundEnd();
        }
    }, [timeLeft, gameState, showResult]);

    const handleRoundEnd = () => {
        setShowResult(true);
        const currentQ = localQuestions[currentIndex];

        // Check if correct
        if (selectedAnswer === currentQ.correctAnswerIndex) {
            setScore((prev) => prev + 100); // 100 points per correct answer
        }

        // Wait 4 seconds, then go to next question or finish
        setTimeout(() => {
            if (currentIndex + 1 < localQuestions.length) {
                setCurrentIndex((prev) => prev + 1);
                setTimeLeft(15);
                setSelectedAnswer(null);
                setShowResult(false);
            } else {
                setGameState("finished");
                // Broadcast final score to everyone
                channelRef.current?.send({
                    type: "broadcast",
                    event: "player_finished",
                    payload: { name: playerName || "Anonymous Team Member", score: score + (selectedAnswer === currentQ.correctAnswerIndex ? 100 : 0) },
                });
            }
        }, 4000);
    };

    const startGameBroadcast = () => {
        channelRef.current?.send({
            type: "broadcast",
            event: "start_game",
        });
    };

    const backToLobbyBroadcast = () => {
        channelRef.current?.send({
            type: "broadcast",
            event: "back_to_lobby",
        });
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
            setIsMuted(audioRef.current.muted);
        }
    };

    // --- RENDERING SCREENS ---

    if (!inLobby) {
        return (
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold">Join the Lobby</h2>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => { setPlayerName(e.target.value); playerNameRef.current = e.target.value; }}
                    className="p-3 border rounded-lg focus:ring-creamos-primary focus:outline-none w-64"
                />
                <button
                    onClick={() => setInLobby(true)}
                    disabled={!playerName.trim()}
                    className="bg-creamos-primary text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                    Join Room
                </button>
            </div>
        );
    }

    if (gameState === "lobby") {
        const canStart = players.length >= 2;
        return (
            <div className="text-center w-full max-w-lg">
                <style>{`
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.75); }
                        to   { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Player presence panel */}
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">
                    {players.length} {players.length === 1 ? "player" : "players"} in the room
                </p>
                <div className="flex flex-wrap gap-4 justify-center min-h-[88px] mb-10">
                    {players.length === 0 && (
                        <p className="text-gray-600 text-sm self-center">No one here yet…</p>
                    )}
                    {players.map((player) => (
                        <div
                            key={player.name}
                            className="flex flex-col items-center gap-1.5"
                            style={{ animation: "fadeInScale 0.3s ease-out" }}
                        >
                            <div className="relative">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold text-[#080808] select-none"
                                    style={{ backgroundColor: player.color }}
                                >
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 border-2 border-[#080808] rounded-full" />
                            </div>
                            <span className="text-xs text-gray-300 font-medium max-w-[64px] truncate">
                                {player.name}
                            </span>
                        </div>
                    ))}
                </div>

                <h2 className="text-3xl font-bold mb-2">Waiting for players...</h2>
                <p className="mb-8 text-gray-400 text-sm">When everyone is here, click start!</p>

                <button
                    onClick={startGameBroadcast}
                    disabled={!canStart}
                    className={`px-8 py-3 rounded-lg font-extrabold text-xl shadow-lg transition-all duration-200 ${
                        canStart
                            ? "bg-creamos-accent text-creamos-secondary hover:scale-105 cursor-pointer"
                            : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }`}
                >
                    {canStart ? "START GAME FOR EVERYONE" : "Waiting for more players..."}
                </button>

                <div className="mt-6">
                    <button
                        onClick={backToLobbyBroadcast}
                        className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
                    >
                        ↩ Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === "finished") {
        return (
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold mb-6 text-center">Session Complete!</h2>
                <h3 className="text-xl mb-4 text-center">Your Score: {score}</h3>
                <div className="border-t-2 border-gray-100 pt-4">
                    <h4 className="text-lg font-bold mb-4 text-center">Live Leaderboard</h4>
                    <ul className="flex flex-col gap-2">
                        {leaderboard.map((player, idx) => (
                            <li key={idx} className="flex justify-between bg-gray-50 p-3 rounded-md">
                                <span className="font-semibold">{idx + 1}. {player.name}</span>
                                <span className="font-bold text-creamos-primary">{player.score} pts</span>
                            </li>
                        ))}
                        {leaderboard.length === 0 && <p className="text-center text-gray-400">Waiting for other players to finish...</p>}
                    </ul>
                </div>
            </div>
        );
    }

    // Playing state
    const question = localQuestions[currentIndex];

    return (
        <>
        <button
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-lg transition-colors"
        >
            {isMuted ? "🔇" : "🔊"}
        </button>
        <div className="w-full max-w-2xl bg-white p-6 md:p-10 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-500">Question {currentIndex + 1} / {localQuestions.length}</span>
                <span className={`font-extrabold text-2xl ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-creamos-secondary"}`}>
                    00:{timeLeft.toString().padStart(2, "0")}
                </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-8">{question.text}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, idx) => {
                    let btnClass = "bg-gray-100 hover:bg-gray-200 text-left border-2 border-transparent";

                    if (showResult) {
                        if (idx === question.correctAnswerIndex) {
                            btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
                        } else if (idx === selectedAnswer) {
                            btnClass = "bg-red-100 border-red-500 text-red-800";
                        } else {
                            btnClass = "bg-gray-50 opacity-50";
                        }
                    } else if (selectedAnswer === idx) {
                        btnClass = "bg-creamos-primary text-white border-creamos-primary";
                    }

                    return (
                        <button
                            key={idx}
                            disabled={showResult}
                            onClick={() => setSelectedAnswer(idx)}
                            className={`p-4 rounded-xl transition-all duration-200 ${btnClass}`}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {showResult && (
                <div className="mt-8 text-center animate-bounce">
                    <p className="text-xl font-bold">
                        {selectedAnswer === question.correctAnswerIndex ? "🎉 Correct!" : "❌ Time's up / Incorrect!"}
                    </p>
                </div>
            )}
        </div>
        <button
            onClick={backToLobbyBroadcast}
            className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
        >
            ↩ Back to Lobby
        </button>
        </>
    );
}