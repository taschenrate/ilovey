const recentSuccessfulRequests = new Map();
const RATE_LIMIT_MS = 10_000;

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function getClientKey(request) {
  const forwardedFor = request.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket?.remoteAddress || "unknown";
}

function formatSubmittedAt(date = new Date()) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Kyiv",
  }).format(date);
}

function getTelegramErrorMessage(status, description = "") {
  const normalizedDescription = description.toLowerCase();

  if (status === 401) {
    return "Неправильний токен Telegram-бота";
  }

  if (status === 403) {
    return "Бот не може написати в цей чат. Розблокуй бота та натисни /start";
  }

  if (
    status === 400 &&
    (normalizedDescription.includes("chat not found") ||
      normalizedDescription.includes("chat_id"))
  ) {
    return "Telegram-чат не знайдено. Напиши боту /start і перевір TELEGRAM_CHAT_ID";
  }

  return "Telegram відхилив повідомлення. Перевір токен і TELEGRAM_CHAT_ID";
}

module.exports = async function sendTelegram(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, {
      success: false,
      message: "Метод не підтримується",
    });
  }

  let body = request.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }

  const dateType = normalizeText(body?.dateType, 100);
  const place = normalizeText(body?.place, 100);
  const contact = normalizeText(body?.contact, 200);
  const refusedAttempts = Number.isFinite(Number(body?.refusedAttempts))
    ? Math.max(0, Math.min(1000, Math.trunc(Number(body.refusedAttempts))))
    : 0;

  if (!dateType || !place || contact.length < 3) {
    return sendJson(response, 400, {
      success: false,
      message: "Некоректні дані",
    });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Telegram environment variables are not configured");
    return sendJson(response, 500, {
      success: false,
      message: "Не вдалося надіслати повідомлення",
    });
  }

  const clientKey = getClientKey(request);
  const lastSuccessfulRequest = recentSuccessfulRequests.get(clientKey) || 0;

  if (Date.now() - lastSuccessfulRequest < RATE_LIMIT_MS) {
    return sendJson(response, 429, {
      success: false,
      message: "Зачекай кілька секунд перед повторною відправкою",
    });
  }

  const submittedAt = formatSubmittedAt();
  const message = [
    "💖 Нова відповідь із сайту",
    "",
    `📌 Побачення: ${dateType || "Не вказано"}`,
    `📍 Місце: ${place || "Не вказано"}`,
    `📱 Контакт: ${contact || "Не вказано"}`,
    "",
    `😭 Спроб відмовитись: ${refusedAttempts}`,
    `🕒 Час: ${submittedAt}`,
  ].join("\n");

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      },
    );

    const telegramResult = await telegramResponse.json().catch(() => null);

    if (!telegramResponse.ok || !telegramResult?.ok) {
      const safeMessage = getTelegramErrorMessage(
        telegramResponse.status,
        telegramResult?.description,
      );

      console.error(
        `Telegram API rejected the request: ${telegramResponse.status} ${telegramResult?.description || ""}`,
      );

      return sendJson(response, 502, {
        success: false,
        message: safeMessage,
      });
    }

    recentSuccessfulRequests.set(clientKey, Date.now());

    return sendJson(response, 200, {
      success: true,
      message: "Відповідь успішно надіслана",
    });
  } catch (error) {
    console.error("Telegram send failed:", error);
    return sendJson(response, 502, {
      success: false,
      message: "Не вдалося надіслати повідомлення",
    });
  }
};

module.exports._test = {
  formatSubmittedAt,
  getTelegramErrorMessage,
  normalizeText,
  recentSuccessfulRequests,
};
