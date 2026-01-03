  // adminpanel.ts

import { BOT_TOKEN } from "./config.ts";
import { sendLog } from "./logging.ts";

/**
 * Sends the main admin panel
 */
export async function sendAdminPanel(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "📚 Manage Titles", callback_data: "admin_titles" },
        { text: "🎞 Manage Seasons", callback_data: "admin_seasons" }
      ],
      [
        { text: "👥 Manage Users", callback_data: "admin_users" },
        { text: "📢 Broadcast", callback_data: "admin_broadcast" }
      ],
      [
        { text: "📊 Stats", callback_data: "admin_stats" }
      ]
    ]
  };

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId, // ✅ FIXED (was chat_id undefined before)
      text: "🛠️ <b>BountyFlix Admin Panel</b>",
      parse_mode: "HTML",
      reply_markup: keyboard
    })
  });

  await sendLog(`🛠️ Admin panel opened by ${chatId}`);
}

/**
 * Ask admin to confirm a download URL before saving
 */
export async function setDownloadUrlPrompt(
  chatId: number,
  title: string,
  season: string,
  url: string
) {
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "✅ Confirm",
          callback_data: `confirm_download:${title}:${season}:${url}`
        },
        {
          text: "❌ Cancel",
          callback_data: "cancel_download"
        }
      ]
    ]
  };

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId, // ✅ FIXED
      text:
        "⚠️ <b>Confirm Download Link</b>\n\n" +
        `<b>Title:</b> ${title}\n` +
        `<b>Season:</b> ${season}\n` +
        `<b>Link:</b> ${url}`,
      parse_mode: "HTML",
      reply_markup: inlineKeyboard
    })
  });

  await sendLog(`⏳ Download confirmation requested for ${title} ${season}`);
}