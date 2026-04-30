//chat-place-utils.js

import { places } from "../data/places-data.js";
import { loadFavoritePlaceIds } from "./chat-place-favorites.js";

export function getPlaceById(placeId) {
  return places.find(place => place.placeId === placeId) || null;
}

export function getPlaceLabel(placeId) {
  const place = getPlaceById(placeId);
  return place?.name || placeId;
}

export function getFavoritePlaces() {
  const favoritePlaceIds = loadFavoritePlaceIds();

  return favoritePlaceIds
    .map(placeId => getPlaceById(placeId))
    .filter(place => place !== null);
}
