//chat-favorites-panel.js

function createFavoritePlaceButton(place, options = {}) {
  const {
    onMoveToPlace = null
  } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "chatFavoritesPanelPlaceButton";
  button.textContent =
    typeof place?.name === "string" && place.name.trim() !== ""
      ? place.name.trim()
      : String(place?.placeId ?? "");

  if (typeof onMoveToPlace === "function" && place?.placeId) {
    button.addEventListener("click", () => {
      onMoveToPlace(place.placeId);
    });
  } else {
    button.disabled = true;
  }

  return button;
}

export function renderFavoritePlacesPanel(container, options = {}) {
  const {
    favoritePlaces = [],
    onMoveToPlace = null
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "chatFavoritesPanelSection";

  const heading = document.createElement("h2");
  heading.className = "chatFavoritesPanelHeading";
  heading.textContent = "お気に入り場所一覧";

  const content = document.createElement("div");
  content.className = "chatFavoritesPanelContent";

  if (!Array.isArray(favoritePlaces) || favoritePlaces.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "chatFavoritesPanelEmptyText";
    emptyText.textContent =
      "チャットページ上部の☆を押すことでお気に入り登録することができます";

    content.appendChild(emptyText);
  } else {
    favoritePlaces.forEach((place, index) => {
      const item = document.createElement("div");
      item.className = "chatFavoritesPanelItem";

      item.appendChild(
        createFavoritePlaceButton(place, {
          onMoveToPlace
        })
      );

      content.appendChild(item);

      if (index < favoritePlaces.length - 1) {
        const divider = document.createElement("div");
        divider.className = "chatFavoritesPanelDivider";
        content.appendChild(divider);
      }
    });
  }

  section.appendChild(heading);
  section.appendChild(content);
  container.appendChild(section);

  return {
    section,
    heading,
    content
  };
}
