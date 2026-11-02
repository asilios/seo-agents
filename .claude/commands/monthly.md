---
description: Ежемесячный цикл — семантика, контент, отчёт клиенту
argument-hint: <client-name | all>
---

Ежемесячный цикл для `$ARGUMENTS`.
Если `all` — по очереди для каждой папки в `clients/`, кроме служебных (имя начинается с `_`: `_template`, `_demo-*`).

Для каждого клиента:
1. Субагент `keyword-strategist`.
2. Субагент `content-writer` (количество материалов — `content_per_month` из client.yaml, по умолчанию 2).
3. Субагент `reporter`.
4. Строки в `clients/<client>/seo/log.md`.

Итог: путь к отчёту (`clients/<client>/reports/`), сколько материалов написано, сколько правок ждёт одобрения.
