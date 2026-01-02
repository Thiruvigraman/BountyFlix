// adminPanel.ts
import { BOT_TOKEN } from "./config.ts";
import { sendLog } from "./logging.ts";
import { sendOrUpdateIndex } from "./index.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// =======================
// Admin Panel
// =======================
export async function sendAdminPanel(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "📌 Send / Update Index", callback_data: "admin_send_index" }],
      [
        { text: "Manage Titles", callback_data: "admin_titles" },
        { text: "Manage Seasons", callback_data: "admin_seasons" }
      ],
      [
        { text: "Manage Users", callback_data: "admin_users" },
        { text: "Broadcast", callback_data: "admin_broadcast" }
      ]
    ]
  };

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id,
      text: "🛠️ <b>BountyFlix Admin Panel</b>",
      parse_mode: "HTML",
      reply_markup: keyboard
    })
  });

  await sendLog(`🛠️ Admin panel opened by ${chatId}`);
}

// =======================
// Handle admin callbacks
// =======================
export async function handleAdminCallback(data: string) {
  if (data === "admin_send_index") {
    await sendOrUpdateIndex();
    await sendLog("📌 Index message sent/updated");
  }
}

// =======================
// Set download link confirmation
// =======================
export async function setDownloadUrlPrompt(
  chatId: number,
  title: string,
  season: string,
  url: string
) {
  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ Confirm", callback_data: `confirm_download:${title}:${season}:${url}` },
        { text: "❌ Cancel", callback_data: "cancel_download" }
      ]
    ]
  };

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id,
      text: `⚠️ Confirm download link\n\nTitle: <b>${title}</b>\nSeason: <b>${season}</b>\nLink: ${url}`,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard
    })
  });

  await sendLog(`🛠️ Prompted admin to set download link for ${title} - ${season}`);
}