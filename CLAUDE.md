# Guess-the-melody — rewrite notes

Party game: up to 8 players + 1 host, everyone in the same room, players on
phones, a big screen shows shared state and plays audio. Players buzz in on
their phone to stop the track when they think they know it.

## Repo layout — old vs new, read this first

There are **three** things in this repo right now:

- `server/`, `client/` — the **original** local-LAN version (plain JS,
  Express + Socket.IO + Vue3). One global in-memory game object, no rooms,
  hardcoded LAN IP. Kept only as a reference for salvageable UI pieces
  (Leaderboard, avatars, the `<audio>`/Web Audio wiring) — **do not build on
  top of this or try to merge it with the rewrite.**
- `apps/server` — the **new** backend being built now. TypeScript, real
  rooms, Postgres, S3 storage. This is the live rewrite.
- `apps/web` — the new Vue3+TS client. **Not started yet.**
- `packages/shared` — TS types/utilities shared between `apps/server` and
  the future `apps/web`.

There was also an abandoned `origin/forscience` branch (an earlier, unmerged
TS rewrite attempt that only got the lobby working). It's not used as a base
for anything here — treat it as dead.

## Why rewrite instead of patch

Decided after reviewing both `master` (working but can't do rooms/accounts)
and `origin/forscience` (diverged 5 months, only the lobby layer finished).
The new requirements are a big enough jump — internet-facing, host accounts
with a persistent track library, a visual waveform clip picker, many
concurrent games, team mode, auto fuzzy-matched answers, speed scoring, a
final wager round — that patching either old base wasn't worth it.

## Stack decisions

- **TypeScript end-to-end** (server + client), npm workspaces (not pnpm —
  it isn't installed on the original dev machine; plain npm works fine).
- **Socket.IO** for realtime, **Express** for HTTP.
- **Postgres via Prisma** for persistent data (accounts, track library,
  playlists). Game session state itself is **in-memory per room**, not
  persisted — only the library/accounts need to survive a restart.
- **S3-compatible object storage** (Cloudflare R2 or AWS S3) for uploaded
  mp3s and extracted cover art, via presigned URLs (client uploads directly
  to the bucket, server never proxies the audio bytes).
- Many independent `GameSession`s per Node process, keyed by a short room
  code — not one global game object, but also not sharded across multiple
  processes (no Redis adapter yet; add `@socket.io/redis-adapter` only if
  the server ever needs to scale beyond one instance).
- Client stays **Vue 3**, clip selection UI will use `wavesurfer.js`
  (waveform editor), not plain numeric start/end inputs.

## Game domain model (`packages/shared/src/domain.ts`)

Round state machine (`apps/server/src/game/transition.ts`, pure function,
unit-tested — read this file for the actual logic):

```
lobby → countdown_to_start → question_playing → (buzz) → answer_window
  → reveal → leaderboard → (loop to next question | wager_input) → finished
```

- Buzzing in locks that question for the buzzer only; a wrong answer lets
  someone else steal it (penalty applies only to whoever missed).
- Correct answers award more points the faster the buzz (speed bonus).
- An ambiguous player-typed answer routes to the host for a manual
  accept/reject instead of auto-scoring (`pendingReview` + `HOST_JUDGE`).
- A final round (`wager_input` → `isFinalRound`) lets each contestant wager
  points before the last question; correct = +wager, wrong = -wager.
- `contestantId` is deliberately generic (player id solo, team id in team
  mode) so `transition()` doesn't need to know team membership rules.

Answer checking: `apps/server/src/tracks/matchTrackAnswer.ts` fuzzy-matches
the player's typed text against the track's title *or* artist (best of the
two), using `packages/shared/src/fuzzyMatch.ts` (hand-rolled Levenshtein, no
external dependency).

## What's built so far

- `packages/shared`: domain types, socket event contract
  (`ClientToServerEvents`/`ServerToClientEvents`), `OperationResult<T>`,
  fuzzy match. Tested.
- `apps/server/src/game/transition.ts` + `GameManager.ts`: the full round
  FSM and an in-memory multi-room registry. Tested.
- `apps/server/src/auth/*`: email+password, bcrypt, JWT in an httpOnly
  cookie. Pure helpers tested; HTTP routes (`/auth/register|login|logout|me`)
  written but **not integration-tested** — needs a live Postgres.
- `apps/server/src/storage/*`: S3 presigned upload / get / put / public URL
  helpers. Not tested against a real bucket (no credentials available yet).
- `apps/server/src/tracks/*`: ID3 tag extraction on upload
  (`extractMetadata.ts`, tested via `NodeID3.create` round-trip, no real mp3
  fixture needed), `matchTrackAnswer.ts` (tested), HTTP routes for
  upload-url/finalize/list/delete.
- `apps/server/src/playlists/*`: CRUD for playlists + playlist items
  (clip start/end ms, points).
- `apps/server/src/index.ts`: wires all of the above together, including
  `submitAnswer` → real track lookup → fuzzy match → state machine.
  `POST /rooms` creates a game session from a saved playlist (replaced an
  earlier unauthenticated `/dev/rooms` stub).
- `apps/server/prisma/schema.prisma`: `User`/`Track`/`Playlist`/
  `PlaylistItem`. Schema is valid and `prisma generate` succeeds, but **no
  migration has ever been run against a real database** — the original dev
  machine didn't have Docker Desktop running. `docker-compose.yml` at the
  repo root defines a local Postgres service for this.
- 22 unit tests passing, `tsc --noEmit` clean, server boots and responds.

## Known gaps / not started

- **Team mode isn't wired end-to-end.** `transition.ts` supports
  `settings.teamMode` generically, but there's no `GameManager`/socket API
  to create a team or assign a player to one yet — `index.ts` always passes
  the raw `playerId` as `contestantId`.
- **Nothing in `apps/web` exists yet** — host dashboard (library, playlist
  builder, waveform clip editor), updated Screen/Player views, team-join UI,
  room-code/QR join flow.
- **Reconnect-by-token isn't implemented on the new socket layer** — a
  dropped socket just marks the player disconnected; no grace period or
  rejoin flow yet (the old `server/index.js` had a working version of this
  worth referencing).
- **Never run against a live Postgres or S3 bucket** — only schema
  validation / unit tests / mocked-boundary code have been verified.

## Dev setup

```
npm install                                   # from repo root (npm workspaces)
cd apps/server && npx prisma generate         # regenerate Prisma client after schema changes
docker compose up -d postgres                 # from repo root, needs Docker Desktop running
cd apps/server && npx prisma migrate dev --name init   # first real migration — untested so far
npm test --workspace=@quiz/server             # or --workspace=@quiz/shared
npm run dev --workspace=@quiz/server          # tsx watch, reads apps/server/.env
```

Copy `apps/server/.env.example` to `apps/server/.env` and fill in
`DATABASE_URL`/`JWT_SECRET`/`S3_*` before running the server for real.

## Suggested next step

Either (a) get a live Postgres running and actually integration-test the
auth/tracks/playlists routes for the first time, or (b) start on `apps/web`
since the server API surface a host dashboard needs already exists.
