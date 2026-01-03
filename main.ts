  // main.ts

import { config } from "./config.ts";
import { redis } from "./redis.ts";
import { isAdmin } from "./users.ts";
import { sendAdminPanel } from "./adminPanel.ts";
import { handleCallback } from "./callbacks.ts";
import { logAdminAction, logStatus } from "./logging.ts";

// ---------- BASIC TYPES ----------
type Update = {
  update_id: number;
  message?: any;
  callback_query?: any;
};

// ---------- TELEGRAM API ----------
const API = `https://api.telegram.org/bot${config.BOT_TOKEN}`;

async function tg(method: string, body: Record<string, any>) {
  await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------- COMMAND HANDLER ----------
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;

  // Only admins can use commands
  if (!isAdmin(userId)) return;

  if (text === "/start" || text === "/admin") {
    await sendAdminPanel(chatId);
    logAdminAction(userId, "Opened admin panel");
    return;
  }

  if (text === "/health") {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "✅ Bot is alive\n🧠 Redis: OK\n⚙️ Mode: Polling",
    });
    return;
  }

  if (text === "/stats") {
    const users = await redis.scard("users");
    const titles = await redis.scard("titles");

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `📊 *Bot Stats*\n\n` +
        `👤 Users: ${users}\n` +
        `🎬 Titles: ${titles}`,
      parse_mode: "Markdown",
    });
    return;
  }
}

// ---------- UPDATE LOOP ----------
let offset = 0;

async function poll() {
  try {
    const res = await fetch(
      `${API}/getUpdates?timeout=30&offset=${offset}`,
    );
    const data = await res.json();

    if (!data.ok) return;

    for (const update of data.result as Update[]) {
      offset = update.update_id + 1;

      if (update.message) {
        await handleMessage(update.message);
      }

      if (update.callback_query) {
        await handleCallback(update.callback_query);
      }
    }
  } catch (err) {
    console.error("Polling error:", err);
  }
}

// ---------- START ----------
logStatus("Bot started (Railway / Polling)");

while (true) {
  await poll();
  await new Promise((r) => setTimeout(r, 1000));
}