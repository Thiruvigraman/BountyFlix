  //logging.ts


import { BOT_TOKEN, LOG_CHANNEL_ID } from "./config.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export enum LogType {
  BOT = "🤖 Bot Status",
  ADMIN = "🛠️ Admin Action",
  FILE = "📂 File Access",
}

export async function sendLog(type: LogType, message: string) {
  const text = `<b>${type}</b>\n${message}`;

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: LOG_CHANNEL_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}