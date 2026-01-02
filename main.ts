   // main.ts

import { BOT_TOKEN, ADMIN_IDS } from "./config.ts";
import { handleCallback } from "./callbacks.ts";
import { sendAdminPanel } from "./adminPanel.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";
import { saveTitle } from "./titles.ts";
import { sendLog } from "./logging.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Admin temporary state
 * adminId -> selected letter
 */
const pendingTitleLetter: Record<number, string> = {};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK");
  }

  const update = await req.json();

  /* ======================
     MESSAGE HANDLER
  ====================== */
  if (update.message) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text: string | undefined = update.message.text;

    // Admin-only
    if (!ADMIN_IDS.has(userId)) {
      return new Response("OK");
    }

    /* ===== STEP 3: Save title after letter selection ===== */
    if (text && pendingTitleLetter[userId]) {
      const letter = pendingTitleLetter[userId];
      delete pendingTitleLetter[userId];

      await saveTitle(letter, text);

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ Title saved\n\n<b>${text}</b> under letter <b>${letter}</b>`,
          parse_mode: "HTML",
        }),
      });

      await sendLog(`🎬 Title added: ${text} (${letter})`);
      return new Response("OK");
    }

    /* ===== Commands ===== */

    if (text === "/adminpanel") {
      await sendAdminPanel(chatId);
    }

    else if (text.startsWith("/adduser")) {
      const id = Number(text.split(" ")[1]);
      if (!isNaN(id)) {
        await handleNewUser(id);
      }
    }

    else if (text.startsWith("/broadcast")) {
      const msg = text.replace("/broadcast", "").trim();
      if (msg) {
        await broadcastMessage(msg);
      }
    }

    else if (text.startsWith("/announceanime")) {
      // /announceanime Title | Season | https://link
      const [title, season, link] = text
        .replace("/announceanime", "")
        .split("|")
        .map((s) => s.trim());

      if (title && season && link) {
        await sendAnimeAnnouncement(title, season, link);
      }
    }
  }

  /* ======================
     CALLBACK HANDLER
  ====================== */
  if (update.callback_query) {
    const data = update.callback_query.data;
    const adminId = update.callback_query.from.id;
    const chatId = update.callback_query.message.chat.id;

    // STEP 3: Letter selected
    if (data.startsWith("add_title_letter:")) {
      const letter = data.split(":")[1];
      pendingTitleLetter[adminId] = letter;

      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✏️ Send the title name starting with <b>${letter}</b>`,
          parse_mode: "HTML",
        }),
      });

      return new Response("OK");
    }

    await handleCallback(update.callback_query);
  }

  return new Response("OK");
});