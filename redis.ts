// src/redis.ts
import { Redis } from "https://deno.land/x/upstash_redis@v1.20.0/mod.ts";
import { REDIS_URL, REDIS_TOKEN } from "./config.ts";

// Connect to Upstash Redis
export const redis = new Redis({
  url: REDIS_URL,
  token: REDIS_TOKEN,
});

// =======================
// User Management
// =======================

// Add user to Redis set
export async function addUser(userId: number) {
  await redis.sadd("users", userId.toString());
}

// Get all users
export async function getUsers(): Promise<string[]> {
  return (await redis.smembers("users")) || [];
}

// =======================
// Titles / Seasons
// =======================

// Save a title under a letter
export async function saveTitle(letter: string, title: string) {
  await redis.sadd(`letters:${letter}`, title);
}

// Get all titles under a letter
export async function getTitles(letter: string): Promise<string[]> {
  return (await redis.smembers(`letters:${letter}`)) || [];
}

// Save a season under a title
export async function saveSeason(title: string, season: string) {
  await redis.sadd(`title:${title}`, season);
}

// Get all seasons for a title
export async function getSeasons(title: string): Promise<string[]> {
  return (await redis.smembers(`title:${title}`)) || [];
}

// =======================
// Download Links
// =======================

// Set download link for a title+season
export async function setDownloadLink(title: string, season: string, url: string) {
  await redis.set(`season:${title}:${season}`, url);
}

// Get download link for a title+season
export async function getDownloadLink(title: string, season: string): Promise<string | null> {
  return await redis.get(`season:${title}:${season}`);
}