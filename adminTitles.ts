  // adminTitles

import { BOT_TOKEN } from "./config.ts";
import { addTitle } from "./titles.ts";
import { sendOrUpdateIndex } from "./index.ts";
import { sendLog, LogType } from "./logging.ts";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ========================
// TEMP STATE
// ========================
// adminId -> selected letter
const pendingTitleLetter: Record<number, string> = {};

// ========================
// SHOW LETTER PICKER
// ========================
export async function showLetterPicker(chatId: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const rows = [];

  for (let i = 0; i < letters.length; i += 6) {
    rows.push(
      letters.slice(i, i + 6).map((l) => ({
        text: l,
        callback_data: `add_title_letter:${l}`,
      }))
    );
  }

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🔤 Select starting letter",
      reply_markup: { inline_keyboard: rows },
    }),
  });
}

// ========================
// HANDLE LETTER CLICK
// ========================
export async function handleAddTitleLetter(
  chatId: number,
  adminId: number,
  letter: string
) {
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
}

// ========================
// HANDLE TITLE TEXT
// ========================
export async function handleTitleText(
  chatId: number,
  adminId: number,
  text: string
): Promise<boolean> {
  const letter = pendingTitleLetter[adminId];
  if (!letter) return false;

  delete pendingTitleLetter[adminId];

  await addTitle(letter, text);
  await sendOrUpdateIndex();

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `✅ Saved\n<b>${text}</b> under <b>${letter}</b>`,
      parse_mode: "HTML",
    }),
  });

  await sendLog(LogType.ADMIN, `🎬 Title added: ${text} (${letter})`);
  return true;
}