  // titles.ts

import {
  saveTitle as rSaveTitle,
  saveSeason as rSaveSeason,
  getTitles as rGetTitles,
  getSeasons as rGetSeasons,
  setDownloadLink as rSetLink,
  getDownloadLink as rGetLink,
} from "./redis.ts";

export async function addTitle(letter: string, title: string) {
  await rSaveTitle(letter.toUpperCase(), title);
}

export async function addSeason(title: string, season: string) {
  await rSaveSeason(title, season);
}

export async function getTitles(letter: string) {
  return await rGetTitles(letter.toUpperCase());
}

export async function getSeasons(title: string) {
  return await rGetSeasons(title);
}

export async function setDownloadLink(title: string, season: string, url: string) {
  await rSetLink(title, season, url);
}

export async function getDownloadLink(title: string, season: string) {
  return await rGetLink(title, season);
}