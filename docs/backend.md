# `apps/server`

TypeScript, Express + Socket.IO, Prisma/Postgres для персистентных данных,
S3-совместимое хранилище для аудио. Запускается через `tsx watch
src/index.ts` (см. `npm run dev --workspace=@quiz/server`).

## Машина состояний раунда — `src/game/transition.ts`

Чистая функция `transition(session: GameSession, event: GameEvent):
OperationResult<GameSession>`. Не делает side-эффектов, не трогает БД — всю
мутацию состояния делает `GameManager`, вызывая эту функцию и сохраняя
результат.

Фазы и переходы:

```
lobby
  --START_GAME--> countdown_to_start
  --BEGIN_QUESTION--> question_playing
  --BUZZ--> answer_window
  --SUBMIT_ANSWER(accept|review|reject) / HOST_JUDGE--> reveal
  --ADVANCE--> leaderboard
  --ADVANCE--> countdown_to_start (следующий вопрос)
            | wager_input (если плейлист кончился и finalWagerEnabled)
            | finished
wager_input
  --SUBMIT_WAGER (все проставили)--> countdown_to_start (isFinalRound=true)
```

Важные правила, которые легко упустить при чтении кода бегло:

- **Скоростной бонус** считается от `questionStartedAt`/`buzzedAt`, не от
  времени ответа — приз падает линейно к `SPEED_AWARD_FLOOR_RATIO` (30%) от
  `basePoints` к концу `questionWindowMs`.
- **Lockout**: неверный ответ добавляет контестанта в `lockedOutIds` для
  текущего вопроса и возвращает фазу в `question_playing` (кто-то другой
  может нажать buzz), если не все уже заблокированы и это не финальный
  раунд — тогда сразу `reveal`.
- **Финальный раунд** переиспользует ставку (`wagers[contestantId]`) как
  величину приза/штрафа вместо `basePoints`/`wrongAnswerPenalty`.
- **`pendingReview`**: `SUBMIT_ANSWER` с вердиктом `"review"` не завершает
  вопрос — ставит `pendingReview: true` и ждёт `HOST_JUDGE` от ведущего.
- В team mode (`settings.teamMode`) `contestantIds()`/`contestantScore()`/
  `applyDelta()` резолвят через `session.teams`, а не `session.players` —
  но **ничего в `index.ts`/`GameManager` сейчас не умеет создавать команды
  или назначать туда игрока** (см. `plan.md`), так что практически это
  всегда solo-режим.

## `GameManager.ts`

In-memory реестр: `Map<roomCode, GameSession>`. Один процесс Node держит
много сессий одновременно, без шардирования между процессами (нет
`@socket.io/redis-adapter`). Код комнаты — 5 символов из алфавита без
0/O/1/I (`ROOM_CODE_ALPHABET`), чтобы не путать на слух/глаз на экране.

`addPlayer()` отказывает, если `session.phase !== "lobby"` — поэтому игрок,
который переподключается через `joinRoom` после старта игры, получит
`"game has already started"` вместо присоединения. Это одно из мест, где
отсутствие reconnect-flow (см. `plan.md`) проявляется напрямую.

## `src/auth/*`

Email+password, bcrypt (`password.ts`), JWT в httpOnly cookie
(`session.ts` — `signSessionToken`/`verifySessionToken`, `SESSION_COOKIE =
"session"`). `middleware.ts` → `requireAuth` читает cookie, кладёт
`req.userId`. Роуты: `POST /auth/register|login`, `POST /auth/logout`,
`GET /auth/me`.

Реально проверено curl'ом против живого Postgres: регистрация записывает
`User` в БД, повторный логин с неверным паролем отдаёт 401, `/auth/me`
отражает текущую сессию.

## `src/storage/*` — S3

- `s3Client.ts` — `createS3Client()` требует `S3_ACCESS_KEY_ID`/
  `S3_SECRET_ACCESS_KEY`, иначе бросает (это и уронило процесс до того, как
  появился централизованный error-handling — см. ниже). `forcePathStyle:
  true` нужен для любого не-AWS S3 (R2, MinIO, моки).
  **Важная настройка:** `requestChecksumCalculation`/
  `responseChecksumValidation: "WHEN_REQUIRED"` — без неё AWS SDK v3
  (начиная где-то с v3.729) по умолчанию считает flexible checksums на
  каждом S3-запросе, что ломается на любой не-AWS реализации с неочевидной
  ошибкой (`BucketAlreadyOwnedByYou` на операции, которая вообще не создаёт
  бакет — так это и было обнаружено).
- `presign.ts` — `createUploadUrl` (presigned PUT, TTL 300с), `getObjectBuffer`
  (нужен `tracks/finalize.ts` для чтения ID3-тегов), `uploadBuffer` (для
  обложки, извлечённой из ID3), `publicUrlFor` (голый `S3_PUBLIC_URL + key`,
  без подписи — требует, чтобы объект был публично читаем).

Локальная разработка: `adobe/s3mock` (см. `docker-compose.yml`), поднимается
через `docker compose up -d s3mock`, бакет создаётся один раз через
`apps/server/scripts/bootstrapS3.ts`. Этот мок разрешает анонимные GET/PUT
и CORS из коробки — никакой дополнительной настройки политик не нужно (было
проверено: `PutBucketCors`/`PutBucketPolicy` у него не реализованы и просто
кидают мусорные ошибки, но они и не требуются).

**Прод (Cloudflare R2/AWS S3) никогда не проверялся** — только локальный мок.

## `src/tracks/*`

- `extractMetadata.ts` — вытаскивает title/artist/обложку из ID3-тегов
  (`node-id3`). Протестировано через `NodeID3.create`-roundtrip, а с недавних
  пор ещё и вручную — против настоящего загруженного в S3-мок файла.
- `matchTrackAnswer.ts` — fuzzy-match ответа против title/artist (см.
  `shared.md`).
- `routes.ts` — `POST /tracks/upload-url` (выдаёт presigned PUT),
  `POST /tracks/finalize` (читает объект из S3, извлекает метаданные,
  создаёт `Track` в БД), `GET /tracks` (список своих треков),
  `DELETE /tracks/:id`. И `finalize`, и список **теперь дополнительно
  отдают поле `url`** (`publicUrlFor(storageKey)`) — раньше его не было
  вообще, и клиент не мог ничего воспроизвести.

## `src/playlists/*`

CRUD плейлистов (`POST/GET /playlists`, `GET /playlists/:id` со
вложенными `items.track`) и их items (`POST /playlists/:id/items` —
`trackId`, `clipStartMs`, `clipEndMs`, `basePoints`; `DELETE
/playlists/:playlistId/items/:itemId`). `order` выставляется по счётчику
существующих items при добавлении.

## `src/index.ts` — HTTP + Socket.IO wiring

- Собирает все роутеры (`/auth`, `/tracks`, `/playlists`) плюс `POST /rooms`
  (создаёт `GameSession` из сохранённого плейлиста через `GameManager`).
- **Централизованный error-handling** (`express-async-errors` +
  финальный 4-арг. error-middleware). До этого любая ошибка внутри `async`
  route-хендлера — например, вызов `/tracks/upload-url` без настроенного
  S3 — **роняла весь процесс Node**, а не только отдельный запрос:
  `GameSession` живёт in-memory на процесс, значит это убивало все
  одновременно идущие игры во всех комнатах. Воспроизведено и подтверждено
  исправленным. Асинхронный socket-хендлер `submitAnswer` обёрнут в
  отдельный try/catch по той же причине — Express-мидлвары на Socket.IO
  не действуют.
- Socket-события: `joinRoom` (создаёт `Player`), **`hostJoin`**
  (аутентификация по cookie, проверка `session.hostId === userId`, не
  создаёт `Player` — см. `shared.md`), `startGame`/`beginQuestion`/
  `advance`/`hostJudge` (теперь отказывают любому сокету с выставленным
  `playerId`, то есть игроку, а не ведущему), `buzz`/`submitAnswer`/
  `submitWager` (только для сокетов с `playerId`).
- `disconnect` помечает игрока `connected: false`, но **не удаляет и не
  освобождает слот** — нет grace-периода/reconnect (см. `plan.md`).

## Тесты

22 юнит-теста (`vitest`), покрывают: `transition.ts` (10), fuzzy-match (3),
ID3-экстракцию (3), bcrypt/пароли (3), JWT-сессии (3). HTTP/Socket-слой
проверен вручную curl'ом и скриптованным `socket.io-client`-прогоном полного
игрового цикла против живого сервера+Postgres+S3-мока — не покрыт
автоматическими тестами.
