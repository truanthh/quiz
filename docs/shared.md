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
- `Track.clipStartMs` — **теперь живёт на треке, не на `PlaylistItem`**.
  Клип (всегда ровно `CLIP_DURATION_MS` = 14000мс, совпадает с суммой трёх
  фаз реплея) выбирается один раз при добавлении трека в библиотеку
  (`ClipPicker.vue` на `/host`) и переиспользуется во всех плейлистах, где
  этот трек встречается — `PlaylistItem` больше не хранит
  `clipStartMs`/`clipEndMs` вообще, только `trackId`+`basePoints`. При
  создании комнаты (`POST /rooms`) клип подтягивается из `track.clipStartMs`,
  `clipEndMs` вычисляется как `clipStartMs + CLIP_DURATION_MS`.
- `ScreenClient { id, color }` — каждый подключённый `/screen`-клиент,
  ключ в `GameSession.screens` — его собственный `socket.id` (у экрана нет
  персистентной личности между реконнектами, в отличие от `Player`). `color`
  — один из `SCREEN_COLORS` (ровно 8 штук, по числу `MAX_SCREENS`),
  назначается при `screenJoin` так, чтобы не совпадать с уже
  подключёнными — иначе несколько экранов в комнате визуально не отличить
  друг от друга ни ведущему, ни по факту глядя на сами экраны.
- `MAX_PLAYERS`/`MAX_SCREENS` = 8 каждый — потолок лобби (16 юнитов, не
  считая хоста). `GameManager.addPlayer`/`addScreen` отказывают на 9-м с
  понятной ошибкой.
- `Player`, `Team`, `GameSettings` — без изменений со старта проекта.
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
  - `screens: Record<socketId, ScreenClient>` (было булевым
    `screenConnected`, переписано) — пустая карта блокирует `startGame`;
    не просто счётчик, а полноценный список с цветом на каждого, виден
    ведущему в лобби для точечного кика (`kickScreen({screenId})`).
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
  У экрана отдельного события нет — кик экрана просто рвёт его транспортное
  соединение, а `ScreenView.vue` слушает нативный `disconnect` сокета и сам
  уходит на `/` (покрывает и кик, и любой другой разрыв связи одним кодом).
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
  `screenJoin` отвечает `{session, color}` — `color` это цвет **этого
  самого** экрана (тот же, что виден в `session.screens[socket.id]`),
  чтобы `ScreenView.vue` мог нарисовать свой цветной бейдж без лишней
  сверки по `socket.id`. Отказывает после `MAX_SCREENS`.
- `kickPlayer` / `kickScreen` — host-only, работают только пока
  `phase === "lobby"`. Реально рвут socket-соединение
  (`fetchSockets()` + `.disconnect(true)`), не просто чистят запись. У
  `kickScreen` обязательный `screenId` — кикает ровно один экран, не все
  подключённые сразу (раньше, до разделения экранов на сущности, било по
  всем).
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
