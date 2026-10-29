# SEO-правки для forma-3d.uz: ТЗ для внедрения в код сайта

**Кому:** Claude, который работает с исходным кодом сайта forma-3d.uz.
**От:** SEO-аудит от 2026-10-29: краулер прошёл 251 страницу, ниже правки, одобренные владельцем сайта.
**Задача:** внести изменения в код или шаблоны сайта. Языки сайта — `/ru/` и `/uz/`, узбекский на латинице с апострофом `‘` (U+2018), как сейчас.

## Правила

1. **Не выдумывай данные.** Цены, остатки, адреса, телефоны и названия компаний бери только из этого ТЗ или из БД и кода сайта. Если значения нет, оставь поле пустым или не выводи его. Никаких заглушек вроде «[УТОЧНИТЬ]», «0», «XXX» в продакшн.
2. **Разметка JSON-LD должна совпадать с видимым текстом.** Если в разметке телефон, адрес или цена, то же самое должно быть видно на странице.
3. **На `/uz/*` в title, description и H1 не должно быть кириллицы.**
4. **Title не длиннее 60 символов, description не длиннее 160.** Готовые значения ниже уже укладываются в лимиты.
5. **Сначала шаблоны, потом отдельные страницы.** Многие правки (карточки товаров, подвал) делаются в одном шаблоне и сразу покрывают сотни URL.
6. **Если в коде всё устроено не так**, как здесь предполагается (например, H1 — не тег `<h1>`, или поля «формат» нет в данных), сделай ближайшее по смыслу и напиши об этом в отчёте. Если не уверен, спроси владельца.
7. **Деплой** — только после того, как владелец посмотрит изменения.

## Перед началом: три вопроса владельцу

1. **Цены и остатки на сайте настоящие?** Сейчас в подвале «Демонстрационная версия», на карточках «Цены и остатки — примеры». Если данные ненастоящие, задачу 1.5 (убрать надпись) **не делать**. Остальное делать можно.
2. **Катушка и рефилл.** По умолчанию делаем **вариант A** (задача 1.3): две отдельные карточки, которые явно различаются. Если владелец хочет вариант B (одна карточка с выбором формата), см. приложение в конце.
3. **Названия компаний на логотипах главной:** baxt-textile, ngmk, nzbt, narbahor-textile. В alt сейчас предложены «Baxt Textile», «NGMK», «NZBT», «Narbahor Textile». Владелец может поправить написание.

---

## Часть 1. Изменения в шаблонах и логике (по приоритету)

### 1.1. Шаблон карточки товара: title, H1, description и поле «Формат»

**Где:** шаблон страницы `/ru/product/*` и `/uz/product/*`, всего 216 страниц (108 товаров × 2 языка).

**Что не так сейчас:**
- В title попадает служебный текст из поля совместимости: «Подбор по модели», «Для печатного стола», «Обслуживание принтера», «Для хранения филамента», «Подбор по размеру катушек», «Для обслуживания сопла». На `/uz/` этот текст русский.
- H1 у филамента — только название линейки: «Bambu Lab PLA Basic» стоит на 40 страницах.
- У пары «катушка / рефилл» одного цвета одинаковые title, H1 и description.
- 124 title длиннее 60 символов.

**Данные, которые нужны шаблону:**
- `line` — линейка: PLA Basic, PLA Matte, PETG HF, ABS, ASA, TPU 95A HF, PLA-CF, PLA Silk…
- `color_ru` / `color_uz` — цвет со строчной буквы: «чёрный» / «qora».
- `format` — `spool` (катушка), `refill` или `request` (под заказ, slug `*-request-spool`).
  - **Бери формат из данных товара, не из slug.** В листинге `/ru/catalog` под карточкой уже выводится «Чёрный · катушка · 1 кг» или «Чёрный · рефилл». Используй это же поле.
  - Ловушка: `pla-basic-blue` без суффикса — это **рефилл**, а `pla-basic-black`, `pla-basic-green`, `pla-matte-white`, `petg-hf-orange` и `petg-hf-white` без суффикса — **катушки**.
- `compat_models` — **только реальные модели принтеров** (A1/A1 mini, P1P/P1S, X1/X1C…). Служебные фразы вроде «Подбор по модели» из этого поля убрать. Если модели неизвестны, оставить поле пустым.
- `name_ru` / `name_uz` — название запчасти.
- `price` — из БД; если цены нет, поле пустое.

**Поле «Формат» на странице товара** сейчас пустое. Заполни и показывай:
- ru: «Катушка 1 кг» / «Рефилл 1 кг (без катушки)»
- uz: «G‘altakda 1 kg» / «Refill 1 kg (g‘altaksiz)»

**Шаблоны title:**

| тип | ru | uz |
|---|---|---|
| катушка | `Bambu Lab {line} {color_ru}, катушка 1 кг \| Forma 3D` | `Bambu Lab {line} {color_uz}, g‘altakda 1 kg \| Forma 3D` |
| рефилл | `Bambu Lab {line} {color_ru}, рефилл без катушки \| Forma 3D` | `Bambu Lab {line} {color_uz}, refill (g‘altaksiz) \| Forma 3D` |
| под заказ | `Bambu Lab {line} под заказ, катушка 1 кг \| Forma 3D` | `Bambu Lab {line} buyurtmaga, g‘altakda 1 kg \| Forma 3D` |
| запчасть | `{name_ru} для Bambu Lab {compat_models} \| Forma 3D`; если моделей нет: `{name_ru} для Bambu Lab — купить в Ташкенте \| Forma 3D` | `Bambu Lab {compat_models} {name_uz} \| Forma 3D`; если моделей нет: `Bambu Lab uchun {name_uz} — Toshkentda \| Forma 3D` |

Если title длиннее 60 символов, сокращай по шагам:
1. убери «Bambu Lab » в начале (только у филамента);
2. у запчастей сократи модели до серий (A1/P1/X1);
3. убери «— купить в Ташкенте» / «— Toshkentda».

Никогда не обрезай слово посередине.

**Шаблоны H1:**

| тип | ru | uz |
|---|---|---|
| катушка | `Bambu Lab {line} {color_ru} — 1 кг на катушке` | `Bambu Lab {line} {color_uz} — g‘altakda 1 kg` |
| рефилл | `Bambu Lab {line} {color_ru} — рефилл 1 кг без катушки` | `Bambu Lab {line} {color_uz} — refill 1 kg, g‘altaksiz` |
| под заказ | `Bambu Lab {line} — под заказ, 1 кг на катушке` | `Bambu Lab {line} — buyurtmaga, g‘altakda 1 kg` |
| запчасть | колонка `proposed_h1` в CSV (ниже) | то же |

**Шаблоны description** (не длиннее 160 символов):
- **катушка, ru:** `Bambu Lab {line} {color_ru} на катушке, 1 кг, 1,75 мм. Оригинальный филамент, доставка по Ташкенту в день заказа или на следующий.` + если есть цена: ` Цена {price} сум.`, иначе: ` Поможем с выбором.`
- **рефилл, ru:** `Рефилл Bambu Lab {line} {color_ru}: 1 кг филамента 1,75 мм без катушки, для многоразовой катушки. Доставка по Ташкенту в день заказа или на следующий.` С ценой: `Рефилл Bambu Lab {line} {color_ru}: 1 кг филамента 1,75 мм без катушки. Цена {price} сум. Доставка по Ташкенту в день заказа или на следующий.`
- **под заказ, ru:** `Bambu Lab {line} под заказ: 1 кг на катушке, 1,75 мм. Цвет и срок поставки уточним при заказе. Оригинальная продукция Bambu Lab.`
- **катушка, uz:** `Bambu Lab {line} {color_uz} g‘altakda, 1 kg, 1,75 mm. Original filament. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz.` + ` Narxi {price} so‘m.` или ` Tanlashga yordam beramiz.`
- **рефилл, uz:** `Bambu Lab {line} {color_uz} refill: 1 kg, 1,75 mm, g‘altaksiz — qayta ishlatiladigan g‘altak uchun. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz.` С ценой: `Bambu Lab {line} {color_uz} refill: 1 kg, 1,75 mm, g‘altaksiz. Narxi {price} so‘m. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz.`
- **под заказ, uz:** `Bambu Lab {line} buyurtmaga: g‘altakda 1 kg, 1,75 mm. Rang va yetkazish muddatini buyurtmada aniqlaymiz. Original Bambu Lab mahsuloti.`
- **запчасть, ru:** `{name_ru} для Bambu Lab {compat_models}.` + ` Цена {price} сум.` (если есть) + ` Оригинальная запчасть, доставка по Ташкенту в день заказа или на следующий. Подберём по модели.` Для наборов `maintenance-kit-*` (собственные наборы Forma 3D) слов «оригинальная запчасть» нет: ` Доставка по Ташкенту…`.
- **запчасть, uz:** `Bambu Lab {compat_models} uchun {name_uz}.` + ` Narxi {price} so‘m.` + ` Original ehtiyot qism, Toshkentda buyurtma kuni yoki ertasiga yetkazamiz. Modelga qarab tanlaymiz.`

Если description длиннее 160 символов, убирай хвостовые фразы в таком порядке: «Подберём по модели» → «Поможем с выбором» → «Оригинальная запчасть,». Цену не убирай.

**Запрещено в текстах:** «самые низкие цены», «официальный дистрибьютор Bambu Lab», «всё в наличии». Цену выводи только если она есть в поле `price`.

**Эталон:** файл `site-brief-2026-10-29-products.csv` лежит рядом с этим ТЗ. Разделитель `;`, 216 строк, колонки `url;lang;issue_ids;format;proposed_title;title_len;proposed_h1;option_B_canonical_target;note`. Сверь итоговые title и H1 каждой карточки с колонками `proposed_title` и `proposed_h1`. Если в `note` стоит «[УТОЧНИТЬ: модели…]», поле `compat_models` пока пустое.

**Готово, когда:** ни один title и ни один H1 среди 216 карточек не повторяется, нет title длиннее 60 и description длиннее 160 символов, а на `/uz/*` нет кириллицы.

### 1.2. Контакты: подвал и страница /contacts

**Где:** общий подвал всех страниц ru и uz, `/ru/contacts`, `/uz/contacts`. Сейчас там только «Ташкент, Узбекистан»: нет телефона, ссылки на Telegram, адреса и часов.

**Данные владельца, использовать ровно так:**
- Телефон: `+998 99 454-19-13`, ссылка `tel:+998994541913`
- Telegram: `@kemalsen`, ссылка `https://t.me/kemalsen`
- Часы: «Ежедневно 09:00–21:00» / «Har kuni 09:00–21:00»
- Точки самовывоза:
  - Ташкент, ул. Бобура, 42 / Toshkent, Bobur ko‘chasi, 42
  - Навои, ул. Спутник, 3 / Navoiy, Sputnik ko‘chasi, 3
- E-mail: **пока нет**. Нигде не выводить, ни на странице, ни в разметке.
- Почтовый индекс и ссылки на карты: нет. Кнопку «Открыть на карте» не выводить.

**Подвал (ru и uz):** вместо строки «Ташкент, Узбекистан» выведи телефон ссылкой, Telegram ссылкой, часы и строку «Самовывоз: Ташкент, ул. Бобура, 42 · Навои, ул. Спутник, 3» / «Olib ketish: Toshkent, Bobur ko‘chasi, 42 · Navoiy, Sputnik ko‘chasi, 3».

**/contacts:** тексты блоков, title, H1 и JSON-LD описаны в части 2 (разделы про `/ru/contacts` и `/uz/contacts`). JSON-LD для главной — там же.

**Готово, когда:** в HTML `/ru` и `/ru/contacts` есть `tel:+998994541913` и `https://t.me/kemalsen`; телефон и адреса в подвале, на /contacts и в JSON-LD совпадают символ в символ.

### 1.3. Пары «катушка / рефилл»: вариант A

**Где:** 38 пар карточек (19 на ru и 19 на uz) плюс пара `pla-matte-white` / `pla-matte-white-refill`. Пример: `/ru/product/pla-basic-black` (катушка) и `/ru/product/pla-basic-black-refill` (рефилл) сейчас имеют одинаковые title и H1.

**Что сделать:**
1. Title, H1 и description сделать по шаблонам из 1.1. Тогда пары будут различаться.
2. Заполнить и показать поле «Формат» (см. 1.1).
3. На карточке **рефилла** под ценой или кнопкой добавить блок:
   - ru: «Рефилл — это филамент без пластиковой катушки. Его наматывают на многоразовую катушку Bambu Lab — меньше пластикового мусора.» и ссылка «Многоразовая катушка для рефиллов» → `/ru/product/reusable-spool`
   - uz: «Refill — plastik g‘altaksiz filament. U qayta ishlatiladigan Bambu Lab g‘altagiga o‘raladi — plastik chiqindisi kamroq.» и ссылка «Refill uchun qayta ishlatiladigan g‘altak» → `/uz/product/reusable-spool`
   - Утверждение «так дешевле» не добавлять, пока владелец не подтвердит, что рефилл действительно дешевле.
4. Рядом с выбором цвета добавить перекрёстную ссылку внутри пары:
   - на катушке: «Этот цвет без катушки (рефилл)» → URL рефилла;
   - на рефилле: «Этот цвет на катушке» → URL катушки;
   - на uz: «Shu rang refill (g‘altaksiz)» / «Shu rang g‘altakda».
5. Canonical оставить на саму страницу, как сейчас. hreflang не трогать.
6. В JSON-LD у каждой карточки свой `Product` со своим `sku`, в `name` — полный H1.

### 1.4. Цены, наличие и разметка Offer

**Где:** шаблон карточки. Сейчас у 200 из 216 карточек «Цена по запросу» и «Наличие уточняется», нет кнопки покупки, в JSON-LD нет `offers`. Offer есть только у 16 URL: pla-basic-green, pla-basic-black, pla-basic-blue, pla-matte-white, petg-hf-orange, petg-hf-white, textured-plate, hotend-x1c (каждый на ru и uz).

**Что сделать:**
1. **Если у товара в БД есть цена:** показать её в сумах, показать кнопку «В корзину», убрать «Цена по запросу».
2. **`offers` в JSON-LD выводить только при реальной цене.** Без цены Offer не выводить, фиктивную цену (0, 1) не ставить.
3. **`availability`** брать из реальных остатков, и она должна совпадать с видимой надписью:
   - «В наличии» → `InStock`;
   - нет в наличии → `OutOfStock`;
   - «Под заказ» и `*-request-spool` → `PreOrder`.
4. **Флаг «Цена по запросу».** У pla-basic-black, pla-basic-green, pla-basic-blue, pla-matte-white, petg-hf-orange и petg-hf-white одновременно есть Offer с ценой и признак «по запросу». Исправь так, чтобы текст и разметка говорили одно и то же.
5. **`petg-hf-white`:** на странице «Под заказ», а в Offer `OutOfStock`. Привести к `PreOrder`.
6. **`pla-basic-blue`:** это рефилл (артикул PLA-BASIC-BLUE), у него цена 249 000 сум. Проверь, что цена привязана именно к рефиллу, а не перепутана с катушкой `pla-basic-blue-spool`.
7. **Шаблон Offer:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{h1}}",
  "sku": "{{sku}}",
  "brand": {"@type": "Brand", "name": "{{brand}}"},
  "image": ["{{image_url}}"],
  "description": "{{meta_description}}",
  "url": "{{canonical_url}}",
  "offers": {
    "@type": "Offer",
    "url": "{{canonical_url}}",
    "price": "{{price_number_without_spaces}}",
    "priceCurrency": "UZS",
    "availability": "https://schema.org/{{InStock|OutOfStock|PreOrder}}",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {"@id": "https://forma-3d.uz/#organization"}
  }
}
```
   `brand`: «Bambu Lab» для оригинальной продукции, «Forma 3D» для `maintenance-kit-a1` и `maintenance-kit-p1s`. Без цены весь блок `offers` не выводится. Правильный пример уже есть на `/ru/product/pla-basic-black`: 249000, UZS, InStock.

Цены по остальным товарам владелец ещё не прислал. Сделай логику, а данные он внесёт сам.

### 1.5. Убрать «Демонстрационная версия» (только если владелец подтвердил, что цены и остатки настоящие)

- **Подвал ru и uz:** «© 2026 Forma 3D. Демонстрационная версия.» → «© 2026 Forma 3D». Удалить из HTML, а не скрыть через CSS.
- **Шаблон карточки:** удалить «Демонстрационная версия. Цены и остатки — примеры.» и узбекский аналог.
- **Поиск остатков:** проверь шаблоны и БД по подстрокам «Демонстрац», «примеры», «namuna». Фраза могла остаться в meta, alt, JSON-LD, оферте или письмах.

### 1.6. Разметка хлебных крошек (BreadcrumbList)

**Где:** все карточки, `/ru|uz/catalog`, `/ru|uz/catalog/parts` и их `?page=N`. Видимые крошки есть, разметки нет.

**Правила:**
- Разметка повторяет видимые крошки, на языке страницы. Последний элемент — H1 страницы, без `item`.
- Уровень без своей страницы (например, «PLA Basic»: отдельной категории PLA нет) в разметку не включать.
- **Филамент:** Главная → Каталог (`/catalog`) → товар.
- **Запчасти:** Главная → Запчасти и расходники (`/catalog/parts`) → товар.
- Названия уровней бери из видимых крошек сайта.

Пример для `/ru/product/pla-basic-black`:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://forma-3d.uz/ru"},
    {"@type": "ListItem", "position": 2, "name": "Каталог", "item": "https://forma-3d.uz/ru/catalog"},
    {"@type": "ListItem", "position": 3, "name": "Bambu Lab PLA Basic чёрный — 1 кг на катушке"}
  ]
}
```
Для uz: «Bosh sahifa» → `https://forma-3d.uz/uz`, «Katalog» → `https://forma-3d.uz/uz/catalog`; для запчастей «Ehtiyot qismlar» → `https://forma-3d.uz/uz/catalog/parts`.

---


## Часть 2. Правки конкретных страниц (одобрены владельцем)

Для каждой страницы — точные значения. «Было» дано, чтобы найти место в коде; если в коде текст немного другой — ориентируйся на URL и поле.


### 2.1. https://forma-3d.uz/ru

- **`<title>`**
  - было: Forma 3D — филамент и запчасти Bambu Lab в Ташкенте
  - стало: **Филамент и запчасти Bambu Lab в Ташкенте | Forma 3D**
- **`<meta name="description">`**
  - было: Филамент Bambu Lab, расходники и запчасти для 3D-принтеров в Ташкенте с доставкой по Узбекистану. Оптовые условия для бизнеса и учебных заведений.
  - стало: **Оригинальный филамент Bambu Lab, хотэнды, столы и запчасти в Ташкенте. Доставка в день заказа или на следующий, опт для бизнеса. Выберите материал в каталоге.**
- **`<h1>`**
  - было: Всё для вашей 3D-печати. *
  - стало: **Филамент и запчасти Bambu Lab в Ташкенте**
  - примечание: Сейчас H1 — слоган без ключа и со звёздочкой-сноской внутри заголовка. Слоган «Всё для вашей 3D-печати» можно оставить крупным текстом над/под H1, но не в теге <h1>. Звёздочку убрать из H1 (сноску перенести в абзац).
- **alt** у `img[src*='/images/clients/baxt-textile.png']` → «Логотип клиента Baxt Textile»
- **alt** у `img[src*='/images/clients/ngmk.png']` → «Логотип клиента NGMK»
- **alt** у `img[src*='/images/clients/nzbt.png']` → «Логотип клиента NZBT»
- **alt** у `img[src*='/images/clients/narbahor-textile.png']` → «Логотип клиента Narbahor Textile»
- **ссылка**: текст «филамент оптом для бизнеса и учебных заведений» → `https://forma-3d.uz/ru/business`. Где: в блоке с логотипами клиентов (подпись под логотипами: «Работаем с компаниями и учебными заведениями — [анкор]»)
- **ссылка**: текст «хотэнды и сопла для A1, P1 и X1» → `https://forma-3d.uz/ru/catalog/parts`. Где: в первом экране под H1, рядом со ссылкой на каталог филамента
- **JSON-LD** (Organization + Store ×2) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://forma-3d.uz/#organization",
      "name": "Forma 3D",
      "alternateName": "Форма-3D",
      "url": "https://forma-3d.uz/ru",
      "description": "Филамент Bambu Lab, хотэнды, печатные столы, AMS и запчасти. Оптовые поставки для бизнеса и учебных заведений.",
      "sameAs": [
        "https://t.me/kemalsen"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+998994541913",
        "contactType": "customer service",
        "areaServed": "UZ"
      },
      "department": [
        {
          "@id": "https://forma-3d.uz/#store-tashkent"
        },
        {
          "@id": "https://forma-3d.uz/#store-navoi"
        }
      ]
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-tashkent",
      "name": "Forma 3D — Ташкент",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/ru/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "ул. Бобура, 42",
        "addressLocality": "Ташкент",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-navoi",
      "name": "Forma 3D — Навои",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/ru/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "ул. Спутник, 3",
        "addressLocality": "Навои",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    }
  ]
}
```

### 2.2. https://forma-3d.uz/uz

- **`<title>`**
  - было: Forma 3D — Toshkentda Bambu Lab filamenti va ehtiyot qismlari
  - стало: **Bambu Lab filament va ehtiyot qismlar Toshkentda | Forma 3D**
- **`<meta name="description">`**
  - было: Bambu Lab filamenti, 3D-printerlar uchun sarf materiallari va ehtiyot qismlar Toshkentda, O‘zbekiston bo‘ylab yetkazib berish bilan.
  - стало: **Original Bambu Lab filamenti, hotendlar, stollar va ehtiyot qismlar Toshkentda. Buyurtma kuni yoki ertasiga yetkazamiz, biznes uchun ulgurji. Katalogni ko‘ring!**
- **`<h1>`**
  - было: 3D bosmangiz uchun hamma narsa. *
  - стало: **Toshkentda Bambu Lab filamenti va ehtiyot qismlari**
  - примечание: H1-слоган без ключа и со звёздочкой. Слоган оставить обычным текстом, звёздочку убрать из заголовка.
- **alt** у `img[src*='/images/clients/baxt-textile.png']` → «Mijoz logotipi: Baxt Textile»
- **alt** у `img[src*='/images/clients/ngmk.png']` → «Mijoz logotipi: NGMK»
- **alt** у `img[src*='/images/clients/nzbt.png']` → «Mijoz logotipi: NZBT»
- **alt** у `img[src*='/images/clients/narbahor-textile.png']` → «Mijoz logotipi: Narbahor Textile»
- **ссылка**: текст «biznes va ta’lim muassasalari uchun ulgurji filament» → `https://forma-3d.uz/uz/business`. Где: в блоке с логотипами клиентов (подпись: «Kompaniyalar va ta’lim muassasalari bilan ishlaymiz — [анкор]»)
- **ссылка**: текст «A1, P1 va X1 uchun hotend va soplolar» → `https://forma-3d.uz/uz/catalog/parts`. Где: в первом экране под H1, рядом со ссылкой на каталог филамента
- **JSON-LD** (Organization + Store ×2) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://forma-3d.uz/#organization",
      "name": "Forma 3D",
      "url": "https://forma-3d.uz/uz",
      "description": "Bambu Lab filamenti, hotendlar, bosma stollari, AMS va ehtiyot qismlar. Biznes va ta’lim muassasalari uchun ulgurji yetkazib berish.",
      "sameAs": [
        "https://t.me/kemalsen"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+998994541913",
        "contactType": "customer service",
        "areaServed": "UZ"
      },
      "department": [
        {
          "@id": "https://forma-3d.uz/#store-tashkent"
        },
        {
          "@id": "https://forma-3d.uz/#store-navoi"
        }
      ]
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-tashkent",
      "name": "Forma 3D — Toshkent",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/uz/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Bobur ko‘chasi, 42",
        "addressLocality": "Toshkent",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-navoi",
      "name": "Forma 3D — Navoiy",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/uz/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sputnik ko‘chasi, 3",
        "addressLocality": "Navoiy",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    }
  ]
}
```

### 2.3. https://forma-3d.uz/ru/catalog

- **`<title>`**
  - было: Каталог филамента Bambu Lab — PLA, PETG, ABS и др. | Forma 3D
  - стало: **Филамент Bambu Lab купить в Ташкенте — PLA, PETG | Forma 3D**
- **`<meta name="description">`**
  - было: Филамент Bambu Lab: PLA, PETG, ABS, TPU и другие материалы. Выбор по цвету, материалу и модели принтера. Доставка по Ташкенту и Узбекистану.
  - стало: **Филамент Bambu Lab 1,75 мм в Ташкенте: PLA, PETG, ABS, ASA, TPU и инженерные пластики. Доставка в день заказа или на следующий. Выберите материал и цвет.**
- **`<h1>`**
  - было: Филамент
  - стало: **Филамент Bambu Lab для 3D-принтера**
  - примечание: H1 из одного слова без бренда и без уточнения. Новый H1 закрывает «филамент bambu lab» и «филамент для 3d принтера».
- **ссылка**: текст «многоразовая катушка для рефиллов» → `https://forma-3d.uz/ru/product/reusable-spool`. Где: в коротком вводном абзаце под H1 (1–2 предложения: «Филамент продаётся на катушке 1 кг или рефиллом без катушки — для рефилла нужна [анкор].»)
- **ссылка**: текст «филамент оптом для бизнеса» → `https://forma-3d.uz/ru/business`. Где: в конце вводного абзаца или над пагинацией
- **JSON-LD** (BreadcrumbList) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Главная",
      "item": "https://forma-3d.uz/ru"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Филамент Bambu Lab для 3D-принтера"
    }
  ]
}
```
- **страницы пагинации `?page=N`** (сейчас: title «Каталог филамента Bambu Lab — PLA, PETG, ABS и др. — страница N | Forma 3D» (>60), description и H1 как у первой страницы):
```json
{
  "title": "Филамент Bambu Lab — страница {N} | Forma 3D",
  "meta_description": "Каталог филамента Bambu Lab, страница {N}: PLA, PETG, ABS, ASA, TPU и инженерные пластики с доставкой по Ташкенту.",
  "h1": "Филамент Bambu Lab для 3D-принтера — страница {N}",
  "canonical": "оставить self (как сейчас), в sitemap не добавлять"
}
```

### 2.4. https://forma-3d.uz/uz/catalog

- **`<title>`**
  - было: Bambu Lab filamenti katalogi — PLA, PETG, ABS va boshqalar | Forma 3D
  - стало: **Bambu Lab filament sotib olish, Toshkent | Forma 3D**
- **`<meta name="description">`**
  - было: Bambu Lab filamenti: PLA, PETG, ABS, TPU va boshqa materiallar. Rang, material va printer modeli bo‘yicha tanlash.
  - стало: **Toshkentda Bambu Lab filamenti 1,75 mm: PLA, PETG, ABS, ASA, TPU va muhandislik plastiklari. Buyurtma kuni yoki ertasiga yetkazamiz. Rangni tanlang!**
- **`<h1>`**
  - было: Filament
  - стало: **3D-printer uchun Bambu Lab filamenti**
  - примечание: H1 из одного слова. Новый закрывает «bambu lab filament» и «3d printer uchun plastik/filament».
- **ссылка**: текст «refill uchun qayta ishlatiladigan g‘altak» → `https://forma-3d.uz/uz/product/reusable-spool`. Где: во вводном абзаце под H1 («Filament 1 kg g‘altakda yoki g‘altaksiz refill sifatida sotiladi — refill uchun [анкор] kerak.»)
- **ссылка**: текст «biznes uchun ulgurji filament» → `https://forma-3d.uz/uz/business`. Где: в конце вводного абзаца или над пагинацией
- **JSON-LD** (BreadcrumbList) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Bosh sahifa",
      "item": "https://forma-3d.uz/uz"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "3D-printer uchun Bambu Lab filamenti"
    }
  ]
}
```
- **страницы пагинации `?page=N`** (сейчас: title «Bambu Lab filamenti katalogi — PLA, PETG, ABS va boshqalar — N-sahifa | Forma 3D» (>60), description и H1 как у первой страницы):
```json
{
  "title": "Bambu Lab filament — {N}-sahifa | Forma 3D",
  "meta_description": "Bambu Lab filamenti katalogi, {N}-sahifa: PLA, PETG, ABS, ASA, TPU va muhandislik plastiklari, Toshkent bo‘ylab yetkazib berish.",
  "h1": "3D-printer uchun Bambu Lab filamenti — {N}-sahifa",
  "canonical": "self, в sitemap не добавлять"
}
```

### 2.5. https://forma-3d.uz/ru/catalog/parts

- **`<title>`**
  - было: Запчасти и расходники для принтеров Bambu Lab | Forma 3D
  - стало: **Запчасти Bambu Lab в Ташкенте — хотэнды, столы | Forma 3D**
- **`<meta name="description">`**
  - было: Хотэнды и сопла, печатные пластины, компоненты AMS, наборы обслуживания и расходники для принтеров Bambu Lab A1, P1S, X1C, H2D и других. Подбор по модели принтера.
  - стало: **Хотэнды и сопла, печатные столы, AMS и детали для ремонта Bambu Lab A1, P1S, X1C, H2D. Доставка по Ташкенту в день заказа или на следующий. Подберём по модели.**
- **`<h1>`**
  - было: Запчасти и расходники
  - стало: **Запчасти и расходники для Bambu Lab**
  - примечание: В H1 нет бренда, хотя специализация на Bambu Lab — главное отличие от конкурентов (keywords/clusters.md).
- **ссылка**: текст «хотэнды для Bambu Lab A1 и A1 mini» → `https://forma-3d.uz/ru/product/hotend-a1-04-steel`. Где: во вводном абзаце под H1 (2–3 предложения с подбором по модели: «Для A1 и A1 mini — [анкор], для P1P/P1S — …, для X1/X1C — …»)
- **ссылка**: текст «хотэнды для P1P и P1S» → `https://forma-3d.uz/ru/product/hotend-p1-04`. Где: в том же вводном абзаце
- **ссылка**: текст «хотэнды для X1 и X1C» → `https://forma-3d.uz/ru/product/hotend-x1-04`. Где: в том же вводном абзаце
- **JSON-LD** (BreadcrumbList) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Главная",
      "item": "https://forma-3d.uz/ru"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Запчасти и расходники для Bambu Lab"
    }
  ]
}
```
- **страницы пагинации `?page=N`** (сейчас: title «Запчасти и расходники для принтеров Bambu Lab — страница N | Forma 3D» (>60), description 163 и H1 как у первой страницы):
```json
{
  "title": "Запчасти Bambu Lab — страница {N} | Forma 3D",
  "meta_description": "Запчасти и расходники Bambu Lab, страница {N}: хотэнды, сопла, печатные столы, AMS и детали для ремонта с доставкой по Ташкенту.",
  "h1": "Запчасти и расходники для Bambu Lab — страница {N}",
  "canonical": "self, в sitemap не добавлять"
}
```

### 2.6. https://forma-3d.uz/uz/catalog/parts

- **`<title>`**
  - было: Bambu Lab printerlari uchun ehtiyot qismlar | Forma 3D
  - стало: **Bambu Lab ehtiyot qismlari Toshkentda | Forma 3D**
- **`<meta name="description">`**
  - было: Bambu Lab A1, P1S, X1C, H2D va boshqa printerlar uchun hotendlar va soplolar, bosma plastinalar, AMS qismlari, xizmat ko‘rsatish to‘plamlari va sarf materiallari.
  - стало: **Bambu Lab A1, P1S, X1C, H2D uchun hotend va soplolar, bosma stollari, AMS qismlari. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz. Modelga qarab tanlaymiz.**
- **`<h1>`**
  - было: Ehtiyot qismlar
  - стало: **Bambu Lab uchun ehtiyot qismlar va sarf materiallari**
  - примечание: В H1 нет бренда Bambu Lab.
- **ссылка**: текст «Bambu Lab A1 va A1 mini uchun hotendlar» → `https://forma-3d.uz/uz/product/hotend-a1-04-steel`. Где: во вводном абзаце под H1 (подбор по модели)
- **ссылка**: текст «P1P va P1S uchun hotendlar» → `https://forma-3d.uz/uz/product/hotend-p1-04`. Где: в том же абзаце
- **ссылка**: текст «X1 va X1C uchun hotendlar» → `https://forma-3d.uz/uz/product/hotend-x1-04`. Где: в том же абзаце
- **JSON-LD** (BreadcrumbList) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Bosh sahifa",
      "item": "https://forma-3d.uz/uz"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Bambu Lab uchun ehtiyot qismlar va sarf materiallari"
    }
  ]
}
```
- **страницы пагинации `?page=N`** (сейчас: title «Bambu Lab printerlari uchun ehtiyot qismlar — N-sahifa | Forma 3D» (>60), description 162 и H1 как у первой страницы):
```json
{
  "title": "Bambu Lab ehtiyot qismlari — {N}-sahifa | Forma 3D",
  "meta_description": "Bambu Lab ehtiyot qismlari, {N}-sahifa: hotendlar, soplolar, bosma stollari, AMS va ta’mirlash qismlari, Toshkent bo‘ylab yetkazib berish.",
  "h1": "Bambu Lab uchun ehtiyot qismlar va sarf materiallari — {N}-sahifa",
  "canonical": "self, в sitemap не добавлять"
}
```

### 2.7. https://forma-3d.uz/ru/business

- **`<title>`**
  - было: Филамент оптом для бизнеса и учебных заведений | Forma 3D
  - стало: **Филамент оптом в Ташкенте для бизнеса и школ | Forma 3D**
- **`<meta name="description">`**
  - было: Оптовые поставки филамента и запчастей Bambu Lab для принт-ферм, мастерских, школ и вузов. Счёт, договор, закрывающие документы.
  - стало: **Филамент и запчасти Bambu Lab оптом от 5 катушек для принт-ферм, мастерских, школ и вузов. Счёт, договор, закрывающие документы. Запросите оптовые условия.**
- **`<h1>`**
  - было: Больше печати. Меньше забот.
  - стало: **Филамент Bambu Lab оптом для бизнеса и учебных заведений**
  - примечание: H1-слоган без ключа. Слоган можно оставить подзаголовком (не в <h1>).
- **ссылка**: текст «каталог филамента Bambu Lab» → `https://forma-3d.uz/ru/catalog`. Где: в блоке условий опта («Выберите материалы в [анкор] и пришлите список»)
- **ссылка**: текст «запчасти и расходники для Bambu Lab» → `https://forma-3d.uz/ru/catalog/parts`. Где: там же, для принт-ферм (запас хотэндов, столов)

### 2.8. https://forma-3d.uz/uz/business

- **`<title>`**
  - было: Biznes va ta’lim muassasalari uchun ulgurji filament | Forma 3D
  - стало: **Ulgurji filament Toshkentda — biznes va maktablar | Forma 3D**
- **`<meta name="description">`**
  - было: Print-fermalar, ustaxonalar, maktab va oliygohlar uchun Bambu Lab filamenti va ehtiyot qismlarini ulgurji yetkazib berish.
  - стало: **Print-fermalar, ustaxonalar, maktab va oliygohlar uchun Bambu Lab filamenti va ehtiyot qismlari ulgurji, 5 g‘altakdan. Hujjatlar bilan. Shartlarni so‘rang.**
- **`<h1>`**
  - было: Ko‘proq bosma. Kamroq tashvish.
  - стало: **Biznes va ta’lim muassasalari uchun Bambu Lab filamenti ulgurji**
  - примечание: H1-слоган без ключа.
- **ссылка**: текст «Bambu Lab filamenti katalogi» → `https://forma-3d.uz/uz/catalog`. Где: в блоке условий опта
- **ссылка**: текст «Bambu Lab ehtiyot qismlari» → `https://forma-3d.uz/uz/catalog/parts`. Где: там же, для принт-ферм

### 2.9. https://forma-3d.uz/ru/contacts

> Внедрять вместе с задачей 1.2 (контакты), не раньше.

- **`<title>`**
  - было: Контакты | Forma 3D
  - стало: **Контакты и самовывоз в Ташкенте и Навои | Forma 3D**
- **`<meta name="description">`**
  - было: Как связаться с Forma 3D: телефон, Telegram, адрес.
  - стало: **Как связаться с Forma 3D: телефон, Telegram, часы работы и пункты самовывоза в Ташкенте и Навои. Поможем с выбором — напишите в Telegram!**
- **`<h1>`**
  - было: Хорошей печати нужен хороший материал
  - стало: **Контакты Forma 3D**
  - примечание: H1-слоган не говорит, что это страница контактов.
- **блок контактов** (под H1, вместо текущего слогана-абзаца):
  - «Как с нами связаться»: Телефон: +998 99 454-19-13 (ссылка tel:+998994541913); Telegram: @kemalsen (ссылка https://t.me/kemalsen) — поможем подобрать материал и запчасти; Работаем ежедневно с 09:00 до 21:00
  - «Пункты самовывоза»:
    - Ташкент — ул. Бобура, 42, Ежедневно 09:00–21:00
    - Навои — ул. Спутник, 3, Ежедневно 09:00–21:00
  - кнопка: Написать в Telegram → https://t.me/kemalsen
  - кнопку «Открыть на карте» пока не выводить (ссылок на карты нет); e-mail не выводить (его пока нет).
- **ссылка**: текст «условия доставки и самовывоза» → `https://forma-3d.uz/ru/delivery`. Где: под блоком «Пункты самовывоза»
- **JSON-LD** (Organization + Store ×2) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://forma-3d.uz/#organization",
      "name": "Forma 3D",
      "url": "https://forma-3d.uz/ru",
      "sameAs": [
        "https://t.me/kemalsen"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+998994541913",
        "contactType": "customer service",
        "areaServed": "UZ"
      },
      "department": [
        {
          "@id": "https://forma-3d.uz/#store-tashkent"
        },
        {
          "@id": "https://forma-3d.uz/#store-navoi"
        }
      ]
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-tashkent",
      "name": "Forma 3D — Ташкент",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/ru/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "ул. Бобура, 42",
        "addressLocality": "Ташкент",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-navoi",
      "name": "Forma 3D — Навои",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/ru/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "ул. Спутник, 3",
        "addressLocality": "Навои",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    }
  ]
}
```

### 2.10. https://forma-3d.uz/uz/contacts

> Внедрять вместе с задачей 1.2 (контакты), не раньше.

- **`<title>`**
  - было: Kontaktlar | Forma 3D
  - стало: **Kontaktlar va olib ketish: Toshkent, Navoiy | Forma 3D**
- **`<meta name="description">`**
  - было: Forma 3D bilan bog‘lanish: telefon, Telegram, manzil.
  - стало: **Forma 3D bilan bog‘lanish: telefon, Telegram, ish vaqti va Toshkent hamda Navoiydagi olib ketish punktlari. Tanlashga yordam beramiz — Telegramda yozing!**
- **`<h1>`**
  - было: Yaxshi bosma yaxshi materialdan boshlanadi
  - стало: **Forma 3D kontaktlari**
  - примечание: H1-слоган не говорит, что это контакты.
- **блок контактов** (под H1, вместо текущего слогана-абзаца):
  - «Biz bilan bog‘lanish»: Telefon: +998 99 454-19-13 (ссылка tel:+998994541913); Telegram: @kemalsen (ссылка https://t.me/kemalsen) — material va ehtiyot qismlarni tanlashga yordam beramiz; Har kuni 09:00 dan 21:00 gacha ishlaymiz
  - «Olib ketish punktlari»:
    - Toshkent — Bobur ko‘chasi, 42, Har kuni 09:00–21:00
    - Navoiy — Sputnik ko‘chasi, 3, Har kuni 09:00–21:00
  - кнопка: Telegramda yozish → https://t.me/kemalsen
  - кнопку «Открыть на карте» пока не выводить (ссылок на карты нет); e-mail не выводить (его пока нет).
- **ссылка**: текст «yetkazib berish va olib ketish shartlari» → `https://forma-3d.uz/uz/delivery`. Где: под блоком «Olib ketish punktlari»
- **JSON-LD** (Organization + Store ×2) — вставить в `<script type="application/ld+json">` этой страницы:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://forma-3d.uz/#organization",
      "name": "Forma 3D",
      "url": "https://forma-3d.uz/uz",
      "sameAs": [
        "https://t.me/kemalsen"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+998994541913",
        "contactType": "customer service",
        "areaServed": "UZ"
      },
      "department": [
        {
          "@id": "https://forma-3d.uz/#store-tashkent"
        },
        {
          "@id": "https://forma-3d.uz/#store-navoi"
        }
      ]
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-tashkent",
      "name": "Forma 3D — Toshkent",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/uz/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Bobur ko‘chasi, 42",
        "addressLocality": "Toshkent",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    },
    {
      "@type": "Store",
      "@id": "https://forma-3d.uz/#store-navoi",
      "name": "Forma 3D — Navoiy",
      "parentOrganization": {
        "@id": "https://forma-3d.uz/#organization"
      },
      "url": "https://forma-3d.uz/uz/contacts",
      "telephone": "+998994541913",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Sputnik ko‘chasi, 3",
        "addressLocality": "Navoiy",
        "addressCountry": "UZ"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "21:00"
        }
      ],
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Payme, Click, Humo"
    }
  ]
}
```

### 2.11. https://forma-3d.uz/ru/delivery

- **`<title>`**
  - было: Доставка и оплата | Forma 3D
  - стало: **Доставка филамента по Ташкенту и оплата | Forma 3D**
- **`<meta name="description">`**
  - было: Курьерская доставка по Ташкенту, самовывоз и доставка в регионы Узбекистана. Способы оплаты.
  - стало: **Доставка по Ташкенту в день заказа или на следующий, отправка в регионы, самовывоз в Ташкенте и Навои. Оплата Payme, Click, Humo. Узнайте условия.**
- **`<h1>`**
  - было: От нашего склада — к вашему принтеру
  - стало: **Доставка и оплата филамента по Ташкенту и Узбекистану**
  - примечание: H1-слоган без ключа; слоган можно оставить подзаголовком.
- **ссылка**: текст «пункты самовывоза в Ташкенте и Навои» → `https://forma-3d.uz/ru/contacts`. Где: в разделе «Самовывоз» (адреса точек можно продублировать: Ташкент, ул. Бобура, 42; Навои, ул. Спутник, 3; ежедневно 09:00–21:00)

### 2.12. https://forma-3d.uz/uz/delivery

- **`<title>`**
  - было: Yetkazish va to‘lov | Forma 3D
  - стало: **Toshkent bo‘ylab filament yetkazish va to‘lov | Forma 3D**
- **`<meta name="description">`**
  - было: Toshkent bo‘ylab kuryer, olib ketish va viloyatlarga yetkazish. To‘lov usullari.
  - стало: **Filamentni Toshkent bo‘ylab buyurtma kuni yoki ertasiga yetkazamiz, viloyatlarga jo‘natamiz. Olib ketish: Toshkent va Navoiy. To‘lov: Payme, Click, Humo.**
- **`<h1>`**
  - было: Omborimizdan printeringizgacha
  - стало: **Toshkent va O‘zbekiston bo‘ylab yetkazish va to‘lov**
  - примечание: H1-слоган без ключа.
- **ссылка**: текст «Toshkent va Navoiydagi olib ketish punktlari» → `https://forma-3d.uz/uz/contacts`. Где: в разделе «Olib ketish» (адреса: Toshkent, Bobur ko‘chasi, 42; Navoiy, Sputnik ko‘chasi, 3; har kuni 09:00–21:00)

### 2.13. https://forma-3d.uz/ru/knowledge

- **`<h1>`**
  - было: От катушки к результату
  - стало: **База знаний по 3D-печати и филаменту**
  - примечание: H1-слоган без ключа; новый H1 совпадает по смыслу с title «База знаний по 3D-печати | Forma 3D» (title и description оставляем как есть — они в порядке).

### 2.14. https://forma-3d.uz/uz/knowledge

- **`<h1>`**
  - было: G‘altakdan natijagacha
  - стало: **3D-bosma va filament bo‘yicha bilimlar bazasi**
  - примечание: H1-слоган без ключа; title «3D-bosma bo‘yicha bilimlar bazasi | Forma 3D» и description оставляем.

### 2.15. https://forma-3d.uz/ru/product/pla-basic-black

- **`<title>`**
  - было: Bambu Lab PLA Basic, Чёрный — купить в Ташкенте | Forma 3D
  - стало: **Bambu Lab PLA Basic чёрный, катушка 1 кг | Forma 3D**
- **`<meta name="description">`**
  - было: Купить Bambu Lab PLA Basic, Чёрный, 1 кг — 249 000 сум. Доставка курьером по Ташкенту и в регионы Узбекистана. Forma 3D — всё для 3D-печати.
  - стало: **Bambu Lab PLA Basic чёрный на катушке, 1 кг, 1,75 мм. Оригинальный филамент, доставка по Ташкенту в день заказа или на следующий. Цена 249 000 сум.**
- **`<h1>`**
  - было: Bambu Lab PLA Basic
  - стало: **Bambu Lab PLA Basic чёрный — 1 кг на катушке**
  - примечание: H1 «Bambu Lab PLA Basic» стоит на 40 URL. В H1 нужны цвет и формат.
- **ссылка**: текст «Этот цвет без катушки (рефилл)» → `https://forma-3d.uz/ru/product/pla-basic-black-refill`. Где: рядом с выбором цвета / полем «Формат»

### 2.16. https://forma-3d.uz/uz/product/pla-basic-black

- **`<title>`**
  - было: Bambu Lab PLA Basic, Qora — sotib olish | Forma 3D
  - стало: **Bambu Lab PLA Basic qora, g‘altakda 1 kg | Forma 3D**
- **`<meta name="description">`**
  - было: Bambu Lab PLA Basic, Qora, 1 kg. Narxi 249 000 so‘m. Toshkent bo‘ylab kuryer va O‘zbekiston bo‘ylab yetkazib berish. Forma 3D — 3D-bosma uchun hamma narsa.
  - стало: **Bambu Lab PLA Basic qora g‘altakda, 1 kg, 1,75 mm. Original filament. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz. Narxi 249 000 so‘m.**
- **`<h1>`**
  - было: Bambu Lab PLA Basic
  - стало: **Bambu Lab PLA Basic qora — g‘altakda 1 kg**
  - примечание: Уникальный H1 с цветом и форматом; не совпадает с ru-версией.
- **ссылка**: текст «Shu rang refill (g‘altaksiz)» → `https://forma-3d.uz/uz/product/pla-basic-black-refill`. Где: рядом с выбором цвета / полем «Format»

### 2.17. https://forma-3d.uz/ru/product/pla-basic-black-refill

- **`<title>`**
  - было: Bambu Lab PLA Basic, Чёрный — купить в Ташкенте | Forma 3D
  - стало: **Bambu Lab PLA Basic чёрный, рефилл без катушки | Forma 3D**
- **`<meta name="description">`**
  - было: Купить Bambu Lab PLA Basic, Чёрный, 1 кг. Доставка курьером по Ташкенту и в регионы Узбекистана. Forma 3D — всё для 3D-печати.
  - стало: **Рефилл Bambu Lab PLA Basic чёрный: 1 кг филамента 1,75 мм без катушки, для многоразовой катушки. Доставка по Ташкенту в день заказа или на следующий.**
- **`<h1>`**
  - было: Bambu Lab PLA Basic
  - стало: **Bambu Lab PLA Basic чёрный — рефилл 1 кг без катушки**
  - примечание: Уникальный H1 с цветом и форматом (запросы «bambu lab refill», «филамент без катушки»).
- **ссылка**: текст «многоразовая катушка для рефиллов» → `https://forma-3d.uz/ru/product/reusable-spool`. Где: в блоке «Что такое рефилл» под кнопкой (текст блока — в dev-spool-refill-duplicates, п. 3)
- **ссылка**: текст «Этот цвет на катушке» → `https://forma-3d.uz/ru/product/pla-basic-black`. Где: рядом с выбором цвета / полем «Формат»

### 2.18. https://forma-3d.uz/uz/product/pla-basic-black-refill

- **`<title>`**
  - было: Bambu Lab PLA Basic, Qora — sotib olish | Forma 3D
  - стало: **Bambu Lab PLA Basic qora, refill (g‘altaksiz) | Forma 3D**
- **`<meta name="description">`**
  - было: Bambu Lab PLA Basic, Qora, 1 kg. Toshkent bo‘ylab kuryer va O‘zbekiston bo‘ylab yetkazib berish. Forma 3D — 3D-bosma uchun hamma narsa.
  - стало: **Bambu Lab PLA Basic qora refill: 1 kg, 1,75 mm, g‘altaksiz — qayta ishlatiladigan g‘altak uchun. Toshkentda buyurtma kuni yoki ertasiga yetkazamiz.**
- **`<h1>`**
  - было: Bambu Lab PLA Basic
  - стало: **Bambu Lab PLA Basic qora — refill 1 kg, g‘altaksiz**
  - примечание: Уникальный H1.
- **ссылка**: текст «refill uchun qayta ishlatiladigan g‘altak» → `https://forma-3d.uz/uz/product/reusable-spool`. Где: в блоке «Refill nima?» под кнопкой
- **ссылка**: текст «Shu rang g‘altakda» → `https://forma-3d.uz/uz/product/pla-basic-black`. Где: рядом с выбором цвета / полем «Format»

### 2.19. https://forma-3d.uz/ru/product/hotend-a1-04-steel

- **`<title>`**
  - было: Хотэнд A1 · 0,4 мм (сталь) · Bambu Lab A1 / A1 mini — купить в Ташкенте | Forma 3D
  - стало: **Хотэнд 0,4 мм (сталь) для Bambu Lab A1/A1 mini | Forma 3D**
- **`<meta name="description">`**
  - было: Хотэнд A1 · 0,4 мм (сталь) · Bambu Lab A1 / A1 mini. Цена по запросу. Запчасти и расходники для принтеров Bambu Lab в Ташкенте.
  - стало: **Хотэнд для Bambu Lab A1 и A1 mini, сопло 0,4 мм (сталь). Оригинальная запчасть, доставка по Ташкенту в день заказа или на следующий. Подберём по модели.**
- **`<h1>`**
  - было: Bambu Lab Хотэнд A1 · 0,4 мм (сталь)
  - стало: **Хотэнд для Bambu Lab A1 / A1 mini, сопло 0,4 мм (сталь)**
  - примечание: Читаемый H1 с моделями принтера и словом «сопло» (запросы «хотэнд a1 mini», «сопло 0.4 bambu lab»).
- **ссылка**: текст «закалённый хотэнд 0,4 мм для A1» → `https://forma-3d.uz/ru/product/hotend-a1-04-hardened`. Где: блок «Другие хотэнды для A1 / A1 mini» под описанием
- **ссылка**: текст «хотэнд 0,2 мм для A1» → `https://forma-3d.uz/ru/product/hotend-a1-02`. Где: тот же блок
- **ссылка**: текст «хотэнд 0,6 мм для A1» → `https://forma-3d.uz/ru/product/hotend-a1-06`. Где: тот же блок
- **ссылка**: текст «набор для обслуживания A1» → `https://forma-3d.uz/ru/product/maintenance-kit-a1`. Где: блок «С этим покупают»

### 2.20. https://forma-3d.uz/uz/product/hotend-a1-04-steel

- **`<title>`**
  - было: A1 hotend · 0.4 mm (po‘lat) · Bambu Lab A1 / A1 mini — sotib olish | Forma 3D
  - стало: **Bambu Lab A1/A1 mini hotend 0.4 mm (po‘lat) | Forma 3D**
- **`<meta name="description">`**
  - было: A1 hotend · 0.4 mm (po‘lat) · Bambu Lab A1 / A1 mini. Narxi so‘rov bo‘yicha. Bambu Lab printerlari uchun ehtiyot qismlar Toshkentda.
  - стало: **Bambu Lab A1 va A1 mini uchun hotend, soplo 0.4 mm (po‘lat). Original ehtiyot qism, Toshkentda buyurtma kuni yoki ertasiga yetkazamiz. Modelga qarab tanlaymiz.**
- **`<h1>`**
  - было: Bambu Lab A1 hotend · 0.4 mm (po‘lat)
  - стало: **Bambu Lab A1 / A1 mini uchun hotend, soplo 0.4 mm (po‘lat)**
  - примечание: Модели принтера и слово «soplo» в H1.
- **ссылка**: текст «A1 uchun toblangan hotend 0.4 mm» → `https://forma-3d.uz/uz/product/hotend-a1-04-hardened`. Где: блок «A1 / A1 mini uchun boshqa hotendlar» под описанием
- **ссылка**: текст «A1 uchun hotend 0.2 mm» → `https://forma-3d.uz/uz/product/hotend-a1-02`. Где: тот же блок
- **ссылка**: текст «A1 uchun hotend 0.6 mm» → `https://forma-3d.uz/uz/product/hotend-a1-06`. Где: тот же блок
- **ссылка**: текст «A1 xizmat ko‘rsatish to‘plami» → `https://forma-3d.uz/uz/product/maintenance-kit-a1`. Где: блок «Bu bilan birga olishadi»

---

## Часть 3. Проверка и отчёт

**Перед деплоем проверь:**
- [ ] На `/ru`, `/uz`, `/ru/contacts`, `/ru/product/pla-basic-black`, `/ru/product/pla-basic-black-refill` и `/ru/product/hotend-a1-04-steel` title, description и H1 совпадают с этим ТЗ.
- [ ] На каждой странице ровно один `<h1>`.
- [ ] Ни один title и ни один H1 среди 216 карточек не повторяется (сверка с CSV).
- [ ] На `/uz/*` нет кириллицы в title, description и H1.
- [ ] JSON-LD проходит валидацию (validator.schema.org или Google Rich Results Test), в коде нет «[УТОЧНИТЬ]» и пустых `logo`/`hasMap`.
- [ ] Телефон и адреса в подвале, на /contacts и в JSON-LD совпадают.
- [ ] Нигде не появились цены, которых нет в БД.

**Отчёт владельцу** — коротко:
1. что сделано, по номерам пунктов (1.1–1.6, 2.x);
2. что не сделано и почему;
3. что сделано не так, как в ТЗ, и почему;
4. список изменённых файлов.

Владелец передаст отчёт в SEO-систему: она перенесёт правки в «внедрённые» и проверит результат повторным аудитом.

---

## Приложение. Вариант B для «катушка / рефилл» (только если владелец выберет его вместо A)

- **Основная карточка цвета** — URL катушки (колонка `option_B_canonical_target` в CSV). Для синего цвета основная — `pla-basic-blue-spool`, потому что `pla-basic-blue` — рефилл.
- **Селектор на основной карточке:** «Формат: катушка / рефилл», у каждого варианта свои цена, SKU и наличие. Цену 249 000 сум и наличие синего рефилла перенести в этот селектор.
- **URL рефилла:** 301 на основную карточку. Убрать его из sitemap и из внутренних ссылок.
- **Title основной карточки:** «Bambu Lab PLA Basic чёрный — катушка и рефилл | Forma 3D» / «Bambu Lab PLA Basic qora — g‘altak va refill | Forma 3D».
- **H1:** «Bambu Lab PLA Basic чёрный, 1 кг» / «Bambu Lab PLA Basic qora, 1 kg».
- **JSON-LD:** `ProductGroup` с двумя `Product` в `hasVariant`, у каждого свой `sku` и `Offer`.

