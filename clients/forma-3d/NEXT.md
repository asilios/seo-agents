# Где остановились (2026-11-07, еженедельный запуск)

> 2026-11-02: папка клиента переименована `clients/test` → `clients/forma-3d`, данные SEO перенесены в `seo/`. Старые записи журнала ссылаются на прежние пути.

Прочитай это первым, если продолжаешь работу по клиенту `test` (forma-3d.uz) на другом компьютере.

## Цель владельца
Сайт forma-3d.uz — минимум первая страница поиска, в идеале топ. Работу приоритизировать по влиянию на позиции, а не только по закрытию пунктов аудита.

## Google Search Console — подключён (2026-11-02)
- Ресурс `sc-domain:forma-3d.uz`, робот `seo-agents@seo-agents-513505.iam.gserviceaccount.com` (доступ работает), ключ в `secrets/gsc-key.json` — **только на рабочем компьютере**; на домашнем положить свой файл (в git его нет).
- Sitemap отправлен 2026-10-30 (238 URL).
- 2026-11-02: показов/кликов пока 0. Проверка URL: главные /ru, /uz, каталог, запчасти, доставка, бизнес — проиндексированы (краул 30.10); карточки товаров — «неизвестен Google» / «обнаружена, не проиндексирована». Данные: seo/data/gsc-2026-11-02.csv, seo/data/gsc-inspect-2026-11-02.json.
- Ключ проходил через чат — владельцу предложено перевыпустить.

## Код сайта
- Репозиторий: https://github.com/kemalshen/forma-3d (Next.js 16). Railway деплоит `main` автоматически.
- Railway собирает из архива `forma-3d-source.tar.gz` — после правок кода архив пересобрать (через Python tarfile; `rm` в shell запрещён настройками).
- Владелец разрешил править код сайта самому: только в отдельной ветке, сливает в main владелец.
- www → корень сделан правилом в Cloudflare (Redirect Rules), лимит доменов Railway исчерпан.

## Публикация (с 2026-11-02)
- Владелец разрешил сливать ветки сайта в main самим, после проверок из правила 1 CLAUDE.md. Цены, сроки, обещания — только с владельцем.
- seo-3, seo-4, seo-5 — выложены. Вход в git: сайт — `https://kemalshen@github.com/...`, этот проект — `https://asilios@github.com/...`.
- Цикл работы — modules/seo/routine/improve-cycle.md. Облачная задача «SEO forma-3d — еженедельный цикл» (trig_01SnqZYAaTRa9Xp8my6rNSTn, Opus): каждый понедельник 09:00 Ташкент (0 4 * * 1 UTC), https://claude.ai/code/routines/trig_01SnqZYAaTRa9Xp8my6rNSTn. В облаке нет ключа GSC — данные GSC подтягивать в чате.

## Еженедельный запуск 2026-11-02 (облако)
- Облачная задача НЕ видит forma-3d.uz: прокси отвечает 403 на CONNECT, WebFetch — ENOTFOUND. Аудит и выкладка остановлены. Нужно добавить forma-3d.uz и www.forma-3d.uz в сетевой доступ окружения задачи (просьба к владельцу — в reports/weekly-2026-11-02.md).
- Срез выдачи из 12 запросов: seo/data/serp-2026-11-02-weekly.md. Повторно замеренные позиции не изменились.
- 2026-11-05: **страницы PLA и PETG выложены** (/ru|uz/catalog/pla, /ru|uz/catalog/petg, коммит сайта 8de7383). Через 1–2 недели проверить позиции «pla пластик купить ташкент» (было #28 общим каталогом), «petg пластик ташкент», «pla plastik narxi toshkent» (не было в топ-30) и индексацию в GSC.
- Следующее: пагинация /uz/catalog/parts?page=N перебивает первую страницу; затем — страницы ABS/ASA, TPU, хотэнды.
- Живой сайт из облака проверяется через Firecrawl scrape (curl к forma-3d.uz заблокирован прокси).
- В архиве forma-3d-source.tar.gz `.env.example` и `README.md` отличаются от файлов в репозитории (было и раньше, на сборку не влияет).
- Новые конкуренты в выдаче: layerone.uz, levelstore.uz, globel.uz (в client.yaml пока не добавлены).
- Подсказка для запусков: системный `python` не видит requests — использовать `/usr/bin/python3`. И не писать в bash `cat > файл` без heredoc: команда зависает в ожидании ввода.

## Еженедельный запуск 2026-11-06 (облако)
- Сайт из облака снова недоступен (curl: CONNECT 403). По инструкции задачи блокировка не обходилась: аудит и выкладка пропущены. Владельцу повторно — разрешить forma-3d.uz и www.forma-3d.uz в Network access окружения задачи.
- Срез выдачи: seo/data/serp-2026-11-06-weekly.md. Рост: ehtiyot qismlar 6→3, bambu lab filament toshkent 14→11, хотэнд a1 19→15, бренд 5→1. Падение: запчасти bambu lab ташкент 13→17. PLA/PETG-страниц в выдаче ещё нет (выложены 05.11).
- Следующее действие: страница «Хотэнды и сопла» /ru|uz/catalog/hotends — seo/changes/pending/2026-11-06-category-hotends.json (по образцу app/material-pages.ts). Внедрить при доступе к сайту или в чате.
- Пагинацию /uz/catalog/parts?page=3 пока не трогать: она на #3 по «ehtiyot qismlar».
- Отчёт: reports/weekly-2026-11-06.md.

## Еженедельный запуск 2026-11-07 (облако)
- **Сайт из облака снова доступен** (curl 200; для urllib нужен User-Agent, иначе Cloudflare 403). Полный цикл: аудит, выкладка, проверка живого сайта.
- Аудит seo/audits/2026-11-07.md: 252/252 URL — 200, 0 ошибок; закрыты removed-products-404-001, long-desc-002, long-desc-003 (исправлен в этом же запуске); открыты no-offer-001, redirect-chain-001, schema-breadcrumb-001 (нет JSON-LD на /business, /delivery, /knowledge).
- **Выложено (349fab6):** страница «Хотэнды и сопла» /ru|uz/catalog/hotends (app/part-pages.ts по образцу material-pages.ts; 15 товаров; крошки Главная → Запчасти → Хотэнды; sitemap 254); сокращение description у товаров «под заказ». Живой сайт: 254/254 URL прошли все проверки.
- Срез выдачи: seo/data/serp-2026-11-07-weekly.md. Запчасти 17→9, филамент 19→17, /ru/catalog/petg впервые в выдаче (#24), «bambu lab hotend toshkent» #2 (карточка). Бренд 1→2.
- Через 1–2 недели проверить: «хотэнд bambu lab ташкент» (#18 общим parts), «хотэнд…a1 купить» (#16), «сопло bambu lab 0.4» (нет), появилась ли /catalog/hotends; PLA-страница в выдаче (пока нет).
- Следующее: BreadcrumbList на /business, /delivery, /knowledge (schema-breadcrumb-001, черновик — seo/changes/pending/2026-11-02-schema-breadcrumbs-info-pages-dryrun.json); затем страница ABS/ASA или TPU.

## GEO — видимость в ответах ИИ (2026-11-06)
- Фаза 1 готова: `geo/profile.yaml` (2 модели — Perplexity и OpenAI, бюджет $5/нед, 3 прогона на вопрос), `geo/queries.csv` — **60 вопросов к ИИ, все `pending`** (supplier 25, compare 11, price 12, local 7, info 5; ru 36, uz 24).
- **Нужно от владельца:** просмотреть список и утвердить (поменять `status` на `approved`), вычеркнуть лишнее. Приоритет 1 — главные коммерческие вопросы; на бюджет $5 первый замер пойдёт по приоритетам 1–2.
- Нужны API-ключи Perplexity и OpenAI: положить в `.env` (локально) и в секреты репозитория `asilios/seo-agents` (для GitHub Actions). В чат ключи не присылать.
- Конкуренты layerone.uz, levelstore.uz, globel.uz в профиле помечены «не подтверждён». UVIX3D (назван в обзоре Google) пока без домена.
- Дальше: Фаза 2 — `geo_monitor.py` (адаптеры Perplexity и OpenAI, разбор ответов, бюджет), сухой прогон на 5 вопросах.
- 2026-11-07: пробный прогон только ChatGPT (Perplexity владелец пока не подключает). Ключ OpenAI сохранён в облачном окружении `seo-agents` (прокси подставляет его сам; для скрипта `OPENAI_API_KEY=proxy-injected`) и принят API, но **на счёте OpenAI нет денег** — 0 ответов, $0. Нужно: пополнить баланс на platform.openai.com → Billing, затем
  `OPENAI_API_KEY=proxy-injected python modules/geo/scripts/geo_monitor.py --client forma-3d --limit-queries 5 --models openai --execute` (≤ $0.48).
- 2026-11-07: **Claude** — адаптер `ask_claude` (SDK `anthropic`, `web_search_20260209`, claude-opus-5-5, fallbacks=default) написан, в профиле включён, **вживую не проверен**: из облака Claude API без своего ключа отвечает 401, а форма секретов ключи Anthropic не принимает. Запуск — локально с `ANTHROPIC_API_KEY` в `.env` или в GitHub Actions: `python modules/geo/scripts/geo_monitor.py --client forma-3d --limit-queries 5 --models claude --execute` (≤ $3.30). Модели без ключа монитор теперь пропускает.
- 2026-11-07: срез «вслепую» через субагентов (оценка, не метрика) — geo/manual/2026-11-07-claude-proxy-slice.md: Forma 3D 0/8, OLX 8/8, bambu.uz 5/8, справочники goldenpages/yellowpages/prom.uz. Следствие: выложить объявления на OLX и карточки в справочниках — сильнее правок сайта.

## Следующие задачи после GSC
1. Отдельные страницы для статей базы знаний (`/ru/knowledge/<slug>`): сейчас статьи открываются модальным окном и не индексируются.
2. 301 для 8 удалённых URL: product/hotend-h2d, hotend-h2c, hotend-p2s, paht-cf-request-spool (ru/uz) → ждём ответ владельца, на какие товары вести, или «сам подбери».
3. Description `/uz/product/hotend-a1-04-steel` 165 символов → сократить до ≤160.
4. Google Business Profile — создан владельцем 2026-11-02 (категория «3D-печать», добавить вторую — магазин). Проверить статус подтверждения. Яндекс Карты / 2GIS — ещё нет.
5. Ежемесячно content-writer: 2–4 статьи под кластеры из seo/keywords/clusters.md.
6. Яндекс Вебмастер — владелец подключает сам.

## Цены «от 200 000 сум» (2026-11-06)
- У товаров без цены временно «от 200 000 сум» (app/catalog.ts: FROM_PRICE, NO_FROM_PRICE, fromPrice). В разметку Offer не ставится. Когда появятся реальные цены — внести их и убрать FROM_PRICE. Проверить с владельцем: смазка, многоразовая катушка, угольный фильтр — может, дешевле 200 000.
- 2026-11-06 выложено (c27021a): значки PNG/ICO, WebSite schema «Forma 3D», логотип Organization, текст и FAQ на /ru|uz/catalog/parts (стр. 1); смазка, многоразовая катушка, угольный фильтр — «Цена по запросу». Через 1–3 недели проверить значок/название в выдаче и обзор от ИИ по «bambu lab ehtiyot qismlar toshkent».
- Для обзора от ИИ сильнее всего — внешние упоминания: подтвердить Google Business Profile, завести 2GIS, Яндекс Карты, OLX, Instagram (делает владелец, тексты можем подготовить).
- Вход в git на рабочем компьютере: push в kemalshen/forma-3d — через URL https://kemalshen@github.com/kemalshen/forma-3d.git (окно Git Credential Manager).

## Открытые вопросы владельцу
- 2026-11-07: владелец разрешил публиковать настоящие цены вместо «от 200 000 сум». Самих цен в данных нет (price: null у большинства товаров) — ждём прайс от владельца (товар → цена в сумах), затем внести в app/data и убрать FROM_PRICE, добавить Offer в JSON-LD.
- 2026-11-07: на вопрос о сроке «под заказ» («2–3 недели» или «до 3 дней») владелец ответил «да» — срок не уточнён, переспросить.
- Срок «под заказ»: владелец сказал «до 3 дней», на сайте (`ORDER_LEAD_TIME` в app/stock.ts) «2–3 недели». Что верно?
- `PSI_API_KEY` пустой — PageSpeed не меряется.

## Состояние
- Последний аудит: seo/audits/2026-11-07.md — открыто: no-offer-001 (цены у 28/218), redirect-chain-001 (low), schema-breadcrumb-001 (low).
- seo/changes/pending: 2026-11-02-schema-breadcrumbs-info-pages-dryrun.json; approved пуст; хотэнды внедрены 2026-11-07 — seo/changes/applied/2026-11-06-category-hotends.json.

## Разработка модуля соцсетей и интерфейса (docs/prompt-social-module.md)
- Фаза 0 (план) — одобрена 2026-11-02, кратко — docs/system-overview.md.
- Фаза 1 (реорганизация) — слита в master 2026-11-02 (1fbe93b). Проверено: check_paths.py без ошибок, crawl/gsc из новых мест, сухие прогоны auditor и onpage-optimizer.
- Промпт облачной задачи обновлён под новые пути 2026-11-02. Run now — после того как владелец снимет блокеры ниже.

## Блокеры облачной задачи — состояние на 2026-11-02 вечер
Тестовая задача доступов: `trig_015dUL7Ce7HmwWStPLqgF89D` (Sonnet, только Bash; повторять через RemoteTrigger action `run`, лог — `get_run_log`; оставляет ветку `access-test-2026-11-02` — удалять).
Последний тест (3-й):
- запись в `kemalshen/forma-3d` — ✅ (claude.ai GitHub сейчас привязан к kemalshen);
- запись в `asilios/seo-agents` — ❌ 403;
- сайт forma-3d.uz из облака — ❌ прокси 403 (сеть окружения).
Что сделать владельцу:
1. Как asilios: https://github.com/asilios/seo-agents/settings/access → Add people → `kemalshen` → Write; принять приглашение под kemalshen.
2. https://claude.ai/code/routines/trig_01SnqZYAaTRa9Xp8my6rNSTn → окружение Default → Network access → разрешить `forma-3d.uz`, `www.forma-3d.uz`.
3. Потом повторить тест доступов; если всё ✅ — run now основной задачи `trig_01SnqZYAaTRa9Xp8my6rNSTn` и разобрать лог.

## Следующий шаг разработки
- 2026-11-04: Фаза 2 (соцсети) — **на паузе** по решению владельца. Сначала доработка модуля SEO
  по плану `docs/seo-upgrade-plan.md` (4 этапа: замер позиций и индексации → автопроверки → агенты
  growth-analyst / local-offpage / site-implementer → обобщение). Ждёт подтверждения владельца.
- Домашний компьютер: проект в `OneDrive\Рабочий стол\Новая папка\seo-agents`, ключа GSC нет.
