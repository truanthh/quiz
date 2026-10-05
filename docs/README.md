# Документация

Этот каталог — более подробный разбор по модулям, чем краткий статус в
[`CLAUDE.md`](../CLAUDE.md) в корне репозитория. Если `CLAUDE.md` — это
быстрый онбординг и текущий снимок состояния, то здесь — что и зачем именно
так устроено внутри каждого модуля.

- [`shared.md`](shared.md) — `packages/shared`: доменные типы, контракт
  socket-событий, `OperationResult`, fuzzy-match.
- [`backend.md`](backend.md) — `apps/server`: FSM раунда, auth, S3-хранилище,
  треки/плейлисты, HTTP+Socket.IO слой.
- [`frontend.md`](frontend.md) — `apps/web`: экраны, api/socket-клиенты,
  известные ограничения UI.
- [`plan.md`](plan.md) — что сделано, что дальше, в каком порядке.

Порядок чтения для нового человека в проекте: `CLAUDE.md` → `shared.md` →
`backend.md` → `frontend.md` → `plan.md`.
