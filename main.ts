  // main.ts

import { BOT_TOKEN, ADMIN_IDS } from "./config.ts";
import { handleCallback } from "./callbacks.ts";
import { sendAdminPanel, setDownloadUrlPrompt } from "./adminPanel.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";
import { addSeason } from "./titles.ts"; // ✅ FIXED
import { sendOrUpdateIndex } from "./index.ts";
import { sendLog } from "./logging.ts";
import { getUsers } from "./redis.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ========================
// TEMP STATE
// ========================
const pendingSeasonTitle: Record<number, string> = {};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  const update = await req.json();

  // ========================
  // MESSAGES
  // ========================
  if (update.message) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text ?? "";

    // ---------- HEALTH ----------
    if (text === "/health") {
      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Bot is running\n🚀 Environment OK"
        })
      });
      return new Response("OK");
    }

    // ---------- STATS ----------
    if (text === "/stats") {
      let users = 0;
      try {
        users = (await getUsers()).length;
      } catch {
        users = 0;
      }

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "📊 <b>BountyFlix Stats</b>\n\n" +
            `👥 Users: ${users}\n` +
            `⚙️ Status: Online`,
          parse_mode: "HTML"
        })
      });
      return new Response("OK");
    }

    // ---------- ADMIN ONLY ----------
    if (!ADMIN_IDS.has(userId)) return new Response("OK");

    // STEP 4 — Save season text
    if (pendingSeasonTitle[userId]) {
      const title = pendingSeasonTitle[userId];
      delete pendingSeasonTitle[userId];

      await addSeason(title, text); // ✅ FIXED
      await sendLog(`🎞 Season added: ${title} → ${text}`);

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Season <b>${text}</b> added to <b>${title}</b>`,
          parse_mode: "HTML"
        })
      });

      return new Response("OK");
    }

    // ---------- COMMANDS ----------
    if (text === "/adminpanel") {
      await sendAdminPanel(chatId);
    }

    if (text.startsWith("/adduser")) {
      const id = Number(text.split(" ")[1]);
      if (!isNaN(id)) await handleNewUser(id);
    }

    if (text.startsWith("/broadcast")) {
      const msg = text.replace("/broadcast", "").trim();
      if (msg) await broadcastMessage(msg);
    }

    if (text.startsWith("/announceanime")) {
      const [title, season, link] = text
        .replace("/announceanime", "")
        .split("|")
        .map((s) => s.trim());

      if (title && season && link) {
        await sendAnimeAnnouncement(title, season, link);
      }
    }

    if (text.startsWith("/setdownload")) {
      const [title, season, link] = text
        .replace("/setdownload", "")
        .split("|")
        .map((s) => s.trim());

      if (title && season && link) {
        await setDownloadUrlPrompt(chatId, title, season, link);
      }
    }

    if (text === "/refreshindex") {
      await sendOrUpdateIndex();
      await sendLog("📌 Index refreshed");
    }
  }

  // ========================
  // CALLBACKS
  // ========================
  if (update.callback_query) {
    const callback = update.callback_query;
    const adminId = callback.from.id;

    if (!ADMIN_IDS.has(adminId)) return new Response("OK");

    if (callback.data.startsWith("add_season:")) {
      const title = callback.data.split(":")[1];
      pendingSeasonTitle[adminId] = title;

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          text: `✏️ Send season name for <b>${title}</b>`,
          parse_mode: "HTML"
        })
      });

      return new Response("OK");
    }

    await handleCallback(callback);
  }

  return new Response("OK");
});