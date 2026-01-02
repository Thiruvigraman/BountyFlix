  // main.ts

import { BOT_TOKEN, ADMIN_IDS } from "./config.ts";
import { handleCallback } from "./callbacks.ts";
import { sendAdminPanel, setDownloadUrlPrompt } from "./adminPanel.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  const update = await req.json();

  // MESSAGE
  if (update.message) {
    const { id: chatId } = update.message.chat;
    const { id: userId } = update.message.from;
    const text = update.message.text || "";

    if (!ADMIN_IDS.has(userId)) return new Response("OK");

    if (text === "/adminpanel") await sendAdminPanel(chatId);
    if (text.startsWith("/adduser")) await handleNewUser(Number(text.split(" ")[1]));
    if (text.startsWith("/broadcast")) await broadcastMessage(text.replace("/broadcast", "").trim());

    if (text.startsWith("/announceanime")) {
      const [t, s, l] = text.replace("/announceanime", "").split("|").map(v => v.trim());
      await sendAnimeAnnouncement(t, s, l);
    }

    if (text.startsWith("/setdownload")) {
      const [t, s, l] = text.replace("/setdownload", "").split("|").map(v => v.trim());
      await setDownloadUrlPrompt(chatId, t, s, l);
    }
  }

  // CALLBACK
  if (update.callback_query) {
    await handleCallback(update.callback_query);
  }

  return new Response("OK");
});