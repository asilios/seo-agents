# Модуль GEO — архитектура (план, 2026-11-06)

Статус: **план, код не писался.** Ждёт «ок» владельца и ответов на вопросы в конце.

Цель: чтобы ChatGPT, Perplexity, Gemini и Claude называли компанию клиента, когда пользователи
спрашивают про его нишу. Модуль универсальный: ниша, языки (ru / uz-Latn / en), конкуренты и регион —
только в `clients/<client>/geo/profile.yaml`. В агентах, скриптах и шаблонах отраслевых слов нет.

## 1. Что важно понимать до кода

- **Метрика — оценка, а не истина.** API с веб-поиском отвечают не так же, как приложение ChatGPT или
  Gemini для обычного пользователя: другая выдача, нет истории и персонализации. Ответы случайны, поэтому
  каждый вопрос гоняем 3–5 раз. Результат — доля, а не «да/нет». Показываем доверительный интервал.
- **Недельная динамика шумит.** При ~50 вопросах × 3 прогона × 4 модели колебания в несколько процентных
  пунктов — шум. В интерфейсе рядом с неделей показываем 4-недельное скользящее среднее и интервал,
  а выводы «выросли / упали» — только если интервалы не пересекаются.
- **Мониторинг — скрипт, а не агент Claude.** Прогон 1 000+ запросов к API — детерминированная работа с
  жёстким бюджетом. Агенты (LLM) нужны там, где нужно суждение: придумать вопросы, интерпретировать
  источники, написать текст.
- **Нужны 4 API-ключа** (OpenAI, Perplexity, Google AI/Gemini, Anthropic). Подписка Claude Code — не API.
  Ключей в облачной задаче нет, а сеть окружения закрыта (см. `docs/system-overview.md`).
  Поэтому недельный прогон — GitHub Actions с секретами репозитория или локальный запуск.
- **llms.txt** — дёшево добавить, но провайдеры не подтвердили, что его используют. Ставим как низкий приоритет.
  Основной эффект даёт то, что ИИ цитирует: страницы, карточки на внешних площадках, отзывы.

## 2. Компоненты

```
/geo-weekly <client>           оркестратор (команда в .claude/commands/)
 ├─ 1. geo-query-mapper        агент      → geo/queries.csv (pending → approved)
 ├─ 2. geo_monitor.py          скрипт     → geo/runs/<неделя>/…  (сырые ответы, не в git)
 │                                          geo/observations.jsonl (разбор, в git)
 ├─ 3. geo_aggregate.py        скрипт     → geo/geo.db (производная), geo/metrics/*.json,
 │                                          geo/citations/<неделя>.csv
 │      geo-citation-analyst   агент      → geo/citations/<неделя>.md, задачи в geo/offsite/queue/
 ├─ 4. geo-onsite-optimizer    агент      → geo/changes/pending/…  (дальше — общий путь внедрения)
 └─ 5. geo-offsite-agent       агент      → geo/offsite/queue/*.md (только pending, ничего не отправляет)
```

| Компонент | Тип | Как работает |
|---|---|---|
| Query Mapper | агент | Вход: `client.yaml` + главная страница + описание. Через WebFetch читает сайт, смотрит подсказки и «Похожие запросы» в выдаче. Выход: 30–100 вопросов, как их задал бы человек ИИ, по интентам: `supplier` (где купить / найти поставщика), `compare` (сравнение), `price` (цены), `local` (с городом / районом). Необязательно `info` («как выбрать…») — они приводят ИИ к статьям. Каждый вопрос на языках из профиля. В `pending`, владелец утверждает. |
| Visibility Monitor | скрипт | Для каждого вопроса × модели × N прогонов зовёт API с веб-поиском. Задаёт вопрос дословно, без подсказок в системном промпте. Сохраняет ответ, ссылки, версию модели и инструмента. Адаптеры по провайдерам в одном интерфейсе. Предохранитель: перед запуском печатает число вызовов и верхнюю оценку стоимости, останавливается при превышении `budget_usd` из профиля. Повторяет при 429/5xx, ошибку пишет в `answer.status`, а не молча пропускает. |
| Разбор ответа | модуль скрипта | Упоминание клиента: домен в ссылках, домен или бренд (с синонимами и транслитом: «Forma 3D», «Форма-3D») в тексте. Список названных компаний и их порядок — извлекает дешёвая модель по схеме JSON; 5% ответов выборочно проверяются вручную. Для сомнительных совпадений поле `match_type` и флаг `needs_review`. |
| Citation Analyst | скрипт + агент | Скрипт: агрегация доменов по всем ответам, классификация типа площадки (маркетплейс, объявления, карты, соцсети, СМИ, каталоги, форумы). Агент: превращает топ источников в приоритетный список «где получить упоминание» с оценкой усилий и ссылкой на пример, где конкурент уже есть. |
| On-site Optimizer | агент | Аудит сайта под ответы ИИ: answer-first абзацы в начале страницы (кто мы, что, где, для кого, условия), FAQ-блоки, JSON-LD (Organization, LocalBusiness, Product, FAQPage), `llms.txt`, одинаковые название / телефон / адрес на сайте и во внешних карточках. Правки — в `geo/changes/pending/`, дальше **общий путь внедрения** с SEO (ветка, проверки, слияние по правилу 1 `core/CLAUDE.md`). |
| Off-site Agent | агент | Черновики заявок в каталоги, тексты для PR, шаблоны запросов отзывов. Всё — в `geo/offsite/queue/` со статусом `pending`. Агент **не отправляет ничего**: ни почту, ни формы. Отправляет владелец, затем помечает `done`. |

## 3. Данные клиента

```
clients/<client>/geo/
  profile.yaml             бренд (синонимы, домены), конкуренты, языки, регионы, модели, прогонов на вопрос, бюджет
  queries.csv              id, text, lang, intent, region, priority, status (pending|approved|retired)
  observations.jsonl       одна строка = один ответ: без полного текста, с разбором (в git, источник правды)
  runs/<YYYY-Www>/         сырые ответы ИИ (в .gitignore; хранить 90 дней для повторного разбора)
  geo.db                   SQLite, производная от observations.jsonl (в .gitignore, пересобирается)
  metrics/<YYYY-Www>.json  метрики за неделю; metrics/latest.json — для интерфейса
  citations/<YYYY-Www>.csv / .md
  changes/pending|approved|applied/    правки сайта (тот же жизненный цикл, что в SEO)
  offsite/queue/           pending → approved → done
  log.md                   журнал: дата | агент | что сделано | файлы
```

Почему файлы, а не только база: репозиторий синхронизируется между компьютерами через git, бинарный
файл базы конфликтует. Поэтому источник правды — текстовые `observations.jsonl` и `queries.csv`, а
SQLite нужна интерфейсу и запросам и собирается одной командой.

## 4. Схема БД (SQLite, `geo.db`)

```sql
CREATE TABLE client (id TEXT PRIMARY KEY, name TEXT NOT NULL, domain TEXT NOT NULL);

CREATE TABLE brand (               -- клиент и конкуренты
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  name TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('client','competitor','other')),
  domain TEXT, aliases_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE (client_id, name));

CREATE TABLE query (
  id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  text TEXT NOT NULL, lang TEXT NOT NULL CHECK (lang IN ('ru','uz','en')),
  intent TEXT NOT NULL CHECK (intent IN ('supplier','compare','price','local','info')),
  region TEXT, priority INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','retired')));

CREATE TABLE model (               -- конфигурация модели ИИ
  id TEXT PRIMARY KEY,             -- 'openai', 'perplexity', 'gemini', 'claude'
  provider TEXT NOT NULL, api_model TEXT NOT NULL, search_tool TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1);

CREATE TABLE run (                 -- один недельный запуск
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  week TEXT NOT NULL,              -- ISO: '2026-W46'
  started_at TEXT, finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running','done','partial','failed')),
  est_cost_usd REAL, actual_cost_usd REAL, config_json TEXT NOT NULL,
  UNIQUE (client_id, week));

CREATE TABLE answer (              -- один ответ ИИ на один вопрос
  id INTEGER PRIMARY KEY, run_id INTEGER NOT NULL REFERENCES run(id),
  query_id TEXT NOT NULL REFERENCES query(id), model_id TEXT NOT NULL REFERENCES model(id),
  attempt INTEGER NOT NULL,        -- 1..N
  status TEXT NOT NULL CHECK (status IN ('ok','empty','error')), error TEXT,
  api_model_version TEXT, latency_ms INTEGER, snippet TEXT,   -- первые ~300 знаков
  client_mentioned INTEGER NOT NULL DEFAULT 0,                 -- кэш для быстрых выборок
  needs_review INTEGER NOT NULL DEFAULT 0,
  UNIQUE (run_id, query_id, model_id, attempt));

CREATE TABLE mention (             -- кого назвал ИИ в ответе
  answer_id INTEGER NOT NULL REFERENCES answer(id), brand_id INTEGER NOT NULL REFERENCES brand(id),
  position INTEGER NOT NULL,       -- порядок первого упоминания среди названных компаний, с 1
  match_type TEXT NOT NULL CHECK (match_type IN ('text','domain_cited','both')),
  PRIMARY KEY (answer_id, brand_id));

CREATE TABLE citation (            -- на что сослался ИИ
  id INTEGER PRIMARY KEY, answer_id INTEGER NOT NULL REFERENCES answer(id),
  url TEXT NOT NULL, domain TEXT NOT NULL, rank INTEGER, title TEXT);

CREATE TABLE domain (              -- справочник площадок
  domain TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('own','competitor','marketplace','classifieds',
        'maps','social','media','directory','forum','reviews','other')),
  note TEXT);

CREATE TABLE task (                -- очередь Off-site и On-site
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  kind TEXT NOT NULL CHECK (kind IN ('directory','pr','review_request','onsite')),
  target_domain TEXT, payload_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','done','rejected')),
  created_at TEXT NOT NULL, decided_at TEXT, decided_by TEXT);

CREATE INDEX ix_answer_run ON answer(run_id, model_id);
CREATE INDEX ix_citation_domain ON citation(domain);
```

### Метрики (представления)

| Метрика | Определение |
|---|---|
| **AI Visibility Score** | ответы со статусом `ok`, где назван клиент, ÷ все ответы `ok`. По неделе, по модели, по интенту, по языку. Интервал Уилсона 95%. |
| **Средняя позиция** | среднее `mention.position` клиента по ответам, где он назван. Не считается, если упоминаний мало (порог в профиле). |
| **Share of Voice** | упоминания клиента ÷ упоминания клиента и всех названных компаний. Вариант со взвешиванием по позиции — отдельным полем. |
| **Доля цитирования** | ответы со ссылкой на домен клиента ÷ все ответы `ok`. |
| **Динамика** | значения по неделям + 4-недельное среднее; разбивка по моделям ИИ. |

Для интерфейса контракт данных — `geo/metrics/latest.json` (`overall`, `by_model`, `by_intent`,
`by_lang`, `trend[]`, `top_competitors[]`, `top_domains[]`, `data_quality{answers, errors, needs_review}`).
Сам интерфейс — в общем dashboard (Фаза 5 плана соцсетей), GEO только отдаёт данные.

## 5. Подключение к оркестратору

Всё добавляется рядом, существующий SEO-цикл не меняется.

| Что | Как |
|---|---|
| Правила модуля | `modules/geo/CLAUDE.md`; в корневой `CLAUDE.md` добавить строку в таблицу модулей и `@modules/geo/CLAUDE.md` |
| Агенты | `.claude/agents/geo-query-mapper.md`, `geo-citation-analyst.md`, `geo-onsite-optimizer.md`, `geo-offsite-agent.md` |
| Команды | `/geo-map <client>`, `/geo-monitor <client>`, `/geo-weekly <client\|all>`, `/geo-approve <client>` |
| Скрипты | `modules/geo/scripts/`: `geo_monitor.py`, `geo_aggregate.py`, `providers/` (адаптеры), `schema.sql` |
| Схемы | `core/schemas/geo-profile.schema.json`; раздел `geo:` в `client.yaml` — только флаг `enabled` и путь к профилю |
| Недельный прогон | `/geo-weekly` отдельно от `/weekly` (разные ключи, бюджет, расписание). Workflow `.github/workflows/geo-weekly.yml` с секретами репозитория |
| Журнал и правила | общие правила `core/CLAUDE.md` действуют: без выдуманных фактов, строка в `log.md` после шага, остановка при ошибке |
| Правки сайта | общий путь SEO: ветка, проверки, слияние по правилу 1. Цены, сроки, обещания, контакты — только с владельцем |
| Зависимости | `requirements.txt`: `openai`, `anthropic`, `google-genai`, `PyYAML`; `.env.example`: 4 ключа и `GEO_BUDGET_USD` |
| Проверка путей | `core/scripts/check_paths.py` уже обходит `modules/**/*.md`; список клиентских подпапок дополнить `geo/` |

Что я не могу сделать сам: `.claude/settings.json` защищён от записи агентом. Разрешения на запуск
`python modules/geo/scripts/…` должен добавить владелец (список подготовлю).

## 6. Пересечение с планом доработки SEO (`docs/seo-upgrade-plan.md`)

- **`local-offpage`** (этап 3 плана SEO) и **Off-site Agent** делают почти одно и то же: карточки на
  внешних площадках, отзывы, каталоги. Предлагаю один агент `offsite-agent` с двумя источниками задач
  (локальный SEO и список от Citation Analyst). Нужно решение владельца.
- **`onpage-optimizer`** уже ведёт schema. GEO On-site Optimizer не дублирует: берёт то, чего там нет
  (answer-first, FAQ, llms.txt, согласованность данных организации) и ссылается на открытые пункты.
- **`site-implementer`** (этап 3 плана SEO) — единственный, кто вносит правки в код сайта. GEO его использует.

## 7. Фазы

| Фаза | Что | Результат |
|---|---|---|
| 0 | этот документ | одобрение |
| 1 | каркас: `modules/geo/`, схема профиля, шаблон `geo/`, `schema.sql`, Query Mapper | утверждённый список вопросов для forma-3d |
| 2 | Visibility Monitor: адаптеры 4 провайдеров, разбор, бюджет, сухой прогон на 5 вопросах | первый замер, стоимость по факту |
| 3 | агрегация, метрики, `latest.json`, Citation Analyst | список площадок по приоритету |
| 4 | On-site Optimizer | правки сайта в `pending` |
| 5 | Off-site Agent и очередь | черновики заявок, отзывы, PR |
| 6 | еженедельный workflow, `/geo-weekly`, подключение к dashboard | автозапуск |

После каждой фазы — запись в `log.md` и `NEXT.md`, проверка, что `/weekly` и `check_paths.py` не сломаны.

## 8. Риски

| Риск | Что делаю |
|---|---|
| Стоимость: вызовов = вопросы × модели × прогоны (например 60×4×3 = 720 в неделю на клиента) | жёсткий `budget_usd`, оценка до запуска, остановка при превышении; цены считаю по факту первого замера, а не по памяти |
| API-инструменты поиска меняются | перед кодом сверю актуальные версии по документации провайдеров; адаптеры изолированы |
| Ссылки Gemini приходят через redirect-адреса | адаптер разворачивает их в итоговый домен |
| Ошибки разбора ответа (кто назван, в каком порядке) | выборочная ручная проверка 5%, поле `needs_review`, версия разбора в данных |
| Узбекский: модели отвечают слабее | метрику показываем отдельно по языкам, не смешиваем в общую |
| Рост репозитория | сырые ответы вне git, в git только компактный разбор |
| Ломается SEO | ничего из существующего не переносится и не переименовывается; в общие файлы — только добавления |

## 9. Вопросы владельцу

1. **Хранение.** Согласны: текстовые файлы в git как источник правды + SQLite как производная, а не одна база?
2. **Модели.** Все четыре (OpenAI, Perplexity, Gemini, Claude) с первого запуска или начать с двух?
3. **Где запускать раз в неделю.** GitHub Actions с секретами (рекомендую) или локально на вашем компьютере?
4. **Бюджет.** Сколько долларов в неделю на клиента допустимо? Без этого значения скрипт не стартует.
5. **Off-site.** Объединить с `local-offpage` в одного агента `offsite-agent`?
6. **Ключи.** Кто заведёт 4 API-ключа и положит в `.env` и секреты репозитория (я ключи не создаю и не запрашиваю в чате)?
7. **Первый клиент.** forma-3d — и нужна ли отдельная демо-ниша, чтобы проверить универсальность?
