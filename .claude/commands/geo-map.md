---
description: GEO — составить список вопросов к ИИ для клиента
argument-hint: <client-name>
---

Составляем карту вопросов к ИИ для `$ARGUMENTS`.

1. Проверь `clients/$ARGUMENTS/geo/profile.yaml`. Если папки `geo/` нет — скопируй `clients/_template/geo/`
   в `clients/$ARGUMENTS/geo/`, попроси заполнить профиль и остановись.
2. Запусти `python modules/geo/scripts/validate_geo.py --client $ARGUMENTS`. Ошибки профиля — остановись и перечисли.
3. Запусти субагента `geo-query-mapper` для `$ARGUMENTS`.
4. Снова запусти `validate_geo.py`. Ошибки — остановись и сообщи.
5. Запиши шаги в `clients/$ARGUMENTS/geo/log.md`.
6. Итог владельцу: сколько вопросов по интентам и языкам, примеры по 2–3 из каждой группы и просьба
   утвердить список (`status: approved` в `queries.csv`) перед первым замером.
