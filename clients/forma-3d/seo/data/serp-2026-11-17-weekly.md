# Срез выдачи 2026-11-17 (еженедельный запуск, Firecrawl search, location: Uzbekistan, топ-30)

Позиции приблизительные: выдачу искажают персонализация и местоположение датацентра. Сравнение — с data/serp-2026-11-16-weekly.md (срез сделан накануне, разница в один день — в основном колебания выдачи).
GSC в облаке недоступен — показов и кликов нет. Снято 15 запросов (12 из прошлого среза + 3 новых по «Инженерным пластикам»), около 90 кредитов Firecrawl. Не снимались (выдача пустая или сломана в прошлые разы): «сопло bambu lab 0.4 купить», «forma-3d.uz», «bambu lab hotend toshkent», «abs/tpu пластик ташкент».

| # | Запрос | forma-3d.uz сейчас | 2026-11-16 | Топ-3 домена |
|---|---|---|---|---|
| 1 | филамент bambu lab ташкент | #28 /ru/catalog | #25 | выдача искажена: первые 10 мест — сайты со словом «Lab» не по теме; дальше 3dbozor (Instagram/сайт), market.yandex.uz |
| 2 | пластик для 3d принтера ташкент | нет | нет | olx.uz, 3dbozor.uz, 3d-reality.uz |
| 3 | хотэнд bambu lab a1 купить ташкент | #28 /ru | #23 /ru | 3dbozor.uz, olx.uz, bambu.uz |
| 4 | bambu lab filament toshkent | **#8 /uz/catalog** | #7 | store.bambulab.com, 3dbozor.uz, eu.store.bambulab.com |
| 5 | pla пластик купить ташкент | нет | нет | olx.uz, maxcom.uz, 3dbozor.uz |
| 6 | petg пластик ташкент | нет | нет | olx.uz, 3dbozor.uz, diyshop.uz (liniya3d.uz/filament/petg/ — #4, цена в сниппете) |
| 7 | запчасти bambu lab ташкент | #19 /ru, #27 /ru/product/repair-belts | #6 /ru | bambu.uz, ozon.uz, olx.uz |
| 8 | bambu lab ehtiyot qismlar toshkent | **#3 /uz/catalog/parts?page=3**, #19 /uz/catalog/parts | #4 /uz | instagram.com, yandex.uz/maps |
| 9 | pla plastik narxi toshkent | нет | нет | olx.uz, prom.uz, 3dpie.uz |
| 10 | textured pei plate bambu lab ташкент | **#8 /uz/product/textured-plate**, #27 (дубль) | #4 /ru/product/textured-plate-180 | ca/eu.store.bambulab.com, setterox.com |
| 11 | хотэнд bambu lab ташкент | #19 /ru/catalog/hotends | #15 | market.yandex.uz, olx.uz, bambu.uz (в середине — 7 ссылок reddit) |
| 12 | сопло для 3d принтера bambu lab ташкент | нет | #10 /ru | market.yandex.uz, olx.uz, ozon.uz |
| 13 | карбоновый пластик для 3d принтера ташкент (новый) | нет | — | 3dbozor.uz, olx.uz, filament.uz |
| 14 | поликарбонат пластик для 3d принтера ташкент (новый) | нет | — | листовой поликарбонат (met-trans.uz и др.), 3dbozor.uz #5 |
| 15 | pla-cf пластик bambu lab ташкент (новый) | #19 /ru/product/pla-cf-black-spool | — | market.yandex.uz, ozon.uz, lider-3d.ru; bambu.uz #4 |

## Выводы
- **За сутки большинство позиций сдвинулось вниз** (запчасти 6→19, сопло 10→нет, хотэнд 15→19, textured pei 4→8). Сайт не менялся до выкладки сегодня, аудит регрессий не нашёл — это похоже на колебания выдачи между двумя соседними днями, а не на реальное падение. Смотреть на тренд через неделю.
- Держатся: filament toshkent #8, ehtiyot qismlar #3 (страница 3 раздела запчастей).
- /catalog/engineering (выложена 16.11) в выдаче ещё нет — прошли сутки. По «pla-cf» ранжируется карточка PLA-CF (#19).
- Главная /ru ранжируется по «хотэнд…a1» (#28) вместо раздела «Хотэнды и сопла» — поэтому сегодня кнопка «Сопла и хотэнды» на главной переведена на /catalog/hotends.
- У конкурентов по PLA/PETG (liniya3d.uz, bambu.uz) в сниппете цена — по-прежнему главное отставание; цены публикует только владелец.
