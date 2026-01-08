# DecaQuizzz

DecaQuizzz is a lightweight 10‑minute quiz platform built with Angular + serverless Node + MongoDB. Hosts create short‑lived rooms, players join with a 6‑character code, and results update in near real time. All quiz and submission data auto‑expires after 600 seconds to keep storage minimal.

## Project Structure
- `api/` Vercel serverless API (Node)
- `frontend/` Angular app (Tailwind CSS)
- `vercel.json` Vercel routing/build config

## MongoDB Atlas (Free Tier) Setup
1. Create a free M0 cluster at https://www.mongodb.com/atlas.
2. Add a database user (Database Access tab).
3. Add your IP allowlist entry (Network Access tab). For quick dev, you can allow `0.0.0.0/0`.
4. Click Connect -> Drivers -> copy the connection string.
5. Replace `<password>` and set a database name (e.g. `decaquiz`).

### Vercel Environment Variable
In Vercel project settings, add:
- `MONGODB_URI` = your MongoDB connection string

## Local Deploy (Step-by-Step)
1. Prereqs:
   - Node.js 18+ and npm
   - A MongoDB Atlas connection string
2. Install backend dependencies (repo root):
   - `npm install`
3. Install frontend dependencies:
   - `cd frontend`
   - `npm install`
4. Configure env vars:
   - Create `.env` at repo root
   - Add `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`
5. Run API locally (serverless-style):
   - `npm run dev`
   - API base: `http://localhost:3000/api`
6. Run frontend:
   - `cd frontend`
   - `npm start`
   - App: `http://localhost:4200`
7. Quick verification:
   - Create a quiz from Host view
   - Join with the code in another tab
   - Check that the leaderboard updates

## Notes
- Quizzes and submissions expire automatically after 10 minutes via MongoDB TTL indexes.
- The room caps at 20 participants.
- `/api/quizzes/upload-file` accepts CSV, PDF, or TXT for bulk question parsing (max 50 questions).
