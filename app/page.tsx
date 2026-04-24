// app/page.tsx
"use client"; // This tells Next.js this is an interactive client-side component

import { useState } from "react";
import GameBoard from "../components/GameBoard";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Creamos.123456") {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  // If they are logged in, show the actual game (we will build GameBoard next)
  // If they are logged in, show the actual game
  if (isLoggedIn) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center">
        <GameBoard /> {/* <-- Uncomment this line */}
      </main>
    );
  }

  // Otherwise, show the Login Screen
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-creamos-primary">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-creamos-secondary">
          Creamos Quiz
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#333333]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creamos-primary text-[#333333]"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            className="mt-4 w-full bg-creamos-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Enter Game
          </button>
        </form>
      </div>
    </main>
  );
}