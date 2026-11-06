# Обзор системы

Система агентов на базе Claude Code для сайтов клиентов. Репозиторий `asilios/seo-agents`, основная ветка `master`.
Первый клиент — forma-3d.uz (`clients/forma-3d/`).

## Модули
- **SEO** — работает. Цель: первая страница поиска / топ. Правила `modules/seo/CLAUDE.md`, цикл `modules/seo/routine/improve-cycle.md`.
- **GEO** — Фаза 1 готова (2026-11-06): правила `modules/geo/CLAUDE.md`, профиль и 60 вопросов к ИИ для forma-3d на утверждении. План: `docs/geo-architecture.md`.
- **Соцсети** — в разработке по `docs/prompt-social-module.md` (план, тексты, видео, публикация).
- **Интерфейс (dashboard)** — в разработке, Фаза 5.

## Структура
```
CLAUDE.md                 назначение и модули; импортирует core/CLAUDE.md и modules/seo/CLAUDE.md
core/CLAUDE.md            общие правила: синхронизация, публикация через проверки, без выдуманных фактов, журнал
core/scripts/             crawl.py, gsc.py, check_paths.py (проверка путей)
modules/seo/              CLAUDE.md, routine/improve-cycle.md, scripts/pagespeed.py
modules/geo/              CLAUDE.md, scripts/schema.sql, scripts/validate_geo.py (Фаза 2+: geo_monitor.py и др.)
.claude/agents/           auditor, keyword-strategist, onpage-optimizer, content-writer, reporter (+ social-* в Фазе 2)
.claude/commands/         new-client, weekly, monthly, approve
clients/<client>/         client.yaml, NEXT.md, reports/, seo/ (baseline, data, audits, keywords, content, changes, log)
clients/_template/        шаблон новой папки клиента; папки на «_» циклы all пропускают
docs/                     этот обзор и задачи
```

## Запуск
- В чате Claude Code: `/new-client`, `/weekly`, `/monthly`, `/approve`.
- По расписанию: облачная задача `trig_01SnqZYAaTRa9Xp8my6rNSTn` — понедельник 09:00 Ташкент, Opus, репозитории `asilios/seo-agents` + `kemalshen/forma-3d`, Firecrawl.
  Известные блокеры: сеть окружения не пускает к forma-3d.uz; нет прав записи (Claude GitHub App). Ключа GSC в облаке нет.

## Проверка после изменений структуры
```
python core/scripts/check_paths.py --client forma-3d
python core/scripts/crawl.py https://forma-3d.uz --max-pages 5 --out <tmp>.json
python core/scripts/gsc.py --site sc-domain:forma-3d.uz --days 7 --out <tmp>.csv
```

## Ход работ по модулю соцсетей
| Фаза | Что | Статус |
|---|---|---|
| 0 | изучение и план | одобрено 2026-11-02 |
| 1 | реорганизация репозитория | в master 2026-11-02 |
| 2 | профиль соцсетей, агенты, проверки, команды | — |
| 3 | видео (Remotion, R2) | — |
| 4 | публикация, GitHub Actions | — |
| 5 | интерфейс | — |
| 6 | первый клиент + демо-ниша | — |
