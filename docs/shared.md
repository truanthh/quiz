# `packages/shared`

Общие TS-типы и утилиты между `apps/server` и `apps/web`. Публикуется как
`@quiz/shared`, `main`/`types` в `package.json` указывают прямо на
`src/index.ts` — ни сервер (через `tsx`), ни клиент (через Vite) не нуждаются
в отдельной сборке этого пакета, оба транспилируют TS на лету через
npm-workspace симлинк.

## `domain.ts` — доменные типы

- `GamePhase` — восемь фаз раунда (см. `backend.md` → FSM).
- `Track`, `PlaylistItem`, `Player`, `Team`, `GameSettings`, `GameSession` —
  форма игрового сеанса, которую видят и сервер, и клиент.
- `GameEvent` — размеченное объединение событий, которые понимает
  `transition()`: `START_GAME`, `BEGIN_QUESTION`, `BUZZ`, `SUBMIT_ANSWER`,
  `HOST_JUDGE`, `ADVANCE`, `SUBMIT_WAGER`.
- Ключевой намеренный дизайн: `contestantId` — generic id (игрока в solo,
  команды в team mode). Это позволяет `transition.ts` оставаться чистой
  функцией, не знающей о правилах членства в командах — вся резолюция
  «кто на самом деле стоит за этим id» происходит снаружи, в `GameManager`.

## `events.ts` — контракт Socket.IO

- `ClientToServerEvents` / `ServerToClientEvents` / `SocketData` — типизация
  обеих сторон сокета, используется в `apps/server/src/index.ts` и
  `apps/web/src/lib/socket.ts`.
- `joinRoom` — только для игроков, создаёт `Player` в сессии.
- `hostJoin` — **добавлено не в первой итерации** (см. `plan.md`): у ведущего
  изначально не было отдельного способа подключиться к сокету иначе как
  притворившись игроком. `hostJoin` аутентифицируется через HTTP-cookie
  сессии (не через payload), не создаёт `Player`, и именно отсутствие
  `playerId` в `SocketData` после подключения используется в `index.ts` как
  признак «это сокет ведущего».
- `SocketData.playerId` — намеренно **опциональный** (не было так до
  добавления `hostJoin`): у хост-сокета это поле не выставляется.

## `result.ts` — `OperationResult<T>`

Простой `{ success: true; data: T } | { success: false; error: string }` с
хелперами `ok()`/`err()`. Используется везде, где операция может
содержательно провалиться без исключения (`transition()`, `GameManager`,
socket-ack'и) — отличие от HTTP-роутов, которые просто отвечают
`res.status(...).json(...)`.

## `fuzzyMatch.ts`

Свой Левенштейн без внешней зависимости. Используется в
`apps/server/src/tracks/matchTrackAnswer.ts` для сравнения введённого текста
с названием/исполнителем трека — берётся лучшее совпадение из двух.
Протестирован (`fuzzyMatch.test.ts`, 6 тестов).
