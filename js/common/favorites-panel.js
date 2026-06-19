//favorites-panel.js

function navigateToFavoritePlace(placeId) {
  if (!placeId) {
    return;
  }

  window.location.href =
    `chat.html?placeId=${encodeURIComponent(placeId)}`;
}

function navigateToFavoriteCharacter(eno) {
  if (!eno) {
    return;
  }

  window.location.href =
    `profile.html?eno=${encodeURIComponent(eno)}`;
}

function getFavoritePlaceLabel(place = {}) {
  return typeof place?.name === "string" && place.name.trim() !== ""
    ? place.name.trim()
    : String(place?.placeId ?? "");
}

function getFavoriteCharacterName(character = {}) {
  return typeof character?.name === "string" && character.name.trim() !== ""
    ? character.name.trim()
    : "不明なキャラ";
}

function getFavoriteCharacterEno(character = {}) {
  const eno =
    typeof character?.eno === "number"
      ? character.eno
      : Number(character?.eno || 0);

  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

function getFavoriteCharacterIconUrl(character = {}) {
  return typeof character?.iconUrl === "string" && character.iconUrl.trim() !== ""
    ? character.iconUrl.trim()
    : "https://placehold.co/60x60?text=NO+IMG";
}

function createFavoritePlaceButton(place, options = {}) {
  const {
    onMoveToPlace = null
  } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelItemButton button-link";
  button.textContent = getFavoritePlaceLabel(place);

  const moveHandler =
    typeof onMoveToPlace === "function"
      ? onMoveToPlace
      : navigateToFavoritePlace;

  if (place?.placeId) {
    button.addEventListener("click", () => {
      moveHandler(place.placeId);
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

  const eno = getFavoriteCharacterEno(character);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelCharacterMainButton button-plain";

  const icon = document.createElement("img");
  icon.className = "favoritesPanelCharacterIcon";
  icon.src = getFavoriteCharacterIconUrl(character);
  icon.alt = getFavoriteCharacterName(character);

  const label = document.createElement("span");
  label.className = "favoritesPanelCharacterLabel";
  label.textContent = eno
    ? `Eno.${eno} ${getFavoriteCharacterName(character)}`
    : getFavoriteCharacterName(character);

  button.appendChild(icon);
  button.appendChild(label);

  const openHandler =
    typeof onOpenCharacter === "function"
      ? onOpenCharacter
      : navigateToFavoriteCharacter;

  if (eno) {
    button.addEventListener("click", () => {
      openHandler(eno);
    });
  } else {
    button.disabled = true;
  }

  return button;
}

function createFavoriteCharacterActionButton(character, options = {}) {
  const {
    label,
    title,
    onClick
  } = options;

  const eno = getFavoriteCharacterEno(character);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelCharacterActionButton button-icon";
  button.textContent = label;
  button.title = title;
  button.setAttribute("aria-label", title);

  if (eno && typeof onClick === "function") {
    button.addEventListener("click", () => {
      onClick(character);
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
    onReplyToCharacter = null,
    onMessageToCharacter = null,
    showCharacterReplyAction = false,
    showCharacterMessageAction = false,
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
    item.className = "favoritesPanelItem favoritesPanelCharacterItem";

    item.appendChild(
      createFavoriteCharacterButton(character, {
        onOpenCharacter
      })
    );

    if (showCharacterReplyAction || showCharacterMessageAction) {
      const actionGroup = document.createElement("div");
      actionGroup.className = "favoritesPanelCharacterActions";

      if (showCharacterReplyAction) {
        actionGroup.appendChild(
          createFavoriteCharacterActionButton(character, {
            label: "💬",
            title: "返信先に追加",
            onClick: onReplyToCharacter
          })
        );
      }

      if (showCharacterMessageAction) {
        actionGroup.appendChild(
          createFavoriteCharacterActionButton(character, {
            label: "✉",
            title: "MESSAGE送信先に設定",
            onClick: onMessageToCharacter
          })
        );
      }

      item.appendChild(actionGroup);
    }
    
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
    onReplyToCharacter = null,
    onMessageToCharacter = null,
    showCharacterReplyAction = false,
    showCharacterMessageAction = false,
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
      onReplyToCharacter,
      onMessageToCharacter,
      showCharacterReplyAction,
      showCharacterMessageAction,
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
