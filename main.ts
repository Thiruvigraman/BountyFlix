import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

/* ================= ENV ================= */

const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!;
const REDIS_TOKEN = Deno.env.get("REDIS_TOKEN")!;
const ADMIN_IDS = (Deno.env.get("ADMIN_IDS") || "")
  .split(",")
  .map((id) => id.trim());

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/* ================= REDIS ================= */

async function redis(cmd: string[]) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cmd)
  });
  return await res.json();
}

/* ================= TELEGRAM ================= */

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

/* ================= LOGIC ================= */

async function onMessage(msg: any) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text || "";

  // Save user
  await redis(["SADD", "users", userId.toString()]);

  // /start
  if (text === "/start") {
    await sendMessage(chatId, "🎬 Welcome to BountyFlix!");
    return;
  }

  // /stats (admins only)
  if (text === "/stats") {
    if (!ADMIN_IDS.includes(userId.toString())) {
      await sendMessage(chatId, "❌ Admin only command");
      return;
    }

    const users = await redis(["SCARD", "users"]);
    await sendMessage(
      chatId,
      `📊 Bot Stats\n\n👥 Total Users: ${users.result}`
    );
    return;
  }
}

/* ================= HTTP HANDLER ================= */

serve(async (req) => {
  const url = new URL(req.url);

  // Health check
  if (url.pathname === "/") {
    return new Response("BountyFlix bot running ✅");
  }

  // Telegram webhook
  if (url.pathname === "/webhook" && req.method === "POST") {
    const update = await req.json();

    if (update.message) {
      await onMessage(update.message);
    }

    return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});