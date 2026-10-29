# SEO Agents

Система из оркестратора и 5 агентов для SEO сайтов клиентов. Работает в Claude Code.
Агенты ничего не публикуют сами — все правки ждут одобрения в `changes/pending/`.

## Агенты
| Агент | Задача | Частота |
|---|---|---|
| auditor | технический аудит | раз в неделю |
| keyword-strategist | семантика, кластеры, конкуренты | раз в месяц |
| onpage-optimizer | правки title / description / H1 / alt / ссылок / schema | раз в неделю |
| content-writer | новые страницы и статьи | раз в месяц |
| reporter | отчёт клиенту | раз в месяц |

Оркестратор — `CLAUDE.md` + команды в `.claude/commands/`.

## Установка
```bash
cd seo-agents
pip install -r requirements.txt
export PSI_API_KEY=...            # ключ PageSpeed Insights (Google Cloud → APIs → PageSpeed Insights API)
export GSC_CREDENTIALS=/path/key.json   # JSON сервисного аккаунта с Search Console API
claude
```

### Доступ к Search Console клиента
1. Google Cloud: создать проект, включить **Search Console API**, создать сервисный аккаунт, скачать JSON-ключ.
2. Клиент добавляет email сервисного аккаунта в свою Search Console (Настройки → Пользователи, права «Ограниченный»).
3. В `client.yaml` указать `gsc_site`: `sc-domain:example.uz` или `https://example.uz/`.

Без GSC система работает, но без данных о запросах, кликах и позициях — отчёты будут бедными.

## Команды в Claude Code
| Команда | Что делает |
|---|---|
| `/new-client <name>` | создать папку клиента, затем (после заполнения client.yaml) аудит + ядро + базовая точка |
| `/weekly <name\|all>` | аудит + on-page правки |
| `/monthly <name\|all>` | семантика + контент + отчёт |
| `/approve <name> [id ...]` | показать / одобрить правки |

## Подключение клиента
1. `/new-client acme` — создаст `clients/acme/`.
2. Заполнить `clients/acme/client.yaml`.
3. Ещё раз `/new-client acme` — аудит, ядро, baseline.

## Автозапуск по расписанию
Claude Code в headless-режиме через cron на сервере:
```cron
# понедельник 06:00 — недельный цикл
0 6 * * 1  cd /srv/seo-agents && claude -p "/weekly all" >> logs/weekly.log 2>&1
# 1-е число 07:00 — месячный цикл
0 7 1 * *  cd /srv/seo-agents && claude -p "/monthly all" >> logs/monthly.log 2>&1
```
Для headless нужны разрешения на инструменты — см. `.claude/settings.json`.

## Следующие шаги
- Публикатор: скрипт, который берёт `changes/approved/` и вносит правки через API CMS (WordPress REST API — проще всего начать с него).
- Яндекс.Вебмастер API — для позиций в Яндексе.
- Сервис позиций/частотности (например, DataForSEO), чтобы стратег опирался на реальную частотность.
- Перенос на Claude Agent SDK, когда клиентов станет много: те же промпты агентов, плюс база и очередь.
