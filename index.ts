  //  index.ts

import { getAllTitles } from "./adminTitles.ts";

/**
 * Builds the A–Z index text
 * This file ONLY formats data.
 * No chat_id, no Telegram calls, no side-effects.
 */

export async function buildIndexText(): Promise<string> {
  const allTitles = await getAllTitles();

  const letters = Object.keys(allTitles).sort();
  let text = "🎬 *BountyFlix Index*\n\n";

  for (const letter of letters) {
    const titles = allTitles[letter];

    if (!titles || titles.length === 0) continue;

    text += `*${letter}*\n`;
    for (const title of titles) {
      text += `• ${title}\n`;
    }
    text += "\n";
  }

  if (letters.length === 0) {
    text += "_No titles added yet._";
  }

  return text;
}