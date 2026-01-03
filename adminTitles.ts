  // adminTitles.ts

import { redis } from "./redis.ts";

/**
 * Redis structure used:
 *
 * titles:index                → Set of letters (A–Z)
 * titles:{LETTER}             → Set of title names
 * seasons:{TITLE}             → Set of seasons
 */

// ==============================
// ADD TITLE
// ==============================
export async function addTitle(letter: string, title: string) {
  const cleanLetter = letter.toUpperCase();
  const cleanTitle = title.trim();

  if (!cleanTitle) return;

  // Save letter
  await redis.sadd("titles:index", cleanLetter);

  // Save title under letter
  await redis.sadd(`titles:${cleanLetter}`, cleanTitle);
}

// ==============================
// ADD SEASON
// ==============================
export async function addSeason(title: string, season: string) {
  const cleanTitle = title.trim();
  const cleanSeason = season.trim();

  if (!cleanSeason) return;

  await redis.sadd(`seasons:${cleanTitle}`, cleanSeason);
}

// ==============================
// GET ALL TITLES (A–Z)
// ==============================
export async function getAllTitles(): Promise<Record<string, string[]>> {
  const letters = await redis.smembers("titles:index");
  const result: Record<string, string[]> = {};

  for (const letter of letters) {
    const titles = await redis.smembers(`titles:${letter}`);
    result[letter] = titles.sort();
  }

  return result;
}

// ==============================
// GET SEASONS FOR A TITLE
// ==============================
export async function getSeasons(title: string): Promise<string[]> {
  return await redis.smembers(`seasons:${title}`);
}