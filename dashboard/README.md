# Интерфейс SEO-агентов (dashboard)

Next.js 16 + TypeScript + Tailwind. Данные — файлы репозитория `asilios/seo-agents` через GitHub API, без отдельной базы.
План и решения — `docs/dashboard-plan.md`.

## Экраны (v1)

| Экран | Что показывает | Откуда данные | Что можно сделать |
|---|---|---|---|
| Обзор | готовность системы и клиентов, самое важное | всё ниже | — |
| Перед началом | что нужно ввести и подключить: зелёное / жёлтое / красное, что даст, сколько стоит, как сделать | `core/setup/requirements.yaml` + автопроверки + отметки | поставить отметку админа |
| Действия | очередь для админа и владельца сайта, готовые тексты с кнопкой «Скопировать» | `clients/<c>/admin/tasks.yaml` | Сделано / Пропустить / Вернуть, ответ |
| Ключи | задан ли ключ, инструкция | секреты GitHub Actions (только имена) | положить ключ в секреты репозитория |
| Новый клиент | анкета | `clients/_template/` | создать папку клиента и `client.yaml` |

Каждое действие — один коммит в `master` от имени того, кто нажал, и строка в журнале
(`clients/<c>/admin/log.md` или `core/setup/log.md`). Интерфейс ничего не публикует и не пишет в `changes/applied/`.
Значения ключей не хранятся и не показываются.

## Вход

GitHub OAuth, только логины из `ALLOWED_GITHUB_USERS`. Права токена: `repo` (читать и коммитить данные, менять секреты).
Список и запись секретов доступны только администратору репозитория (asilios); у остальных статус ключей берётся из отметок.

## Развернуть на Railway

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   Homepage URL — адрес сервиса, Callback URL — `https://<адрес>/api/auth/callback`
   (адрес появится после шага 2; потом вернуться и вписать).
2. Railway → New Project → Deploy from GitHub repo → `asilios/seo-agents`.
   В настройках сервиса: **Root Directory** `dashboard`, ветка `master`. Сборка и запуск определяются сами
   (`npm run build`, `npm start`), Node ≥ 22. Settings → Networking → Generate Domain (`*.up.railway.app`).
3. Переменные сервиса — из `.env.example`: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
   `ALLOWED_GITHUB_USERS=asilios,kemalshen`, `AUTH_SECRET` (`openssl rand -base64 48`).
4. Открыть адрес → «Войти через GitHub».

## Разработка

```bash
cd dashboard
npm install
DATA_SOURCE=local LOCAL_REPO_PATH=.. npm run dev   # файлы с диска, без входа; действия пишут прямо в файлы
npm test        # логика статусов
npm run typecheck
npm run build
```

Логика статусов в `lib/status.ts` повторяет `core/scripts/admin_status.py` — менять обе вместе.
