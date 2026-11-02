---
description: Показать правки на одобрение и перенести одобренные
argument-hint: <client-name> [id ...]
---

Работа с правками клиента (первое слово `$ARGUMENTS` — клиент, остальные — id правок).

- Если id не указаны — покажи список файлов из `clients/<client>/seo/changes/pending/`:
  id, URL, какие поля меняются, было → стало. Коротко, таблицей.
- Если id указаны — перенеси эти файлы в `clients/<client>/seo/changes/approved/`, поставь `"status": "approved"`
  и дату одобрения. Запиши в `clients/<client>/seo/log.md`.

Сам перенос ничего не публикует; внедрение — по правилу 1 `core/CLAUDE.md`.
