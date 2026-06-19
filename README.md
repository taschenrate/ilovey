# I Love You

Інтерактивний сайт-запрошення на побачення з відправкою відповіді в Telegram.

## Налаштування Telegram

1. Напиши своєму боту `/start`.
2. Скопіюй `.env.example` у `.env.local`.
3. Додай у `.env.local` токен бота:

   ```env
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_CHAT_ID=
   ```

4. Отримай ID чату:

   ```bash
   npm run telegram:chat-id
   ```

5. Запиши знайдений ID у `TELEGRAM_CHAT_ID`.

Файл `.env.local` і всі інші `.env`-файли ігноруються Git.

## Локальний запуск

Для роботи serverless-функції використовуй Vercel CLI:

```bash
npx vercel dev
```

## Розгортання на Vercel

Підключи GitHub-репозиторій до Vercel та додай у налаштуваннях проєкту:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Після додавання змінних виконай новий deploy. На GitHub Pages endpoint
`/api/send-telegram` працювати не буде.
