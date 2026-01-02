   // main.ts

import { BOT_TOKEN, ADMIN_IDS } from "./config.ts";
import { handleCallback } from "./callbacks.ts";
import { sendAdminPanel, setDownloadUrlPrompt } from "./adminPanel.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";
import { saveSeason } from "./titles.ts";
import { sendOrUpdateIndex, pinMessage } from "./indexMessage.ts";
import { sendLog, LogType } from "./logging.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Pending season input per admin
const pendingSeasonTitle: Record<number, string> = {};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  const update = await req.json();

  // ----------------------
  // Handle Messages
  // ----------------------
  if (update.message) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text;

    if (!ADMIN_IDS.has(userId)) return new Response("OK");

    // Step 4: Admin replying with a season name
    if (text && pendingSeasonTitle[userId]) {
      const title = pendingSeasonTitle[userId];
      delete pendingSeasonTitle[userId];

      await saveSeason(title, text);

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Season saved\n\n<b>${text}</b>\nfor <b>${title}</b>`,
          parse_mode: "HTML",
        }),
      });

      await sendLog(LogType.ADMIN, `🎞️ Season added: ${title} → ${text}`);
      return new Response("OK");
    }

    // Admin Commands
    if (text?.startsWith("/adminpanel")) await sendAdminPanel(chatId);
    if (text?.startsWith("/adduser")) {
      const id = Number(text.split(" ")[1]);
      await handleNewUser(id);
    }
    if (text?.startsWith("/broadcast")) {
      const msg = text.replace("/broadcast", "").trim();
      await broadcastMessage(msg);
    }
    if (text?.startsWith("/announceanime")) {
      const [title, season, link] = text.replace("/announceanime", "").split("|").map(s => s.trim());
      await sendAnimeAnnouncement(title, season, link);
    }
    if (text?.startsWith("/setdownload")) {
      const [title, season, link] = text.replace("/setdownload", "").split("|").map(s => s.trim());
      await setDownloadUrlPrompt(chatId, title, season, link);
    }

    // Step 7: Refresh / Auto-Pin Index
    if (text?.startsWith("/refreshindex")) {
      const msgId = await sendOrUpdateIndex();
      await pinMessage(msgId);
      await sendLog(LogType.BOT, "📌 Index refreshed");
    }
  }

  // ----------------------
  // Handle Inline Callbacks
  // ----------------------
  if (update.callback_query) {
    const callback = update.callback_query;
    const adminId = callback.from.id;
    const chatId = callback.message.chat.id;

    // Step 4: Admin clicked "Add Season"
    if (callback.data.startsWith("add_season:")) {
      const title = callback.data.split(":")[1];
      pendingSeasonTitle[adminId] = title;

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: `✏️ Send season / arc name for <b>${title}</b>`,
          parse_mode: "HTML",
        }),
      });
      return new Response("OK");
    }

    // Delegate all other callbacks
    await handleCallback(callback);
  }

  return new Response("OK");
});