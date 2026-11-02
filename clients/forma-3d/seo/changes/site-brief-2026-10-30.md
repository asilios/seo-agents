# ТЗ №2 для сайта forma-3d.uz — тексты страниц и технические правки (2026-10-30)

Это продолжение ТЗ от 2026-10-29 (site-brief-2026-10-29.md), которое ты уже внедрил. Все правки ниже одобрены владельцем; ответы владельца на вопросы уже подставлены — ничего не уточняй, если не найдёшь прямого противоречия с кодом.

## Правила
- Тексты вставлять **дословно** (ru — как есть, uz — латиница, апостроф ‘ U+2018 и ’ где он стоит в тексте). Не переводить и не перефразировать.
- Title, description и H1 этих страниц **не трогать** — они уже внедрены и проходят проверку.
- Вопросы FAQ — заголовки `<h3>`, заголовок блока — `<h2>`. Разметку FAQPage **не добавлять**.
- Ссылки — обычные `<a href>` с указанным текстом (анкором) внутри указанного ответа. Если анкор в тексте ответа отсутствует дословно — вставь ссылку на ближайшую подходящую фразу и отметь это в отчёте.
- **Не трогать** «Демонстрационная версия» — эта задача ждёт владельца (цены пока примеры).
- Новых цен, сроков и обещаний не добавлять — только то, что написано здесь.

## Часть 1. Тексты страниц


### 1.1. https://forma-3d.uz/ru/contacts

> Title, description и H1 не меняем: они уже внедрены (2026-10-29-contacts-ru, applied) и проходят проверку по длине.

**Блок** — где: после блока «Мы — Forma 3D», перед подвалом  
(сейчас: На странице блоки «Как с нами связаться» (телефон, Telegram, часы), «Пункты самовывоза» (Ташкент, Навои), «Мы — Forma 3D» и ссылка на условия доставки. FAQ нет.)

`<h2>` **Частые вопросы**

- `<h3>` **Как быстрее всего с нами связаться?**  
  Напишите в Telegram @kemalsen или позвоните по номеру +998 99 454-19-13. Мы на связи ежедневно с 09:00 до 21:00. В Telegram удобно прислать фото детали или название модели принтера: так быстрее подобрать то, что нужно.
- `<h3>` **Можно ли забрать заказ самостоятельно?**  
  Да, самовывоз бесплатный. Пункты выдачи: Ташкент, ул. Бобура, 42, и Навои, ул. Спутник, 3, ежедневно с 09:00 до 21:00. Заказ можно забрать через час после того, как менеджер его подтвердит. Подробнее о сроках и оплате — на странице «Доставка и оплата». Пункты выдачи — это наш офис, поэтому заказ передаём у входа.
- `<h3>` **Можно ли приехать без заказа и посмотреть товар?**  
  Нет, витрины у нас нет: все товары продаются только по заказу — на сайте, по телефону +998 99 454-19-13 или в Telegram @kemalsen.
- `<h3>` **Поможете выбрать материал или запчасть?**  
  Да. Напишите, на каком принтере Bambu Lab вы печатаете (A1, A1 mini, P1S, X1C, H2D и другие) и что хотите напечатать. Подскажем подходящий филамент — PLA, PETG, ABS, ASA или TPU — либо хотэнд, сопло и печатный стол под вашу модель.
- `<h3>` **Работаете ли вы с компаниями и учебными заведениями?**  
  Да. Для принт-ферм, мастерских и учебных заведений есть оптовые цены от 5 катушек и документы для бизнеса, оплатить можно по счёту. Условия — на странице «Филамент оптом для бизнеса».

- **ссылка**: «Доставка и оплата» → `https://forma-3d.uz/ru/delivery` — в ответе «Можно ли забрать заказ самостоятельно?»
- **ссылка**: «Филамент оптом для бизнеса» → `https://forma-3d.uz/ru/business` — в ответе «Работаете ли вы с компаниями и учебными заведениями?»
- **ссылка**: «хотэнд, сопло и печатный стол» → `https://forma-3d.uz/ru/catalog/parts` — в ответе «Поможете выбрать материал или запчасть?»
- **ссылка**: «подходящий филамент» → `https://forma-3d.uz/ru/catalog` — в ответе «Поможете выбрать материал или запчасть?»

### 1.2. https://forma-3d.uz/uz/contacts

> Title, description и H1 не меняем: уже внедрены (2026-10-29-contacts-uz, applied).

**Блок** — где: после блока «Biz — Forma 3D», перед подвалом  
(сейчас: На странице блоки «Biz bilan bog‘lanish», «Olib ketish punktlari», «Biz — Forma 3D» и ссылка на условия доставки. FAQ нет.)

`<h2>` **Ko‘p beriladigan savollar**

- `<h3>` **Biz bilan qanday tezroq bog‘lanish mumkin?**  
  Telegramda @kemalsen ga yozing yoki +998 99 454-19-13 raqamiga qo‘ng‘iroq qiling. Har kuni 09:00 dan 21:00 gacha aloqadamiz. Telegramda detal rasmini yoki printer modelini yuborish qulay: shunda kerakli narsani tezroq tanlaymiz.
- `<h3>` **Buyurtmani o‘zim olib ketsam bo‘ladimi?**  
  Ha, olib ketish bepul. Punktlar: Toshkent, Bobur ko‘chasi, 42 va Navoiy, Sputnik ko‘chasi, 3, har kuni 09:00 dan 21:00 gacha. Menejer buyurtmani tasdiqlaganidan bir soat o‘tib uni olib ketishingiz mumkin. Muddat va to‘lov haqida batafsil — «Yetkazish va to‘lov» sahifasida. Olib ketish punktlari — bizning ofisimiz, shuning uchun buyurtmani kirish oldida topshiramiz.
- `<h3>` **Buyurtmasiz kelib, mahsulotni ko‘rsam bo‘ladimi?**  
  Yo‘q, bizda vitrina yo‘q: barcha mahsulotlar faqat buyurtma orqali sotiladi — saytda, +998 99 454-19-13 telefoni yoki Telegram @kemalsen orqali.
- `<h3>` **Material yoki ehtiyot qism tanlashga yordam berasizmi?**  
  Ha. Qaysi Bambu Lab printerida bosayotganingizni (A1, A1 mini, P1S, X1C, H2D va boshqalar) va nima bosmoqchi ekaningizni yozing. Mos filamentni — PLA, PETG, ABS, ASA yoki TPU — yoki modelingizga mos hotend, soplo va bosma stolini tavsiya qilamiz.
- `<h3>` **Kompaniyalar va ta’lim muassasalari bilan ishlaysizmi?**  
  Ha. Print-fermalar, ustaxonalar va ta’lim muassasalari uchun 5 ta g‘altakdan boshlab ulgurji narxlar va biznes uchun hujjatlar bor, hisob orqali to‘lash mumkin. Shartlar — «Biznes uchun ulgurji filament» sahifasida.

- **ссылка**: «Yetkazish va to‘lov» → `https://forma-3d.uz/uz/delivery` — в ответе «Buyurtmani o‘zim olib ketsam bo‘ladimi?»
- **ссылка**: «Biznes uchun ulgurji filament» → `https://forma-3d.uz/uz/business` — в ответе «Kompaniyalar va ta’lim muassasalari bilan ishlaysizmi?»
- **ссылка**: «hotend, soplo va bosma stolini» → `https://forma-3d.uz/uz/catalog/parts` — в ответе «Material yoki ehtiyot qism tanlashga yordam berasizmi?»
- **ссылка**: «mos filamentni» → `https://forma-3d.uz/uz/catalog` — в ответе «Material yoki ehtiyot qism tanlashga yordam berasizmi?»

### 1.3. https://forma-3d.uz/ru/delivery

> Title, description и H1 не меняем: уже внедрены (2026-10-29-delivery-ru, applied). Ссылка на /ru/contacts уже есть на странице.

**Блок** — где: после блока «Способы оплаты», перед подвалом  
(сейчас: Блоки: «Курьер по Ташкенту» (25 000 сум, до 14:00 — в тот же день), «Регионы Узбекистана» (1–4 дня, от 45 000 сум), «Самовывоз» (бесплатно, через 1 час после подтверждения, Ташкент и Навои), «Способы оплаты» (Payme, Click, UzCard, Humo; онлайн, по счёту, при получении в Ташкенте). FAQ нет.)

`<h2>` **Вопросы о доставке и оплате**

- `<h3>` **Как оформить и оплатить заказ?**  
  Добавьте товары в корзину и оформите заказ на сайте. Менеджер подтвердит наличие и пришлёт ссылку на оплату или счёт. Оплатить можно онлайн через Payme, Click, UzCard и Humo, по счёту для компаний или при получении в Ташкенте.
- `<h3>` **Успею ли я получить филамент сегодня?**  
  По Ташкенту — да, если оформить заказ до 14:00: курьер привезёт его в тот же день. Заказы после 14:00 доставляем на следующий день. Ещё быстрее — самовывоз: заказ можно забрать через час после подтверждения менеджером.
- `<h3>` **Доставляете ли вы в другие города Узбекистана?**  
  Да, в регионы отправляем курьерской службой, срок — 1–4 дня. Стоимость — 50 000 сум. Если вам удобнее Навои, заберите заказ сами в пункте на ул. Спутник, 3.
- `<h3>` **Есть ли бесплатная доставка?**  
  Самовывоз в Ташкенте и Навои всегда бесплатный. Доставка бесплатная при заказе от 1 000 000 сум.
- `<h3>` **Как быстро приходят материалы под заказ?**  
  Спецпластики — PLA-CF, PETG-CF, PC, PA-CF и PVA — мы привозим под заказ. Срок поставки — до 3 дней, точную дату менеджер сообщит при оформлении.
- `<h3>` **Работаете ли вы с юрлицами?**  
  Да. Принт-фермам, мастерским и учебным заведениям выставляем счёт, оптовые цены действуют от 5 катушек. Предоставляем все необходимые закрывающие документы. Подробнее — на странице «Филамент оптом для бизнеса».
- `<h3>` **Как вернуть товар?**  
  Условия возврата описаны на странице «Возврат товара». Если что-то пошло не так с заказом, напишите нам в Telegram @kemalsen — разберёмся.

- **ссылка**: «Филамент оптом для бизнеса» → `https://forma-3d.uz/ru/business` — в ответе «Работаете ли вы с юрлицами?»
- **ссылка**: «Возврат товара» → `https://forma-3d.uz/ru/returns` — в ответе «Как вернуть товар?»
- **ссылка**: «Спецпластики — PLA-CF, PETG-CF, PC, PA-CF и PVA» → `https://forma-3d.uz/ru/catalog` — в ответе «Как быстро приходят материалы под заказ?»

- **правка текста на странице** (карточка доставки в регионы на странице доставки): было «Регионы Узбекистана»: «от 45 000 сум» → стало **50 000 сум**. Если цифра есть ещё где-то (в т.ч. в данных/конфиге доставки) — поменять везде на этом языке.

### 1.4. https://forma-3d.uz/uz/delivery

> Title, description и H1 не меняем: уже внедрены (2026-10-29-delivery-uz, applied).

**Блок** — где: после блока «To‘lov usullari», перед подвалом  
(сейчас: Блоки: «Toshkent bo‘ylab kuryer» (25 000 so‘m, 14:00 gacha — shu kuni), «O‘zbekiston viloyatlari» (1–4 kun, 45 000 so‘mdan), «Olib ketish» (bepul, tasdiqlangandan 1 soat keyin, Toshkent va Navoiy), «To‘lov usullari» (Payme, Click, UzCard, Humo). FAQ нет.)

`<h2>` **Yetkazish va to‘lov bo‘yicha savollar**

- `<h3>` **Buyurtmani qanday rasmiylashtirish va to‘lash mumkin?**  
  Mahsulotlarni savatga qo‘shing va saytda buyurtma bering. Menejer mahsulot borligini tasdiqlaydi va to‘lov havolasini yoki hisobni yuboradi. Payme, Click, UzCard va Humo orqali onlayn, kompaniyalar uchun hisob orqali yoki Toshkentda qabul qilishda to‘lash mumkin.
- `<h3>` **Filamentni bugun olsam bo‘ladimi?**  
  Toshkentda — ha, agar buyurtmani 14:00 gacha bersangiz, kuryer uni shu kuni yetkazadi. 14:00 dan keyingi buyurtmalar ertasi kuni yetkaziladi. Bundan ham tezroq — olib ketish: menejer tasdiqlaganidan bir soat o‘tib buyurtmani olishingiz mumkin.
- `<h3>` **O‘zbekistonning boshqa shaharlariga yetkazasizmi?**  
  Ha, viloyatlarga kuryerlik xizmati orqali jo‘natamiz, muddati — 1–4 kun. Narxi — 50 000 so‘m. Navoiy sizga qulay bo‘lsa, buyurtmani Sputnik ko‘chasi, 3 dagi punktdan o‘zingiz olib keting.
- `<h3>` **Bepul yetkazish bormi?**  
  Toshkent va Navoiyda olib ketish har doim bepul. 1 000 000 so‘mdan boshlab buyurtmalarda yetkazib berish bepul.
- `<h3>` **Buyurtmaga keltiriladigan materiallar qancha vaqtda keladi?**  
  Maxsus plastiklarni — PLA-CF, PETG-CF, PC, PA-CF va PVA — buyurtmaga olib kelamiz. Yetkazib berish muddati — 3 kungacha, aniq sanani menejer buyurtma paytida aytadi.
- `<h3>` **Yuridik shaxslar bilan ishlaysizmi?**  
  Ha. Print-fermalar, ustaxonalar va ta’lim muassasalariga hisob beramiz, ulgurji narxlar 5 ta g‘altakdan boshlanadi. Barcha kerakli yopuvchi hujjatlarni taqdim etamiz. Batafsil — «Biznes uchun ulgurji filament» sahifasida.
- `<h3>` **Mahsulotni qanday qaytarish mumkin?**  
  Qaytarish shartlari «Mahsulotni qaytarish» sahifasida yozilgan. Buyurtmada muammo bo‘lsa, Telegramda @kemalsen ga yozing — hal qilamiz.

- **ссылка**: «Biznes uchun ulgurji filament» → `https://forma-3d.uz/uz/business` — в ответе «Yuridik shaxslar bilan ishlaysizmi?»
- **ссылка**: «Mahsulotni qaytarish» → `https://forma-3d.uz/uz/returns` — в ответе «Mahsulotni qanday qaytarish mumkin?»
- **ссылка**: «Maxsus plastiklarni — PLA-CF, PETG-CF, PC, PA-CF va PVA» → `https://forma-3d.uz/uz/catalog` — в ответе «Buyurtmaga keltiriladigan materiallar qancha vaqtda keladi?»

- **правка текста на странице** (карточка доставки в регионы на странице доставки): было «O‘zbekiston viloyatlari»: «45 000 so‘mdan» → стало **50 000 so‘m**. Если цифра есть ещё где-то (в т.ч. в данных/конфиге доставки) — поменять везде на этом языке.

### 1.5. https://forma-3d.uz/ru/knowledge

> Title, description и H1 не меняем (H1 внедрён в 2026-10-29-knowledge-ru, applied; title и description в норме). Для программиста: по WebFetch не видно, куда ведут карточки статей. Если ссылок нет или они ведут на пустые страницы, оставить карточки без ссылок до публикации статей (content-writer).

**Блок** — где: вводный абзац сразу под H1 «База знаний по 3D-печати и филаменту», перед карточками  
(сейчас: Под H1 сразу идут 5 карточек статей (заголовок, метка, время чтения), вводного текста нет.)

Абзац:

> Здесь собираем практические советы по 3D-печати на принтерах Bambu Lab: как выбрать первый филамент, чем отличаются PLA и PETG, как хранить катушки между печатями, с чего начать в Bambu Studio и когда менять сопло. Не нашли ответ — напишите нам в Telegram @kemalsen: подскажем материал и запчасть под вашу модель принтера. Мы на связи ежедневно с 09:00 до 21:00.

**Блок** — где: анонс (1–2 предложения) под заголовком H3 каждой из 5 карточек  
(сейчас: У карточек только заголовок, метка и время чтения. Текстов статей на сайте нет.)

Анонс под заголовком каждой карточки:

- «Первый филамент: с чего начать?» → Что учитывать при выборе первого материала и чем отличаются линейки PLA Basic и PLA Matte от Bambu Lab.
- «PETG или PLA: что выбрать для детали» → Сравниваем PLA и PETG по прочности, термостойкости и простоте печати, чтобы подобрать материал под конкретную деталь.
- «Как хранить филамент между печатями» → Почему пластик набирает влагу и как этого избежать: сушилка для филамента, вакуумные пакеты и силикагель.
- «Настройки Bambu Studio: первые шаги» → С чего начать в слайсере Bambu Lab: профиль филамента, высота слоя и базовые настройки печати.
- «Когда пора менять сопло» → По каким признакам понять, что сопло износилось, и когда вместо стального нужно закалённое.

**Блок** — где: после карточек, перед подвалом  
(сейчас: Блока нет.)

`<h2>` **Коротко о материалах в нашем каталоге**

- `<h3>` **Какой диаметр у филамента?**  
  Весь филамент Bambu Lab в нашем каталоге — диаметром 1,75 мм, на катушках по 1 кг.
- `<h3>` **Чем рефилл отличается от филамента на катушке?**  
  Рефилл — это тот же 1 кг филамента, но без катушки. Его ставят на многоразовую катушку Bambu Lab, поэтому, если она у вас уже есть, новая катушка с каждым заказом не нужна.
- `<h3>` **Какие материалы можно купить?**  
  В каталоге есть PLA (Basic и Matte), PETG HF, ABS, ASA и TPU. Инженерные пластики — PLA-CF, PETG-CF, PC, PA-CF и PVA — привозим под заказ.
- `<h3>` **Есть ли запчасти для моего принтера?**  
  Мы подбираем хотэнды и сопла для Bambu Lab A1, P1, X1 и H2, а также печатные столы, AMS и детали для ремонта. Напишите модель принтера — подскажем, что подойдёт.

- **ссылка**: «филамент Bambu Lab» → `https://forma-3d.uz/ru/catalog` — в ответе «Какой диаметр у филамента?»
- **ссылка**: «многоразовую катушку Bambu Lab» → `https://forma-3d.uz/ru/product/reusable-spool` — в ответе «Чем рефилл отличается от филамента на катушке?»
- **ссылка**: «хотэнды и сопла для Bambu Lab» → `https://forma-3d.uz/ru/catalog/parts` — в ответе «Есть ли запчасти для моего принтера?»
- **ссылка**: «сушилка для филамента» → `https://forma-3d.uz/ru/product/filament-dryer` — в анонсе карточки «Как хранить филамент между печатями»
- **ссылка**: «вакуумные пакеты» → `https://forma-3d.uz/ru/product/vacuum-storage-bags` — в анонсе карточки «Как хранить филамент между печатями» (с той же оговоркой про вложенные ссылки)

### 1.6. https://forma-3d.uz/uz/knowledge

> Title, description и H1 не меняем (уже внедрены, в норме). Карточки статей без ссылок до публикации статей.

**Блок** — где: вводный абзац сразу под H1 «3D-bosma va filament bo‘yicha bilimlar bazasi», перед карточками  
(сейчас: Под H1 сразу идут 5 карточек (sarlavha, belgi, o‘qish vaqti), вводного текста нет.)

Абзац:

> Bu yerda Bambu Lab printerlarida 3D-bosma bo‘yicha amaliy maslahatlarni to‘playmiz: birinchi filamentni qanday tanlash, PLA va PETG farqi, g‘altaklarni bosmalar orasida qanday saqlash, Bambu Studio’da nimadan boshlash va soploni qachon almashtirish kerak. Javob topmadingizmi? Telegramda @kemalsen ga yozing: printeringiz modeliga mos material va ehtiyot qismni tavsiya qilamiz. Har kuni 09:00 dan 21:00 gacha aloqadamiz.

**Блок** — где: анонс (1–2 предложения) под заголовком H3 каждой из 5 карточек  
(сейчас: У карточек только заголовок, метка и время чтения.)

Анонс под заголовком каждой карточки:

- «Birinchi filamentni qanday tanlash kerak?» → Birinchi materialni tanlashda nimalarga e’tibor berish kerak va Bambu Lab PLA Basic hamda PLA Matte bir-biridan nimasi bilan farq qiladi.
- «Detal uchun PETG yoki PLA?» → PLA va PETG’ni mustahkamlik, issiqlikka chidamlilik va bosish qulayligi bo‘yicha solishtiramiz — aniq detal uchun material tanlash oson bo‘ladi.
- «Bosmalar orasida filamentni qanday saqlash kerak» → Plastik nega nam tortadi va bunga qanday yo‘l qo‘ymaslik mumkin: filament quritgich, vakuum paketlar va silikagel.
- «Bambu Studio: dastlabki sozlamalar» → Bambu Lab slayserida nimadan boshlash kerak: filament profili, qatlam balandligi va asosiy bosma sozlamalari.
- «Soploni qachon almashtirish kerak» → Soplo eskirganini qaysi belgilardan bilish mumkin va qachon po‘lat o‘rniga qattiqlashtirilgan soplo kerak bo‘ladi.

**Блок** — где: после карточек, перед подвалом  
(сейчас: Блока нет.)

`<h2>` **Katalogimizdagi materiallar haqida qisqacha**

- `<h3>` **Filament diametri qanday?**  
  Katalogimizdagi barcha Bambu Lab filamenti 1,75 mm diametrli, 1 kg li g‘altaklarda.
- `<h3>` **Refill g‘altakdagi filamentdan nimasi bilan farq qiladi?**  
  Refill — o‘sha 1 kg filament, faqat g‘altaksiz. U qayta ishlatiladigan Bambu Lab g‘altagiga o‘rnatiladi, shuning uchun bunday g‘altagingiz bo‘lsa, har buyurtmada yangi g‘altak kerak emas.
- `<h3>` **Qanday materiallarni sotib olish mumkin?**  
  Katalogda PLA (Basic va Matte), PETG HF, ABS, ASA va TPU bor. Muhandislik plastiklarini — PLA-CF, PETG-CF, PC, PA-CF va PVA — buyurtmaga olib kelamiz.
- `<h3>` **Printerim uchun ehtiyot qismlar bormi?**  
  Bambu Lab A1, P1, X1 va H2 uchun hotend va soplolar, shuningdek bosma stollari, AMS va ta’mirlash qismlarini tanlaymiz. Printer modelini yozing — mosini aytamiz.

- **ссылка**: «Bambu Lab filamenti» → `https://forma-3d.uz/uz/catalog` — в ответе «Filament diametri qanday?»
- **ссылка**: «qayta ishlatiladigan Bambu Lab g‘altagi» → `https://forma-3d.uz/uz/product/reusable-spool` — в ответе «Refill g‘altakdagi filamentdan nimasi bilan farq qiladi?»
- **ссылка**: «hotend va soplolar» → `https://forma-3d.uz/uz/catalog/parts` — в ответе «Printerim uchun ehtiyot qismlar bormi?»
- **ссылка**: «filament quritgich» → `https://forma-3d.uz/uz/product/filament-dryer` — в анонсе карточки «Bosmalar orasida filamentni qanday saqlash kerak» (если карточка целиком ссылка — вынести во вводный абзац)
- **ссылка**: «vakuum paketlar» → `https://forma-3d.uz/uz/product/vacuum-storage-bags` — в анонсе той же карточки (с той же оговоркой)

## Часть 2. Технические задачи


### 2.1. lastmod в sitemap = дата реального изменения страницы, а не время генерации файла

**Сейчас:** У всех 236 URL одинаковый lastmod, равный времени генерации sitemap. Аудит видел 2026-10-29T09:00:00.841Z, потом 2026-10-29T11:19:14.946Z, а 2026-10-30 WebFetch уже вернул <lastmod>2026-10-29T16:29:04.820Z</lastmod>. Значение меняется при каждой генерации и у всех URL совпадает.

**Почему:** Когда lastmod у всех URL совпадает и меняется при каждой генерации, Google перестаёт ему доверять и не использует его для приоритизации переобхода. Честный lastmod помогает быстрее переиндексировать изменённые карточки, например когда появятся цены (no-offer-001).

**Что сделать:**
- **spec**:
  - 1. Для карточек /ru|uz/product/<slug> брать в lastmod дату последнего изменения товара (поле updated_at или аналог в БД): цена, наличие, название, описание, фото.
  - 2. Для страниц каталога /ru|uz/catalog и /ru|uz/catalog/parts брать максимальный updated_at среди товаров раздела или дату изменения текста раздела, смотря что позже.
  - 3. Для статичных страниц (/, /contacts, /delivery, /business, /knowledge, юридических) брать дату последнего изменения шаблона или контента страницы. Если CMS её не хранит, записать дату публикации правки вручную (константа в конфиге страницы).
  - 4. ru- и uz-версия одной страницы могут иметь разный lastmod, это нормально.
  - 5. Формат оставить W3C Datetime, например 2026-10-29T16:29:04Z или просто дата 2026-10-29.
  - 6. Если реальную дату для какого-то типа страниц получить нельзя, тег <lastmod> для этих URL лучше убрать совсем, чем выводить время генерации.
- **example**:
  - **before**:
    <url><loc>https://forma-3d.uz/ru/product/pla-basic-black</loc>…<lastmod>2026-10-29T16:29:04.820Z</lastmod>…</url>
  - **after**:
    <url><loc>https://forma-3d.uz/ru/product/pla-basic-black</loc>…<lastmod>{updated_at товара pla-basic-black}</lastmod>…</url>
- **acceptance**:
  - Два запроса к sitemap.xml с интервалом в несколько минут без правок на сайте возвращают одинаковые lastmod.
  - У URL, которые не менялись, lastmod разный (не одна дата на все 236 URL).
  - После правки одного товара меняется lastmod только у его ru- и uz-URL.


### 2.2. Добавить hreflang x-default в sitemap, как в HTML

**Сейчас:**
```
<url>
<loc>https://forma-3d.uz/ru</loc>
<xhtml:link rel="alternate" hreflang="ru" href="https://forma-3d.uz/ru" />
<xhtml:link rel="alternate" hreflang="uz" href="https://forma-3d.uz/uz" />
<lastmod>…</lastmod>
<priority>1</priority>
</url>
```

**Почему:** Сейчас hreflang в HTML (ru/uz/x-default) и в sitemap (ru/uz) расходятся. Ошибкой это не считается, но поисковик получает два разных набора сигналов. Если привести их к одному виду, источник правды будет один.

**Что сделать:**
- **spec**:
  - 1. В каждый <url> sitemap (и для ru-, и для uz-адреса пары) добавить третью строку xhtml:link с hreflang="x-default". Она указывает на ru-версию страницы, как уже сделано в HTML на всех 250 страницах.
  - 2. Набор alternate у ru- и uz-URL одной пары должен быть одинаковым: ru, uz, x-default.
  - 3. Коды ru и uz не менять (uz без -Latn допустим, пока нет кириллической версии).
- **example_after**:
  ```
<url>
<loc>https://forma-3d.uz/ru</loc>
<xhtml:link rel="alternate" hreflang="ru" href="https://forma-3d.uz/ru" />
<xhtml:link rel="alternate" hreflang="uz" href="https://forma-3d.uz/uz" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://forma-3d.uz/ru" />
<lastmod>…</lastmod>
<priority>1</priority>
</url>

<url>
<loc>https://forma-3d.uz/uz/delivery</loc>
<xhtml:link rel="alternate" hreflang="ru" href="https://forma-3d.uz/ru/delivery" />
<xhtml:link rel="alternate" hreflang="uz" href="https://forma-3d.uz/uz/delivery" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://forma-3d.uz/ru/delivery" />
…
</url>
  ```
- **acceptance**:
  - В sitemap.xml у всех 236 <url> ровно три xhtml:link: ru, uz, x-default.
  - x-default в sitemap совпадает с x-default в HTML той же страницы (выборочно проверить /ru, /uz/delivery, /ru/product/pla-basic-black).


### 2.3. robots.txt: убрать Host и Disallow для корзины и кабинета (noindex остаётся)

**Сейчас:**
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /ru/cart
Disallow: /uz/cart
Disallow: /ru/account
Disallow: /uz/account

Host: https://forma-3d.uz
Sitemap: https://forma-3d.uz/sitemap.xml
```

**Почему:** Сейчас cart и account закрыты Disallow и одновременно помечены noindex. Робот не может открыть страницу и не видит noindex. Ссылки на эти страницы стоят на всех 250 страницах, поэтому URL могут попасть в индекс без содержимого. Host — мусорная директива. Оба изменения низкого риска.

**Что сделать:**
- **robots_txt**:
  ```
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://forma-3d.uz/sitemap.xml
  ```
- **spec**:
  - 1. Удалить строку «Host: https://forma-3d.uz»: Яндекс не учитывает эту директиву с 2018 года, Google её никогда не поддерживал.
  - 2. Удалить 4 строки Disallow для /ru/cart, /uz/cart, /ru/account, /uz/account.
  - 3. На самих страницах cart и account оставить <meta name="robots" content="noindex, follow"> как есть. Теперь робот сможет их открыть, увидит noindex и не возьмёт их в индекс.
  - 4. Disallow: /api/ оставить.
- **acceptance**:
  - https://forma-3d.uz/robots.txt совпадает с proposed.robots_txt.
  - На /ru/cart, /uz/cart, /ru/account, /uz/account по-прежнему отдаётся meta robots noindex, follow.
  - Персональные данные на /account без авторизации не отдаются (проверить: робот без cookie должен получать форму входа, а не данные пользователя).


### 2.4. www.forma-3d.uz: DNS-запись и 301 на https://forma-3d.uz

**Сейчас:** www.forma-3d.uz не резолвится (NameResolutionError, повторная проверка 2026-10-29). Тот, кто вводит адрес с www, получает ошибку браузера. http://forma-3d.uz/ru → 301 → https://forma-3d.uz/ru работает.

**Почему:** Часть пользователей по привычке набирает адрес с www или переходит по старым ссылкам с www и попадает на ошибку. Это потерянный трафик и минус к доверию. 301 склеит оба варианта в основной домен.

**Что сделать:**
- **spec**:
  - 1. DNS: добавить запись для www. Лучше CNAME www → forma-3d.uz. Если хостинг требует A/AAAA, указать те же IP, что у forma-3d.uz.
  - 2. TLS: сертификат должен покрывать и forma-3d.uz, и www.forma-3d.uz (SAN или отдельный сертификат), иначе на https://www будет ошибка сертификата до редиректа.
  - 3. Веб-сервер: всё с хоста www (http и https) отправлять одним 301 на https://forma-3d.uz с сохранением пути и query: http(s)://www.forma-3d.uz/<path>?<query> → https://forma-3d.uz/<path>?<query>.
  - 4. Редирект должен быть в один шаг. Цепочка www → http → https недопустима. Корень https://www.forma-3d.uz/ можно отправлять сразу на https://forma-3d.uz/ru (сейчас корень отдаёт 301 на /ru) или на https://forma-3d.uz/ (тогда будет 2 шага), лучше сразу на /ru.
- **before_after**:
  - **request**:
    https://www.forma-3d.uz/ru
  - **before**:
    DNS error (NameResolutionError)
  - **after**:
    301 Location: https://forma-3d.uz/ru
  - **request**:
    http://www.forma-3d.uz/ru/product/pla-basic-black
  - **before**:
    DNS error
  - **after**:
    301 Location: https://forma-3d.uz/ru/product/pla-basic-black
  - **request**:
    https://www.forma-3d.uz/
  - **before**:
    DNS error
  - **after**:
    301 Location: https://forma-3d.uz/ru
- **acceptance**:
  - Все три запроса из before_after отдают один 301 на указанный адрес, без ошибок сертификата.
  - Повторный аудит не находит www-dns-001.

> Если DNS и сертификаты настраиваются не в коде (регистратор домена / панель Railway) — дай владельцу пошаговую инструкцию в отчёте вместо выполнения.


---

## Часть 3. Проверка и отчёт

**Перед деплоем:**
- [ ] На /contacts, /delivery, /knowledge (ru и uz) новые блоки выводятся, на каждой странице по-прежнему один `<h1>`, title/description не изменились.
- [ ] На /uz/* нет кириллицы в новых блоках.
- [ ] В тексте нет «[УТОЧНИТЬ» и «DEMO» не появилось нигде нового.
- [ ] На /delivery в карточке регионов — «50 000 сум» / «50 000 so‘m».
- [ ] Все новые ссылки отдают 200.
- [ ] robots.txt, sitemap.xml и редирект www соответствуют критериям приёмки из части 2.

**Отчёт владельцу** (как в прошлый раз): 1) что сделано по пунктам 1.x и 2.x; 2) что не сделано и почему; 3) что сделано не так, как в ТЗ, и почему; 4) изменённые файлы.
