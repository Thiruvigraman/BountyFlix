  // adminTitles.ts

import { redis } from "./redis.ts";
import { sendMessage } from "./callbacks.ts";

/**
 * Temporary admin state stored in Redis
 * key format: admin:state:<chatId>
 */

type AdminState =
  | { step: "idle" }
  | { step: "await_title_name" }
  | { step: "await_season_number"; title: string };

function stateKey(chatId: number) {
  return `admin:state:${chatId}`;
}

/* ===============================
   EXPORTS USED BY main.ts
   =============================== */

/**
 * Save a new title (movie / series)
 */
export async function saveTitle(title: string) {
  const key = `titles:${title[0].toUpperCase()}`;
  await redis.sadd(key, title);
}

/**
 * Save a season under a title
 */
export async function saveSeason(title: string, season: string) {
  const key = `seasons:${title}`;
  await redis.sadd(key, season);
}

/**
 * Send admin panel menu
 */
export async function sendAdminPanel(chatId: number) {
  await redis.set(stateKey(chatId), JSON.stringify({ step: "idle" }));

  await sendMessage(chatId, "🛠 Admin Panel\n\n1️⃣ Add Title\n2️⃣ Add Season");
}

/* ===============================
   ADMIN MESSAGE HANDLER
   =============================== */

export async function handleAdminMessage(
  chatId: number,
  text: string,
) {
  const raw = await redis.get(stateKey(chatId));
  const state: AdminState = raw
    ? JSON.parse(raw)
    : { step: "idle" };

  // MENU ACTIONS
  if (state.step === "idle") {
    if (text === "1") {
      await redis.set(
        stateKey(chatId),
        JSON.stringify({ step: "await_title_name" }),
      );
      await sendMessage(chatId, "✍️ Send title name:");
      return;
    }

    if (text === "2") {
      await sendMessage(
        chatId,
        "⚠️ Add a title first before adding seasons.",
      );
      return;
    }
  }

  // ADD TITLE
  if (state.step === "await_title_name") {
    await saveTitle(text);

    await redis.set(
      stateKey(chatId),
      JSON.stringify({
        step: "await_season_number",
        title: text,
      }),
    );

    await sendMessage(
      chatId,
      `✅ Title saved: ${text}\n\n📺 Send season number (e.g. Season 1)`,
    );
    return;
  }

  // ADD SEASON
  if (state.step === "await_season_number") {
    await saveSeason(state.title, text);

    await redis.set(stateKey(chatId), JSON.stringify({ step: "idle" }));

    await sendMessage(
      chatId,
      `✅ ${text} added to ${state.title}`,
    );
    return;
  }
}