# Akmal Farm — Digital Invitation & RSVP

A polished, mobile-first **bilingual (Uzbek / Russian) event-invitation site** for the grand
opening of an Akmal Farm pharmacy branch, with a built-in **RSVP flow that delivers every
response to an admin on Telegram** and stores it in Supabase.

Guests tap **"I'll come" / "Can't make it"**, leave their name & phone, and the reply lands
instantly in the organizer's Telegram — no spreadsheet, no manual chasing.

**Tech stack:** static HTML/CSS/JS · Three.js (3D pill) · Motion (animations) ·
Vercel Serverless Function (`/api/rsvp`) · Supabase (Postgres + RLS) · Telegram Bot API.

**Highlights**
- 🎨 Editorial "medical-luxury" design — navy + Akmal-red, 3D capsule, animated ECG heartbeat line.
- ✍️ Iconographed RSVP form with a yes/no toggle, focus rings, and an animated success state.
- 🔒 Zero secrets in the browser — the frontend posts to a same-origin serverless function.
- 🛡️ **4-layer anti-spam:** honeypot, time-trap, per-IP rate-limit (hashed IPs), phone dedup.
- ♿ Accessible: labeled inputs, keyboard focus states, `prefers-reduced-motion` respected.

> Реализация ниже описана по-русски. / Setup guide below is in Russian.

---

## О проекте

Профессиональное двуязычное (UZ/RU) приглашение на открытие нового филиала
**Akmal Farm** с формой ответа (RSVP). Гость отвечает «приду / не смогу»,
заявка сохраняется в **Supabase** и мгновенно приходит **админу в Telegram**.

- **Дизайн** — статичный `index.html` (3D-капсула, ЭКГ-линия, анимации). Собирать не нужно.
- **Форма RSVP** — секция «JAVOB BERISH · ОТВЕТИТЬ» внизу страницы.
- **Бэкенд** — Vercel serverless-функция `/api/rsvp` (без Supabase CLI и Docker).
- **База** — Supabase (таблица `rsvps`).
- **Уведомления** — Telegram-боту приходит каждая заявка.

```
index.html                 ← сайт + форма (готов)
api/rsvp.js                ← бэкенд: пишет в Supabase + шлёт в Telegram
vercel.json                ← настройки хостинга
.env.example               ← какие переменные задать в Vercel
supabase/
  migrations/0001_rsvps.sql← таблица rsvps
```

> Ключи (service_role, токен бота) хранятся **только** как переменные окружения на Vercel —
> в браузер они не попадают. Фронтенд просто отправляет форму на `/api/rsvp` того же домена.

---

## Запуск — 4 шага (файлы редактировать НЕ нужно)

### 1. Supabase — только база
1. https://supabase.com → **New project** (регион EU/Frankfurt). Запомнить пароль.
2. **SQL Editor** → New query → вставить [`supabase/migrations/0001_rsvps.sql`](supabase/migrations/0001_rsvps.sql) → **Run**. Появится таблица `rsvps`.
3. **Settings → API** → скопировать два значения:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ секрет, не публикуй.

### 2. Telegram-бот
1. @BotFather → `/newbot` → получить **token** → это `TELEGRAM_BOT_TOKEN`.
2. Узнать свой **chat_id**: напишите боту **@userinfobot** — он пришлёт ваш `id` → это `TELEGRAM_ADMIN_CHAT_ID`.
   > Для отправки в чат/канал — добавьте бота туда админом и укажите id этого чата.

### 3. Задеплоить на Vercel
- Залить папку в GitHub → на https://vercel.com **Add New → Project → Import**, framework **Other** (сборки нет).
- Открыть **Settings → Environment Variables** и добавить (значения из `.env.example`):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | из шага 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | из шага 1 (secret) |
| `TELEGRAM_BOT_TOKEN` | из шага 2 (secret) |
| `TELEGRAM_ADMIN_CHAT_ID` | ваш chat_id из шага 2 |
| `IP_SALT` | любая случайная строка (необязательно) |

- Нажать **Deploy** (или Redeploy, если переменные добавили после первого деплоя).
- Через CLI как альтернатива: `npm i -g vercel` → `vercel` → задать env → `vercel --prod`.

### 4. Проверка
Открыть сайт → «Ha, kelaman» → имя/телефон → **Yuborish**. Должно:
(а) показать «Rahmat! Sizni kutamiz», (б) прислать сообщение вам в Telegram,
(в) добавить строку в таблицу `rsvps` (Supabase → Table Editor).

---

## Где смотреть ответы
- **Telegram** — каждая заявка приходит вам сообщением (✅ придёт / ❌ не придёт, имя, телефон, гости, комментарий).
- **Supabase → Table Editor → `rsvps`** — полный список (можно выгрузить в CSV).

## Данные события (в `index.html`)
- **Дата:** 2-iyul 2026 / 2 июля 2026 · **Время:** soat 11:00
- **Адрес:** Andijon vil., Qoʻrgʻontepa t., Yuksalish MFY, Mustaqillik koʻchasi, 972-uy
- **Контакт:** ☎ 1080 · akmalfarm.uz

Поменять текст/дату/адрес — поиском по этим строкам в `index.html`.

## Локальный тест дизайна
`index.html` открывается сам по себе в браузере (форма отправит на `/api/rsvp`, который работает
только на Vercel). Для полного локального теста удобнее `vercel dev`.

## Безопасность и анти-спам
- service_role и токен бота — **только** env-переменные на Vercel, в браузер не попадают.
- Таблица `rsvps` закрыта RLS; запись идёт только с сервера (service_role).
- **Анти-спам встроен** (4 уровня, настраивать не нужно):
  1. **Honeypot** — скрытое поле `company`; боты его заполняют → тихо отклоняется.
  2. **Ловушка по времени** — заявка быстрее 2.5 сек после загрузки → бот.
  3. **Rate-limit по IP** — максимум 5 заявок с IP за 10 минут (IP хранится как SHA-256 хэш).
  4. **Дедуп по телефону** — один номер не отправит повтор в течение 45 сек.
- Пороги — вверху [`api/rsvp.js`](api/rsvp.js) (`IP_MAX_IN_WINDOW`, `MIN_FILL_MS` и т.д.).
