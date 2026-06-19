const assert = require("node:assert/strict");
const handler = require("../api/send-telegram");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function run() {
  const originalFetch = global.fetch;
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;

  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "123456";
  handler._test.recentSuccessfulRequests.clear();

  try {
    const invalidResponse = createResponse();
    await handler(
      {
        method: "POST",
        body: { dateType: "", place: "", contact: "a" },
        headers: {},
        socket: { remoteAddress: "invalid-test" },
      },
      invalidResponse,
    );

    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(invalidResponse.body.success, false);

    let telegramRequest;
    global.fetch = async (url, options) => {
      telegramRequest = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      };
    };

    const successResponse = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          dateType: "Кафе ☕",
          place: "Мій вибір",
          contact: "@username",
          refusedAttempts: 4,
        },
        headers: { "x-forwarded-for": "203.0.113.10" },
        socket: {},
      },
      successResponse,
    );

    assert.equal(successResponse.statusCode, 200);
    assert.equal(successResponse.body.success, true);
    assert.match(telegramRequest.url, /api\.telegram\.org/);

    const telegramBody = JSON.parse(telegramRequest.options.body);
    assert.equal(telegramBody.chat_id, "123456");
    assert.match(telegramBody.text, /Побачення: Кафе/);
    assert.match(telegramBody.text, /Спроб відмовитись: 4/);

    const limitedResponse = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          dateType: "Кафе",
          place: "Мій вибір",
          contact: "@username",
          refusedAttempts: 4,
        },
        headers: { "x-forwarded-for": "203.0.113.10" },
        socket: {},
      },
      limitedResponse,
    );

    assert.equal(limitedResponse.statusCode, 429);
    console.log("Telegram endpoint tests passed");
  } finally {
    global.fetch = originalFetch;

    if (originalToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    }

    if (originalChatId === undefined) {
      delete process.env.TELEGRAM_CHAT_ID;
    } else {
      process.env.TELEGRAM_CHAT_ID = originalChatId;
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
