  // callbacks.ts

import { BOT_TOKEN, INDEX_CHANNEL_ID } from "./config.ts";
import { redis } from "./redis.ts";
import { handleAdminCallback } from "./adminPanel.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Handle all inline button callbacks
 */
export async function handleCallback(callback: any) {
  const data = callback.data;
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;

  // ===== ADMIN CALLBACKS =====
  if (data.startsWith("admin_")) {
    await handleAdminCallback(data, chatId);
    return;
  }

  // ===== A–Z LETTER CLICK =====
  if (data.startsWith("letter:")) {
    const letter = data.split(":")[1];
    const titles = await redis.smembers(`titles:${letter}`);

    const keyboard = titles.map((t) => [
      { text: t, callback_data: `title:${t}` },
    ]);

    keyboard.push([{ text: "⬅ Back", callback_data: "main_menu" }]);

    await editMessage(
      INDEX_CHANNEL_ID,
      messageId,
      `📂 Titles starting with <b>${letter}</b>`,
      keyboard,
    );
    return;
  }

  // ===== TITLE CLICK =====
  if (data.startsWith("title:")) {
    const title = data.split(":")[1];
    const seasons = await redis.smembers(`seasons:${title}`);

    const keyboard = seasons.map((s) => [
      { text: s, callback_data: `season:${title}:${s}` },
    ]);

    keyboard.push([{ text: "⬅ Back", callback_data: "main_menu" }]);

    await editMessage(
      INDEX_CHANNEL_ID,
      messageId,
      `🎬 <b>${title}</b>\nSelect season`,
      keyboard,
    );
    return;
  }

  // ===== SEASON CLICK =====
  if (data.startsWith("season:")) {
    const [, title, season] = data.split(":");
    const link = await redis.get(`download:${title}:${season}`);

    await editMessage(
      INDEX_CHANNEL_ID,
      messageId,
      `<b>${title}</b>\n${season}`,
      [[{ text: "⬇ Download", url: link ?? "#" }]],
    );
  }
}

/**
 * Edit an existing Telegram message
 */
async function editMessage(
  chatId: number,
  messageId: number,
  text: string,
  inlineKeyboard: any[],
) {
  await fetch(`${API}/editMessageText`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: inlineKeyboard },
    }),
  });
}

/**
 * Shared sendMessage helper
 */
export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: any,
) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
}