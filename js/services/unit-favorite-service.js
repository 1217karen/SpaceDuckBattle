// unit-favorite-service.js

import {
  loadCharacter,
  loadUnit
} from "./storage-service.js";
import { makeAccountStorageKey } from "./account-storage-key.js";

const UNIT_FAVORITES_STORAGE_KEY = "unitFavorites";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizePositiveInteger(value) {
  const normalized =
    typeof value === "number"
      ? value
      : Number(value || 0);

  return Number.isInteger(normalized) && normalized > 0
    ? normalized
    : 0;
}

export function getFavoriteUnitKey(eno, unitNo = 1) {
  const normalizedEno = normalizePositiveInteger(eno);
  const normalizedUnitNo = normalizePositiveInteger(unitNo);

  if (!normalizedEno || !normalizedUnitNo) {
    return "";
  }

  return `${normalizedEno}:${normalizedUnitNo}`;
}

function normalizeFavoriteUnits(value, options = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  const currentEno = normalizePositiveInteger(options.currentEno);
  const seen = new Set();
  const result = [];

  value.forEach(item => {
    const eno = normalizePositiveInteger(item?.eno);
    const unitNo = normalizePositiveInteger(item?.unitNo);
    const key = getFavoriteUnitKey(eno, unitNo);

    if (!eno || !unitNo || eno === currentEno || !key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push({ eno, unitNo });
  });

  return result;
}

export function loadFavoriteUnits(options = {}) {
  const storageKey = makeAccountStorageKey(
    UNIT_FAVORITES_STORAGE_KEY,
    options.currentEno
  );

  if (!storageKey) {
    return [];
  }

  const parsed = safeParse(
    localStorage.getItem(storageKey),
    []
  );

  return normalizeFavoriteUnits(parsed, options);
}

export function saveFavoriteUnits(favorites = [], options = {}) {
  const normalized = normalizeFavoriteUnits(favorites, options);

  const storageKey = makeAccountStorageKey(
    UNIT_FAVORITES_STORAGE_KEY,
    options.currentEno
  );

  if (!storageKey) {
    return [];
  }
  localStorage.setItem(
    storageKey,
    JSON.stringify(normalized)
  );

  return normalized;
}

export function isFavoriteUnit(eno, unitNo = 1, options = {}) {
  const targetKey = getFavoriteUnitKey(eno, unitNo);
  const currentEno = normalizePositiveInteger(options.currentEno);
  const targetEno = normalizePositiveInteger(eno);

  if (!targetKey || !targetEno || targetEno === currentEno) {
    return false;
  }

  return loadFavoriteUnits(options)
    .some(item => getFavoriteUnitKey(item.eno, item.unitNo) === targetKey);
}

export function toggleFavoriteUnit(eno, unitNo = 1, options = {}) {
  const targetKey = getFavoriteUnitKey(eno, unitNo);
  const currentEno = normalizePositiveInteger(options.currentEno);
  const targetEno = normalizePositiveInteger(eno);
  const targetUnitNo = normalizePositiveInteger(unitNo);
  const favoriteUnits = loadFavoriteUnits(options);

  if (!targetKey || !targetEno || !targetUnitNo || targetEno === currentEno) {
    return {
      isFavorite: false,
      favoriteUnits
    };
  }

  const exists = favoriteUnits
    .some(item => getFavoriteUnitKey(item.eno, item.unitNo) === targetKey);

  const nextFavoriteUnits = exists
    ? favoriteUnits.filter(item => getFavoriteUnitKey(item.eno, item.unitNo) !== targetKey)
    : [...favoriteUnits, { eno: targetEno, unitNo: targetUnitNo }];

  saveFavoriteUnits(nextFavoriteUnits, options);

  return {
    isFavorite: !exists,
    favoriteUnits: nextFavoriteUnits
  };
}

export function getFavoriteUnitEntries(options = {}) {
  return loadFavoriteUnits(options)
    .map(item => {
      const characterData = loadCharacter(item.eno);
      const unitData = loadUnit(item.eno, item.unitNo);

      if (!characterData || !unitData) {
        return null;
      }

      const patterns = Array.isArray(unitData.patterns)
        ? unitData.patterns
        : [];

      const publicPatterns = patterns
        .map((pattern, index) => ({
          patternIndex: index,
          pattern
        }))
        .filter((entry) => entry.pattern?.public === true);

      if (publicPatterns.length === 0) {
        return null;
      }

      return {
        eno: item.eno,
        unitNo: item.unitNo,
        characterData,
        unitData,
        publicPatterns,
        isFavoriteUnit: true
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.eno !== b.eno) {
        return a.eno - b.eno;
      }

      return a.unitNo - b.unitNo;
    });
}
