//chat-place-favorites.js

const PLACE_FAVORITES_STORAGE_KEY = "chatPlaceFavorites";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeFavoritePlaceIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => typeof item === "string" && item.trim() !== "")
    .map(item => item.trim());
}

export function loadFavoritePlaceIds() {
  const parsed = safeParse(
    localStorage.getItem(PLACE_FAVORITES_STORAGE_KEY),
    []
  );

  return normalizeFavoritePlaceIds(parsed);
}

export function saveFavoritePlaceIds(placeIds = []) {
  const normalized = normalizeFavoritePlaceIds(placeIds);

  localStorage.setItem(
    PLACE_FAVORITES_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  return normalized;
}

export function isFavoritePlace(placeId) {
  if (typeof placeId !== "string" || placeId.trim() === "") {
    return false;
  }

  return loadFavoritePlaceIds().includes(placeId);
}

export function toggleFavoritePlace(placeId) {
  if (typeof placeId !== "string" || placeId.trim() === "") {
    return {
      isFavorite: false,
      favoritePlaceIds: loadFavoritePlaceIds()
    };
  }

  const normalizedPlaceId = placeId.trim();
  const favoritePlaceIds = loadFavoritePlaceIds();
  const exists = favoritePlaceIds.includes(normalizedPlaceId);

  const nextFavoritePlaceIds = exists
    ? favoritePlaceIds.filter(item => item !== normalizedPlaceId)
    : [...favoritePlaceIds, normalizedPlaceId];

  saveFavoritePlaceIds(nextFavoritePlaceIds);

  return {
    isFavorite: !exists,
    favoritePlaceIds: nextFavoritePlaceIds
  };
}

export function getFavoritePlaceIds() {
  return loadFavoritePlaceIds();
}
