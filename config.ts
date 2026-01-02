  //config.ts

export const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
export const ADMIN_IDS = new Set(
  Deno.env.get("ADMIN_IDS")!.split(",").map(Number)
);
export const REDIS_URL = Deno.env.get("REDIS_URL")!;
export const REDIS_TOKEN = Deno.env.get("REDIS_TOKEN")!;
export const LOG_CHANNEL_ID = Deno.env.get("LOG_CHANNEL_ID")!;
export const ANNOUNCE_CHANNEL_ID = Deno.env.get("ANNOUNCE_CHANNEL_ID")!;
export const INDEX_CHANNEL_ID = Deno.env.get("INDEX_CHANNEL_ID")!; // SeriesWalker channel