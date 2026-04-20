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

function renderFavoritePlacesContent(container, options = {}) {
  const {
    favoritePlaces = [],
    onMoveToPlace = null
  } = options;

  container.innerHTML = "";

  if (!Array.isArray(favoritePlaces) || favoritePlaces.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "chatFavoritesPanelEmptyText";
    emptyText.textContent =
      "チャットページ上部の☆を押すことでお気に入り登録することができます";

    container.appendChild(emptyText);
    return;
  }

  favoritePlaces.forEach((place, index) => {
    const item = document.createElement("div");
    item.className = "chatFavoritesPanelItem";

    item.appendChild(
      createFavoritePlaceButton(place, {
        onMoveToPlace
      })
    );

    container.appendChild(item);

    if (index < favoritePlaces.length - 1) {
      const divider = document.createElement("div");
      divider.className = "chatFavoritesPanelDivider";
      container.appendChild(divider);
    }
  });
}

function renderFavoriteCharactersPlaceholder(container) {
  container.innerHTML = "";

  const text = document.createElement("p");
  text.className = "chatFavoritesPanelEmptyText";
  text.textContent = "ここにキャラが入る";

  container.appendChild(text);
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
  heading.textContent = "お気に入り";

  const tabRow = document.createElement("div");
  tabRow.className = "chatFavoritesPanelTabRow";

  const placeTabButton = document.createElement("button");
  placeTabButton.type = "button";
  placeTabButton.className = "chatFavoritesPanelTabButton is-active";
  placeTabButton.textContent = "場所";

  const characterTabButton = document.createElement("button");
  characterTabButton.type = "button";
  characterTabButton.className = "chatFavoritesPanelTabButton";
  characterTabButton.textContent = "キャラ";

  const content = document.createElement("div");
  content.className = "chatFavoritesPanelContent";

  let currentTab = "place";

  function refreshContent() {
    placeTabButton.classList.toggle("is-active", currentTab === "place");
    characterTabButton.classList.toggle("is-active", currentTab === "character");

    if (currentTab === "place") {
      renderFavoritePlacesContent(content, {
        favoritePlaces,
        onMoveToPlace
      });
      return;
    }

    renderFavoriteCharactersPlaceholder(content);
  }

  placeTabButton.addEventListener("click", () => {
    currentTab = "place";
    refreshContent();
  });

  characterTabButton.addEventListener("click", () => {
    currentTab = "character";
    refreshContent();
  });

  tabRow.appendChild(placeTabButton);
  tabRow.appendChild(characterTabButton);

  section.appendChild(heading);
  section.appendChild(tabRow);
  section.appendChild(content);
  container.appendChild(section);

  refreshContent();

  return {
    section,
    heading,
    tabRow,
    placeTabButton,
    characterTabButton,
    content
  };
}
