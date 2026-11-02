---
description: Подключить нового клиента — аудит, ядро, базовая точка
argument-hint: <client-name>
---

Подключаем клиента `$ARGUMENTS`.

1. Если папки `clients/$ARGUMENTS/` нет — скопируй `clients/_template/` в `clients/$ARGUMENTS/`
   и остановись: попроси заполнить `client.yaml` (как минимум domain, languages, region, services).
2. Если `client.yaml` заполнен — проверь обязательные поля. Пустые — перечисли и остановись.
3. Запусти субагента `auditor` для `$ARGUMENTS`.
4. Запусти субагента `keyword-strategist` для `$ARGUMENTS`.
5. Заполни `clients/$ARGUMENTS/seo/baseline.md` по шаблону из файла, только из данных в `clients/$ARGUMENTS/seo/data/`.
   Если baseline.md уже заполнен — не трогай его.
6. Запиши каждый шаг в `clients/$ARGUMENTS/seo/log.md`.
7. Итог: 5 главных проблем сайта и 5 приоритетных кластеров.
