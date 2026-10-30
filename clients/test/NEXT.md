# Где остановились (2026-10-30)

Прочитай это первым, если продолжаешь работу по клиенту `test` (forma-3d.uz) на другом компьютере.

## Цель владельца
Сайт forma-3d.uz — минимум первая страница поиска, в идеале топ. Работу приоритизировать по влиянию на позиции, а не только по закрытию пунктов аудита.

## Сейчас в процессе: подключение Google Search Console
- Этап 1 сделан: доменный ресурс `sc-domain:forma-3d.uz` подтверждён, `gsc_site` вписан в client.yaml.
- Проверить, отправлен ли sitemap `https://forma-3d.uz/sitemap.xml` (Search Console → Файлы Sitemap).
- **Этап 2 (делает владелец дома, на работе console.cloud.google.com заблокирован):**
  1. console.cloud.google.com → New Project `seo-agents`.
  2. Включить Google Search Console API: https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
  3. IAM & Admin → Service Accounts → Create service account `seo-agent` (роли не нужны).
  4. Keys → Add key → JSON → сохранить как `secrets/gsc-key.json` (в git не попадает).
- **Этап 3:** Search Console → Настройки → Пользователи и разрешения → добавить email робота с правом «Ограниченный».
- Затем: проверить `python scripts/gsc.py --site sc-domain:forma-3d.uz --days 28 --out clients/test/data/gsc-YYYY-MM-DD.csv`. Первые 2–3 дня после подтверждения данные могут быть пустыми — это нормально.
- Ключ `secrets/gsc-key.json` и `.env` через GitHub не синхронизируются — на каждом компьютере свои. В `.env`: `GSC_CREDENTIALS=secrets/gsc-key.json`.
- Запасной вариант, если Cloud не откроется: вручную экспорт CSV из Search Console (Эффективность → Экспортировать) в `clients/test/data/`.

## Код сайта
- Репозиторий: https://github.com/kemalshen/forma-3d (Next.js 16). Railway деплоит `main` автоматически.
- Railway собирает из архива `forma-3d-source.tar.gz` — после правок кода архив пересобрать (через Python tarfile; `rm` в shell запрещён настройками).
- Владелец разрешил править код сайта самому: только в отдельной ветке, сливает в main владелец.
- www → корень сделан правилом в Cloudflare (Redirect Rules), лимит доменов Railway исчерпан.

## Следующие задачи после GSC
1. Отдельные страницы для статей базы знаний (`/ru/knowledge/<slug>`): сейчас статьи открываются модальным окном и не индексируются.
2. 301 для 8 удалённых URL: product/hotend-h2d, hotend-h2c, hotend-p2s, paht-cf-request-spool (ru/uz) → ждём ответ владельца, на какие товары вести, или «сам подбери».
3. Description `/uz/product/hotend-a1-04-steel` 165 символов → сократить до ≤160.
4. Google Business Profile / Яндекс Карты / 2GIS (Ташкент, Навои) — адрес скрыть (офис, клиентов не принимают), зона обслуживания.
5. Ежемесячно content-writer: 2–4 статьи под кластеры из keywords/clusters.md.
6. Яндекс Вебмастер — владелец подключает сам.

## Открытые вопросы владельцу
- Срок «под заказ»: владелец сказал «до 3 дней», на сайте (`ORDER_LEAD_TIME` в app/stock.ts) «2–3 недели». Что верно?
- Куда вести 301 со старых товаров (см. п. 2).
- `PSI_API_KEY` пустой — PageSpeed не меряется.

## Состояние
- Последний аудит: audits/2026-10-30.md — открыто: no-offer-001 (цены у 28/218), removed-products-404-001, redirect-chain-001 (low), long-desc-002.
- changes/pending и changes/approved пусты, всё внедрённое — в changes/applied.
