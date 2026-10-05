# `apps/server`

TypeScript, Express + Socket.IO, Prisma/Postgres для персистентных данных,
S3-совместимое хранилище для аудио. Запускается через `tsx watch
src/index.ts` (см. `npm run dev --workspace=@quiz/server`).

**Для пошагового сценария «что летит куда» — см. `flows.md`. Этот файл —
по какому модулю что лежит, не порядок событий.**

## Две игровые машины — важно не перепутать

- **`src/game/transition.ts`** — старая buzz-машина (lobby → countdown →
  question_playing → buzz → answer_window → reveal → leaderboard → ... →
  wager_input → finished). Чистая функция, протестирована (10 тестов),
  **но недостижима из текущего UI**: `startGame` ведёт в `question_active`,
  не в `countdown_to_start`, которого ждёт эта машина. Оставлена как
  задел под будущий бонусный вопрос с buzz'ом (см. `plan.md`), не удалена.
- **`src/game/freeTextGame.ts`** — **текущий, реально используемый** режим.
  Не единая FSM с одним типом события, а набор отдельных чистых функций:
  - `startGame(session)` — `lobby` → `question_active`, index 0. Откажет,
    если плейлист пуст **или `!session.screenConnected`**.
  - `gotoQuestion(session, index)` — произвольный переход между вопросами
    в любую сторону (не одностороннее `ADVANCE`), сбрасывает
    `activePhaseIndex`/`activePhaseStartedAt`.
  - `setActivePhase(session, index)` — не `OperationResult`, просто
    возвращает новую сессию (нет условий провала). Обновляет
    `activePhaseStartedAt` на **каждый** вызов, даже с тем же `index`, —
    это осознанно, см. `shared.md`.
  - `submitFieldAnswer(session, playerId, field, text)` — откажет, если
    поле для этого игрока на этом вопросе **уже было отправлено** (не
    только судимо — именно отправлено). Это серверная проверка, не
    декоративная: UI тоже прячет форму после отправки, но без этой
    проверки в чистой функции кто угодно мог бы переотправить через
    devtools.
  - `judgeFieldAnswer(session, playerId, field, correct, points)` —
    откатывает предыдущее начисление (`fieldAnswer.awardedPoints`) перед
    применением нового, так что повторное судейство в любую сторону даёт
    корректный итог, а не накапливает дельты.
  - `finishGame(session)` — `question_active` → `finished`.

  Тесты — `freeTextGame.test.ts` (21 тест).

`GameManager` вызывает ОБЕ машины (`dispatch()` — старую, `startFreeTextGame`/
`gotoQuestion`/`submitFieldAnswer`/`judgeFieldAnswer`/`finishGame` — новую)
и персистирует результат одинаково — через `this.sessions.set(roomCode, ...)`.

## `GameManager.ts`

In-memory реестр: `Map<roomCode, GameSession>`. Один процесс Node держит
много сессий одновременно, без шардирования между процессами (нет
`@socket.io/redis-adapter`). Код комнаты — 5 символов из алфавита без
0/O/1/I.

Помимо игровых машин, держит побочное состояние, не относящееся ни к одной
из них:

- `addPlayer()` — **отказывает на дубликат ника** (без учёта регистра и
  пробелов) и если `phase !== "lobby"`.
- `removePlayer()` — кик, работает **только в `lobby`**.
- `screenSocketsByRoom: Map<roomCode, Set<socketId>>` — отдельная карта
  (не часть `GameSession`), через `addScreen()`/`removeScreen()`.
  `session.screenConnected` синхронизируется по размеру этого сета — так
  несколько открытых вкладок `/screen` на одну комнату не считаются
  «отключением», пока жива хоть одна.
- `setAudioPlaying()` — просто ставит поле, без валидации (кто вызывает —
  решает `index.ts` через роль сокета).
- `dispatch()` (старая машина) дополнительно гасит `audioPlaying` при
  выходе из `question_playing` — артефакт одно-устройственной версии до
  разделения host/screen, актуален только если buzz-режим когда-нибудь
  снова станет достижим.

Тесты — `GameManager.test.ts` (8 тестов: дубликаты ников, трекинг экрана,
кик).

## `src/auth/*`, `src/storage/*`, `src/tracks/*`, `src/playlists/*`

Не менялись с прошлой ревизии документации по сути:

- `auth/*` — email+password, bcrypt, JWT в httpOnly cookie. Проверено
  против живого Postgres.
- `storage/*` — presigned S3 PUT/GET. **Важная настройка**:
  `requestChecksumCalculation`/`responseChecksumValidation: "WHEN_REQUIRED"`
  в `s3Client.ts` — без неё AWS SDK v3 по умолчанию ломает совместимость
  с любой не-AWS реализацией (R2/MinIO/моки). Локально — `adobe/s3mock`
  (см. `docker-compose.yml`), бакет создаётся один раз через
  `scripts/bootstrapS3.ts`.
- `tracks/*` — ID3-экстракция при загрузке, `GET /tracks` и
  `POST /tracks/finalize` отдают дополнительное поле `url`
  (`publicUrlFor(storageKey)`) — без него у `/host` не было бы что
  показать в аудио-плеере библиотеки. `matchTrackAnswer.ts` всё ещё
  существует и протестирован, но в живом потоке не используется (решение
  принимает ведущий, не код — см. выше).
- `playlists/*` — CRUD плейлистов и items, включая `DELETE /playlists/:id`
  (целиком) и `DELETE /playlists/:playlistId/items/:itemId` (один трек).

## `src/index.ts` — HTTP + Socket.IO wiring

### HTTP

`/auth`, `/tracks`, `/playlists` (роутеры), плюс `POST /rooms` — создаёт
`GameSession` из сохранённого плейлиста через `GameManager.createSession()`.

Централизованный error-handling (`express-async-errors` + финальный
4-арг. middleware) — без него любая ошибка в `async`-хендлере (например,
вызов S3 без настроенных кредов) роняла **весь процесс**, а не только
запрос — это убивало бы все одновременно идущие игры во всех комнатах.

### Socket.IO — три Socket.IO-«комнаты» на одну игровую комнату

| Socket.IO room | Кто вступает | Что рассылается |
|---|---|---|
| `roomCode` | игроки (`joinRoom`/`rejoinRoom`), хост (`hostJoin`), экран (`screenJoin`) | `state` — `PublicGameSession`, без `answersByQuestion` |
| `${roomCode}:host` | только хост | `hostState` — полный `GameSession` |
| (нет комнаты) | — | `getCurrentClip` — не broadcast, приватный ack только для `role === "host" \| "screen"` |

`broadcastState(roomCode)` — единая функция, шлёт и то, и то за один вызов
(`toPublicGameSession()` просто вырезает `answersByQuestion`).

Контроль доступа к хендлерам — через `socket.data`:
- `!roomCode` → сокет вообще не подключён ни к одной комнате, игнор.
- `playerId` есть → это игрок (гвард вида `if (!roomCode || !playerId)
  return;`).
- `role === "host"` → хост-only события (`startGame`, `gotoQuestion`,
  `setActivePhase`, `judgeFieldAnswer`, `finishGame`, `kickPlayer`,
  `kickScreen`).
- `role === "screen"` → только `setAudioPlaying` (экран — единственный,
  кто реально проигрывает звук, значит только он отвечает за этот флаг).

`kickPlayer`/`kickScreen` — находят реальные сокеты через
`io.in(roomCode).fetchSockets()` и зовут `.disconnect(true)` — кик рвёт
транспортное соединение, не только запись в `GameSession`. Для игрока
дополнительно шлётся `kicked({ playerId })` всем в комнате (каждый клиент
сам проверяет, его ли это касается). Для экрана отдельного события не
нужно — его естественный `disconnect`-хендлер сам вызовет `removeScreen()`.

`getCurrentClip` — `async`-хендлер, читает `Track` из Prisma по
`trackId` текущего вопроса и отвечает `publicUrlFor(storageKey)` **только
через ack**, никогда через `io.to(roomCode).emit(...)` — иначе URL (а
значит и ответ на вопрос) улетел бы и игрокам.

Нижний блок хендлеров (`beginQuestion`, `buzz`, `submitAnswer`,
`hostJudge`, `advance`, `submitWager`) — всё ещё вызывают
`gameManager.dispatch()` (старую FSM), но никогда не достигаются из
текущего UI (см. выше, GamePhase).

## Тесты

48 юнит-тестов (`vitest`): `transition.ts` (10, мёртвый путь, но зелёный),
`freeTextGame.ts` (21), `GameManager.ts` (8), fuzzy-match (3), ID3 (3),
bcrypt/пароли (3), JWT-сессии (3). Live-проверка HTTP/Socket-слоя (создание
комнаты, джойн, кик, реконнект, судейство, навигация по вопросам) делалась
вручную скриптами на `socket.io-client` против живого
сервера+Postgres+S3-мока — не покрыта автотестами.
