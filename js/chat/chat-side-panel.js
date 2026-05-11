//chat-side-panel.js

import { renderFavoritePlacesPanel } from "./chat-favorites-panel.js";

export function renderFavoritePlacesSidePanel(rightPanel, options = {}) {
  const {
    favoritePlaces = [],
    onMoveToPlace = null
  } = options;

  if (!rightPanel) {
    return null;
  }

  rightPanel.innerHTML = "";

  return renderFavoritePlacesPanel(rightPanel, {
    favoritePlaces,
    onMoveToPlace
  });
}
