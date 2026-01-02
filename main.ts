  //main.ts

import { BOT_TOKEN } from "./config.ts";
import { handleCallback } from "./callbacks.ts";
import { sendAdminPanel, setDownloadUrlPrompt } from "./adminPanel.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";
import { ADMIN_IDS } from "./config.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK");
  }

  const update = await req.json();

  // Handle messages
  if (update.message) {
    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text;

    if (!ADMIN_IDS.has(userId)) {
      return new Response("OK");
    }

    if (text?.startsWith("/adminpanel")) {
      await sendAdminPanel(chatId);
    }

    if (text?.startsWith("/adduser")) {
      const id = Number(text.split(" ")[1]);
      await handleNewUser(id);
    }

    if (text?.startsWith("/broadcast")) {
      const msg = text.replace("/broadcast", "").trim();
      await broadcastMessage(msg);
    }

    if (text?.startsWith("/announceanime")) {
      const [title, season, link] = text
        .replace("/announceanime", "")
        .split("|")
        .map((s: string) => s.trim());

      await sendAnimeAnnouncement(title, season, link);
    }

    if (text?.startsWith("/setdownload")) {
      const [title, season, link] = text
        .replace("/setdownload", "")
        .split("|")
        .map((s: string) => s.trim());

      await setDownloadUrlPrompt(chatId, title, season, link);
    }
  }

  // Handle inline buttons
  if (update.callback_query) {
    await handleCallback(update.callback_query);
  }

  return new Response("OK");
});