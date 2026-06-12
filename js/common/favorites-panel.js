//favorites-panel.js

function getFavoritePlaceLabel(place = {}) {
  return typeof place?.name === "string" && place.name.trim() !== ""
    ? place.name.trim()
    : String(place?.placeId ?? "");
}

function getFavoriteCharacterLabel(character = {}) {
  const name =
    typeof character?.name === "string"
      ? character.name.trim()
      : "";

  const eno =
    typeof character?.eno === "number" && character.eno > 0
      ? character.eno
      : null;

  if (name && eno) {
    return `${name}(Eno.${eno})`;
  }

  if (name) {
    return name;
  }

  if (eno) {
    return `Eno.${eno}`;
  }

  return "不明なキャラ";
}

function createFavoritePlaceButton(place, options = {}) {
  const {
    onMoveToPlace = null
  } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelItemButton button-link";
  button.textContent = getFavoritePlaceLabel(place);

  if (typeof onMoveToPlace === "function" && place?.placeId) {
    button.addEventListener("click", () => {
      onMoveToPlace(place.placeId);
    });
  } else {
    button.disabled = true;
  }

  return button;
}

function createFavoriteCharacterButton(character, options = {}) {
  const {
    onOpenCharacter = null
  } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelItemButton button-link";
  button.textContent = getFavoriteCharacterLabel(character);

  if (typeof onOpenCharacter === "function" && character?.eno) {
    button.addEventListener("click", () => {
      onOpenCharacter(character.eno);
    });
  } else {
    button.disabled = true;
  }

  return button;
}

function appendDividerIfNeeded(container, index, listLength) {
  if (index >= listLength - 1) {
    return;
  }

  const divider = document.createElement("div");
  divider.className = "favoritesPanelDivider";
  container.appendChild(divider);
}

function renderFavoritePlacesContent(container, options = {}) {
  const {
    favoritePlaces = [],
    onMoveToPlace = null,
    emptyPlaceText = "チャットページ上部の☆を押すことでお気に入り登録することができます"
  } = options;

  container.innerHTML = "";

  if (!Array.isArray(favoritePlaces) || favoritePlaces.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "favoritesPanelEmptyText";
    emptyText.textContent = emptyPlaceText;

    container.appendChild(emptyText);
    return;
  }

  favoritePlaces.forEach((place, index) => {
    const item = document.createElement("div");
    item.className = "favoritesPanelItem";

    item.appendChild(
      createFavoritePlaceButton(place, {
        onMoveToPlace
      })
    );

    container.appendChild(item);
    appendDividerIfNeeded(container, index, favoritePlaces.length);
  });
}

function renderFavoriteCharactersContent(container, options = {}) {
  const {
    favoriteCharacters = [],
    onOpenCharacter = null,
    emptyCharacterText = "お気に入りキャラはまだありません"
  } = options;

  container.innerHTML = "";

  if (!Array.isArray(favoriteCharacters) || favoriteCharacters.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "favoritesPanelEmptyText";
    emptyText.textContent = emptyCharacterText;

    container.appendChild(emptyText);
    return;
  }

  favoriteCharacters.forEach((character, index) => {
    const item = document.createElement("div");
    item.className = "favoritesPanelItem";

    item.appendChild(
      createFavoriteCharacterButton(character, {
        onOpenCharacter
      })
    );

    container.appendChild(item);
    appendDividerIfNeeded(container, index, favoriteCharacters.length);
  });
}

function normalizeFavoritesTab(value) {
  return value === "character" ? "character" : "place";
}

export function renderFavoritesPanel(container, options = {}) {
  const {
    defaultTab = "place",
    favoritePlaces = [],
    favoriteCharacters = [],
    onMoveToPlace = null,
    onOpenCharacter = null,
    emptyPlaceText,
    emptyCharacterText
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "favoritesPanelSection";

  const heading = document.createElement("h2");
  heading.className = "favoritesPanelHeading";
  heading.textContent = "お気に入り";

  const tabRow = document.createElement("div");
  tabRow.className = "favoritesPanelTabRow";

  const placeTabButton = document.createElement("button");
  placeTabButton.type = "button";
  placeTabButton.className = "favoritesPanelTabButton button-box";
  placeTabButton.textContent = "場所";

  const characterTabButton = document.createElement("button");
  characterTabButton.type = "button";
  characterTabButton.className = "favoritesPanelTabButton button-box";
  characterTabButton.textContent = "キャラ";

  const content = document.createElement("div");
  content.className = "favoritesPanelContent";

  let currentTab = normalizeFavoritesTab(defaultTab);

  function refreshContent() {
    placeTabButton.classList.toggle("is-active", currentTab === "place");
    characterTabButton.classList.toggle("is-active", currentTab === "character");

    if (currentTab === "place") {
      renderFavoritePlacesContent(content, {
        favoritePlaces,
        onMoveToPlace,
        emptyPlaceText
      });
      return;
    }

    renderFavoriteCharactersContent(content, {
      favoriteCharacters,
      onOpenCharacter,
      emptyCharacterText
    });
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

export function renderFavoritesSidePanel(container, options = {}) {
  if (!container) {
    return null;
  }

  container.innerHTML = "";

  return renderFavoritesPanel(container, options);
}
