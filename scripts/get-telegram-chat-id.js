const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Додай TELEGRAM_BOT_TOKEN у файл .env.local");
  process.exitCode = 1;
  return;
}

async function main() {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates`,
  );
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error("Telegram API не повернув список оновлень");
  }

  const chats = new Map();

  for (const update of result.result) {
    const chat =
      update.message?.chat ||
      update.edited_message?.chat ||
      update.channel_post?.chat;

    if (chat) {
      chats.set(String(chat.id), {
        id: chat.id,
        name: chat.title || chat.username || chat.first_name || "Без назви",
        type: chat.type,
      });
    }
  }

  if (chats.size === 0) {
    console.log("Чатів не знайдено. Напиши боту /start і запусти команду ще раз.");
    return;
  }

  console.table([...chats.values()]);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
