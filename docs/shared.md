# `packages/shared`

Общие TS-типы и утилиты между `apps/server` и `apps/web`. Публикуется как
`@quiz/shared`, `main`/`types` в `package.json` указывают прямо на
`src/index.ts` — ни сервер (через `tsx`), ни клиент (через Vite) не нуждаются
в отдельной сборке этого пакета, оба транспилируют TS на лету через
npm-workspace симлинк.

## `domain.ts` — доменные типы

- `GamePhase` — **восемь значений, но реально используются два разных
  набора**. `"lobby"` и `"finished"` общие; `"question_active"` — текущий
  основной режим раунда (свободный ввод, судит ведущий, см. `flows.md`);
  `"countdown_to_start"`/`"question_playing"`/`"answer_window"`/
  `"wager_input"` принадлежат **старому** buzz-FSM (`game/transition.ts`),
  который сейчас никак не достижим через UI — оставлен как задел под
  будущий бонусный вопрос с buzz'ом, не удалён. Если видите код, проверяющий
  одну из этих четырёх фаз — это дохлый путь, не основной сценарий.
- `Track`, `PlaylistItem`, `Player`, `Team`, `GameSettings` — без изменений
  со старта проекта.
- `AnswerField` (`"artist" | "title"`) и `FieldAnswer` (`{text, judged,
  awardedPoints}`) — ответ одного игрока на одно поле текущего вопроса.
  `awardedPoints` хранится именно затем, чтобы повторное судейство
  (`judgeFieldAnswer`) могло откатить старое начисление перед применением
  нового, а не складывать их.
- `GameSession` — помимо старых buzz-полей (`activeAnswererId`,
  `pendingReview`, `buzzedAt`, `lockedOutIds`, `wagers` — тоже мёртвые вне
  старого FSM) несёт новые:
  - `audioPlaying` — отражает реальное проигрывание на **экране**
    (`/screen/:roomCode`), не у ведущего — именно экран теперь владеет
    аудио.
  - `screenConnected` — есть ли хоть один подключённый `/screen`-клиент;
    без него `startGame` откажет.
  - `activePhaseIndex` / `activePhaseStartedAt` — какая из трёх
    захардкоженных фаз клипа сейчас выбрана и когда это было нажато.
    **`activePhaseStartedAt` меняется при каждом клике**, даже повторном по
    той же фазе — это специально, чтобы Vue-вотчеры на клиентах могли
    отличить «нажали снова» от «ничего не изменилось» (иначе повторный клик
    был бы no-op). Подробности — `flows.md`.
  - `answersByQuestion` — ответы всех игроков по всем вопросам (не только
    текущему — ведущий может вернуться назад и пересудить). **Единственное
    поле, которое вырезается** при проекции в `PublicGameSession` (см.
    ниже) — игроки и экран его никогда не видят.
- `GameEvent` — размеченное объединение событий **старого** FSM
  (`START_GAME`, `BEGIN_QUESTION`, `BUZZ`, `SUBMIT_ANSWER`, `HOST_JUDGE`,
  `ADVANCE`, `SUBMIT_WAGER`). Новый режим (`game/freeTextGame.ts`) не
  построен на этом union вообще — там просто набор отдельных чистых функций
  (`startGame`, `gotoQuestion`, `setActivePhase`, `submitFieldAnswer`,
  `judgeFieldAnswer`, `finishGame`), без единого события-объединения.
- Намеренный дизайн, сохранённый из старого FSM: `contestantId`/`teamId`
  обобщённые, чтобы логика не знала о правилах команд — но командный режим
  до сих пор не прошит нигде за пределами типов (см. `plan.md`).

## `events.ts` — контракт Socket.IO

- `PublicGameSession = Omit<GameSession, "answersByQuestion">` — именно это
  (не полный `GameSession`) уходит в событие `state`, которое получают
  **все** в комнате (игроки, экран, хост).
- `ServerToClientEvents.hostState` — **только хосту** (через отдельную
  Socket.IO-комнату `${roomCode}:host`), несёт полный `GameSession`,
  включая `answersByQuestion`.
- `ServerToClientEvents.kicked` — broadcast всем в комнате; каждый клиент
  сам сверяет `payload.playerId` со своим и решает, относится ли это к нему.
- `SocketData.role?: "host" | "screen"` — выставляется в `hostJoin`/
  `screenJoin` соответственно; у игрока это поле не выставляется вовсе,
  вместо этого проверяется `socket.data.playerId`. Три комбинации
  используются по всему `index.ts` как контроль доступа: игрок
  (`playerId` есть), хост (`role === "host"`), экран (`role === "screen"`).
- `rejoinRoom` — для игрока после перезагрузки страницы; в отличие от
  `joinRoom` не создаёт нового `Player` и не проверяет уникальность ника.
  Отдаёт `RejoinRoomResult { session, myAnswers }` — `myAnswers` это
  персональные (не чужие!) ответы этого игрока за текущий вопрос, чтобы
  клиент мог восстановить UI-лок «уже отправлено».
- `screenJoin` / `getCurrentClip` — экран не авторизуется вообще (тот же
  уровень доверия, что у игрока с кодом комнаты), но `getCurrentClip`
  (URL реального mp3) отдаётся **только** по приватному ack-запросу от
  роли `host`/`screen`, никогда не улетает в общий broadcast — иначе
  игрок мог бы просто прочитать его из своего же сокет-трафика.
- `kickPlayer` / `kickScreen` — host-only, работают только пока
  `phase === "lobby"`. Реально рвут socket-соединение
  (`fetchSockets()` + `.disconnect(true)`), не просто чистят запись в
  `players`.
- Нижний блок событий (`beginQuestion`, `buzz`, `submitAnswer`,
  `hostJudge`, `advance`, `submitWager`) — старый buzz-FSM, объявлен в
  контракте и обработчики в `index.ts` существуют, но путь к ним недостижим
  из текущего UI (там нет buzz-кнопки, `startGame` ведёт в
  `question_active`, а не в `countdown_to_start`, которого ждут эти
  хендлеры).

## `result.ts` — `OperationResult<T>`

Простой `{ success: true; data: T } | { success: false; error: string }` с
хелперами `ok()`/`err()`. Используется везде, где операция может
содержательно провалиться без исключения (обе game-машины, `GameManager`,
socket-ack'и) — отличие от HTTP-роутов, которые просто отвечают
`res.status(...).json(...)`.

## `fuzzyMatch.ts`

Свой Левенштейн без внешней зависимости. Используется в
`apps/server/src/tracks/matchTrackAnswer.ts` (сам по себе сейчас дёрнут
только из мёртвого buzz-хендлера `submitAnswer` — в живом free-text режиме
сравнение ответов делает **ведущий глазами**, не код). Протестирован
(`fuzzyMatch.test.ts`, 6 тестов).
