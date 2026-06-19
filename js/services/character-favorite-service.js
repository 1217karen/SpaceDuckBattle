// character-favorite-service.js

import { getNoImageUrl } from "../common/icon-picker.js";
import { loadCharacter } from "./storage-service.js";

const CHARACTER_FAVORITES_STORAGE_KEY = "chatCharacterFavorites";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeEno(eno) {
  const normalized =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  return Number.isInteger(normalized) && normalized > 0
    ? normalized
    : 0;
}

function normalizeFavoriteCharacterEnos(value, options = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  const currentEno = normalizeEno(options.currentEno);
  const seen = new Set();
  const result = [];

  value.forEach(item => {
    const eno = normalizeEno(item);

    if (!eno || eno === currentEno || seen.has(eno)) {
      return;
    }

    seen.add(eno);
    result.push(eno);
  });

  return result;
}

function getCharacterName(character = {}, eno = 0) {
  const fullName =
    typeof character?.fullName === "string"
      ? character.fullName.trim()
      : "";

  const defaultName =
    typeof character?.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  if (fullName) {
    return fullName;
  }

  if (defaultName) {
    return defaultName;
  }

  return eno ? `Eno.${eno}` : "不明なキャラ";
}

function getCharacterDefaultIcon(character = {}) {
  return typeof character?.defaultIcon === "string" && character.defaultIcon.trim() !== ""
    ? character.defaultIcon.trim()
    : getNoImageUrl();
}

export function loadFavoriteCharacterEnos(options = {}) {
  const parsed = safeParse(
    localStorage.getItem(CHARACTER_FAVORITES_STORAGE_KEY),
    []
  );

  return normalizeFavoriteCharacterEnos(parsed, options);
}

export function saveFavoriteCharacterEnos(enos = [], options = {}) {
  const normalized = normalizeFavoriteCharacterEnos(enos, options);

  localStorage.setItem(
    CHARACTER_FAVORITES_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  return normalized;
}

export function isFavoriteCharacter(eno, options = {}) {
  const targetEno = normalizeEno(eno);
  const currentEno = normalizeEno(options.currentEno);

  if (!targetEno || targetEno === currentEno) {
    return false;
  }

  return loadFavoriteCharacterEnos(options).includes(targetEno);
}

export function toggleFavoriteCharacter(eno, options = {}) {
  const targetEno = normalizeEno(eno);
  const currentEno = normalizeEno(options.currentEno);
  const favoriteCharacterEnos = loadFavoriteCharacterEnos(options);

  if (!targetEno || targetEno === currentEno) {
    return {
      isFavorite: false,
      favoriteCharacterEnos
    };
  }

  const exists = favoriteCharacterEnos.includes(targetEno);
  const nextFavoriteCharacterEnos = exists
    ? favoriteCharacterEnos.filter(item => item !== targetEno)
    : [...favoriteCharacterEnos, targetEno];

  saveFavoriteCharacterEnos(nextFavoriteCharacterEnos, options);

  return {
    isFavorite: !exists,
    favoriteCharacterEnos: nextFavoriteCharacterEnos
  };
}

export function getFavoriteCharacters(options = {}) {
  return loadFavoriteCharacterEnos(options)
    .map(eno => {
      const character = loadCharacter(eno) || {};

      return {
        ...character,
        eno,
        name: getCharacterName(character, eno),
        iconUrl: getCharacterDefaultIcon(character)
      };
    });
}
