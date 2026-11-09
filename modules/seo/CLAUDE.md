# Модуль SEO

Цель: вывести сайт клиента на первую страницу поиска, в идеале в топ. Успех меряется позициями,
показами и кликами, а не количеством закрытых пунктов аудита. Постоянный цикл — `modules/seo/routine/improve-cycle.md`.

## Агенты (`.claude/agents/`)

| Агент | Что делает | Когда |
|---|---|---|
| `auditor` | технический аудит сайта | еженедельно |
| `keyword-strategist` | семантика, кластеры, конкуренты | ежемесячно (и при новом клиенте) |
| `onpage-optimizer` | правки title/description/H1/alt/перелинковки/schema | еженедельно, после аудита |
| `content-writer` | новые страницы и статьи под кластеры | ежемесячно, после стратега |
| `reporter` | отчёт клиенту, сравнение с базовой точкой | ежемесячно, последним |

## Данные клиента (`clients/<client>/seo/`)

```
clients/<client>/
  client.yaml                 общий профиль (в корне папки клиента)
  NEXT.md                     где остановились (в корне папки клиента)
  reports/YYYY-MM.md          отчёты клиенту (в корне папки клиента)
  seo/
    baseline.md               метрики на день старта — НЕ перезаписывать
    data/                     сырые выгрузки скриптов (crawl, pagespeed, gsc, serp)
    audits/YYYY-MM-DD.md      отчёты аудитора
    audits/issues.json        актуальный список проблем
    keywords/clusters.md      семантическое ядро и кластеры
    content/                  черновики статей
    changes/pending/          предложенные правки
    changes/approved/         одобренные
    changes/applied/          внедрённые на сайт
    log.md                    журнал модуля
```

## Скрипты

- общие: `core/scripts/crawl.py`, `core/scripts/gsc.py` (см. `core/CLAUDE.md`);
- SEO: `python modules/seo/scripts/keyword_volumes.py export|import|score --client <client>` — частотность запросов:
  `export` даёт список для загрузки в Keyword Planner/Wordstat, `import --source planner|wordstat|keycollector --file ...`
  складывает цифры в `seo/data/volumes.csv`, `score` пересчитывает приоритеты кластеров в `seo/keywords/priorities.md`.
  `keyword-strategist` и недельный срез выдачи берут приоритеты из `priorities.md`; нет цифры — «нет данных», не оценка.
- SEO: `python modules/seo/scripts/pagespeed.py <urls...> --out clients/<client>/seo/data/psi-<date>.json`
  (ключ `PSI_API_KEY` в `.env`, без него — 429).

## Циклы

**Новый клиент** (`/new-client <name>`):
1. Создать папку по шаблону `clients/_template/`.
2. `auditor` → полный аудит.
3. `keyword-strategist` → первое ядро.
4. Заполнить `seo/baseline.md` из данных аудита и GSC.

**Еженедельно** (`/weekly <client>`):
1. `auditor` → новый аудит, обновить `issues.json`.
2. `onpage-optimizer` → правки по новым и неисправленным проблемам.

**Ежемесячно** (`/monthly <client>`):
1. `keyword-strategist` → обновить кластеры.
2. `content-writer` → 2–4 материала под приоритетные кластеры без страниц.
3. `reporter` → отчёт за месяц.

## Проверки перед слиянием изменений сайта (правило 1 из `core/CLAUDE.md`)

`pnpm typecheck` и `pnpm build` без ошибок; локальный запуск; все URL из sitemap отдают 200;
на каждой странице один `<h1>`; title ≤60, description ≤160; нет кириллицы на `/uz/*`;
нет «[УТОЧНИТЬ»; архив сборки (у forma-3d — `forma-3d-source.tar.gz`) пересобран и совпадает с кодом.
После выкладки — проверить живой сайт (ключевые URL 200, sitemap).
