# Creamos Quiz — Claude Code Context

## What this is
Real-time multiplayer trivia game for Creamos agency (creamosagencia.com), 
a Colombian creative agency based in Medellín. Used for remote team events.

## Read these for full context
- .claude/project.md
- .claude/architecture.md

## Commands
- `npm run dev` — local dev server (port 3000)
- `git push origin main` — triggers Vercel auto-deploy
- `npx vercel --prod` — manual production deploy

## Key rules
- Never commit `.env.local`
- Credentials: admin / Creamos.123456
- All game logic lives in `components/GameBoard.tsx`
- Questions live in `data/questions.ts`
- Do not change the Supabase channel name `creamos-quiz-room`

@AGENTS.md
