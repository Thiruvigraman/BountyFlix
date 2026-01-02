import { BOT_TOKEN, ADMIN_IDS } from "./config.ts";
import { handleNewUser, broadcastMessage } from "./users.ts";
import { sendAnimeAnnouncement } from "./announcements.ts";
import { sendLog } from "./logging.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Poll updates
while (true) {
  try {
    const updatesRes = await fetch(`${API}/getUpdates?timeout=30`);
    const data = await updatesRes.json();
    const updates = data.result || [];

    for (const update of updates) {
      if (update.message) {
        const chatId = update.message.chat.id;
        const userId = update.message.from.id;
        const text = update.message.text;

        // Only admins can use commands
        if (!ADMIN_IDS.has(userId)) continue;

        if (text?.startsWith("/adduser")) {
          const parts = text.split(" ");
          const newUserId = Number(parts[1]);
          await handleNewUser(newUserId);
        }

        if (text?.startsWith("/broadcast")) {
          const message = text.replace("/broadcast", "").trim();
          await broadcastMessage(message);
        }

        if (text?.startsWith("/announceanime")) {
          const parts = text.replace("/announceanime", "").trim().split("|");
          const title = parts[0].trim();
          const season = parts[1].trim();
          const link = parts[2].trim();
          await sendAnimeAnnouncement(title, season, link);
        }
      }
    }
  } catch (err) {
    console.error(err);
    await new Promise(r => setTimeout(r, 5000));
  }
}