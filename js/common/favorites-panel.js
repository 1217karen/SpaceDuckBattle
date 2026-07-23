//favorites-panel.js

import { bindReorderableList } from "./reorderable-list.js";

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

function formatUnreadCount(count) {
  const normalizedCount = Number(count || 0);

  if (!Number.isInteger(normalizedCount) || normalizedCount <= 0) {
    return "";
  }

  return normalizedCount >= 99 ? "99+" : String(normalizedCount);
}

function createFavoritePlaceUnreadBadge(place) {
  const label = formatUnreadCount(place?.unreadCount);

  if (!label) {
    return null;
  }

  const badge = document.createElement("span");
  badge.className = "favoritesPanelUnreadBadge";
  badge.textContent = label;
  badge.setAttribute("aria-label", `未読${label}件`);

  return badge;
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

function bindFavoriteCharacterOpen(button, character, options = {}) {
  const {
    onOpenCharacter = null
  } = options;

  const eno = getFavoriteCharacterEno(character);
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
}

function createFavoriteCharacterIconButton(character, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelCharacterIconButton button-plain";

  const icon = document.createElement("img");
  icon.className = "favoritesPanelCharacterIcon";
  icon.src = getFavoriteCharacterIconUrl(character);
  icon.alt = getFavoriteCharacterName(character);

  button.appendChild(icon);
  bindFavoriteCharacterOpen(button, character, options);

  return button;
}

function createFavoriteCharacterLabelButton(character, options = {}) {
  const eno = getFavoriteCharacterEno(character);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favoritesPanelCharacterLabelButton button-plain";
  button.textContent = eno
    ? `Eno.${eno} ${getFavoriteCharacterName(character)}`
    : getFavoriteCharacterName(character);

  bindFavoriteCharacterOpen(button, character, options);

  return button;
}

function createFavoriteCharacterMainBlock(character, options = {}) {
  const {
    onOpenCharacter = null,
    showCharacterMemo = false,
    editableCharacterMemo = false,
    characterMemoMaxLength = 40,
    onUpdateCharacterMemo = null
  } = options;

  const body = document.createElement("div");
  body.className = "favoritesPanelCharacterBody";

  const textColumn = document.createElement("div");
  textColumn.className = "favoritesPanelCharacterTextColumn";

  body.appendChild(
    createFavoriteCharacterIconButton(character, {
      onOpenCharacter
    })
  );

  textColumn.appendChild(
    createFavoriteCharacterLabelButton(character, {
      onOpenCharacter
    })
  );

  if (showCharacterMemo) {
    const memoElement = editableCharacterMemo
      ? createFavoriteCharacterMemoInput(character, {
          characterMemoMaxLength,
          onUpdateCharacterMemo
        })
      : createFavoriteCharacterMemoView(character);

    if (memoElement) {
      textColumn.appendChild(memoElement);
    }
  }

  body.appendChild(textColumn);

  return body;
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

function createFavoritePlaceDragHandle(place) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "favoritesPanelPlaceDragHandle button-icon";
  handle.textContent = "☰";
  handle.title = "ドラッグで並び替え";
  handle.setAttribute("aria-label", "ドラッグで並び替え");

  if (place?.placeId) {
    handle.dataset.placeId = place.placeId;
  } else {
    handle.disabled = true;
  }

  return handle;
}

function getFavoritePlaceIdsFromContainer(container) {
  return Array.from(container.querySelectorAll(".favoritesPanelPlaceItem"))
    .map(item => item.dataset.placeId)
    .filter(placeId => typeof placeId === "string" && placeId.trim() !== "");
}

function renderFavoritePlacesContent(container, options = {}) {
  const {
    favoritePlaces = [],
    onMoveToPlace = null,
    enablePlaceReorder = false,
    onReorderFavoritePlaces = null,
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

  favoritePlaces.forEach((place) => {
    const item = document.createElement("div");
    item.className = "favoritesPanelItem favoritesPanelPlaceItem";

    if (place?.placeId) {
      item.dataset.placeId = place.placeId;
    }

    if (enablePlaceReorder) {
      const handle = createFavoritePlaceDragHandle(place);
      item.appendChild(handle);
    }

    item.appendChild(
      createFavoritePlaceButton(place, {
        onMoveToPlace
      })
    );

    const unreadBadge = createFavoritePlaceUnreadBadge(place);

    if (unreadBadge) {
      item.appendChild(unreadBadge);
    }

    container.appendChild(item);
  });
  if (enablePlaceReorder) {
    bindReorderableList({
      container,
      itemSelector: ".favoritesPanelPlaceItem",
      handleSelector: ".favoritesPanelPlaceDragHandle",
      onReorder: ({ container: listContainer }) => {
        if (typeof onReorderFavoritePlaces === "function") {
          onReorderFavoritePlaces(getFavoritePlaceIdsFromContainer(listContainer));
        }
      }
    });
  }
}

function createFavoriteCharacterMemoView(character) {
  const memo = String(character?.memo ?? "").trim();

  if (!memo) {
    return null;
  }

  const text = document.createElement("p");
  text.className = "favoritesPanelCharacterMemo";
  text.textContent = memo;

  return text;
}

function createFavoriteCharacterMemoInput(character, options = {}) {
  const {
    characterMemoMaxLength = 40,
    onUpdateCharacterMemo = null
  } = options;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "favoritesPanelCharacterMemoInput";
  input.maxLength = characterMemoMaxLength;
  input.placeholder = `非公開メモ(最大${characterMemoMaxLength}文字)`;
  input.value = String(character?.memo ?? "").slice(0, characterMemoMaxLength);

  function saveMemo() {
    const eno = getFavoriteCharacterEno(character);

    if (!eno || typeof onUpdateCharacterMemo !== "function") {
      return;
    }

    const savedMemo = onUpdateCharacterMemo(eno, input.value);

    if (typeof savedMemo === "string") {
      input.value = savedMemo;
    }
  }

  input.addEventListener("blur", saveMemo);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      input.blur();
    }
  });

  return input;
}

function renderFavoriteCharactersContent(container, options = {}) {
  const {
    favoriteCharacters = [],
    onOpenCharacter = null,
    onReplyToCharacter = null,
    onMessageToCharacter = null,
    showCharacterReplyAction = false,
    showCharacterMessageAction = false,
    showCharacterMemo = false,
    editableCharacterMemo = false,
    characterMemoMaxLength = 40,
    onUpdateCharacterMemo = null,
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

  favoriteCharacters.forEach((character) => {
    const item = document.createElement("div");
    item.className = "favoritesPanelItem favoritesPanelCharacterItem";

    item.appendChild(
      createFavoriteCharacterMainBlock(character, {
        onOpenCharacter,
        showCharacterMemo,
        editableCharacterMemo,
        characterMemoMaxLength,
        onUpdateCharacterMemo
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
  });
}

function normalizeFavoritesTab(value) {
  return value === "character" ? "character" : "place";
}

export function renderFavoritesPanel(container, options = {}) {
  const {
    isLoggedIn = true,
    defaultTab = "place",
    favoritePlaces = [],
    favoriteCharacters = [],
    onMoveToPlace = null,
    onOpenCharacter = null,
    onReplyToCharacter = null,
    onMessageToCharacter = null,
    showCharacterReplyAction = false,
    showCharacterMessageAction = false,
    showCharacterMemo = false,
    editableCharacterMemo = false,
    characterMemoMaxLength = 40,
    onUpdateCharacterMemo = null,
    enablePlaceReorder = false,
    onReorderFavoritePlaces = null,
    onTabChange = null,
    emptyPlaceText,
    emptyCharacterText
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "favoritesPanelSection";

  const heading = document.createElement("h2");
  heading.className =
    "favoritesPanelHeading common-gradientHeading commonSectionHeading commonSectionHeading-large";
  heading.textContent = "FAVORITES LIST";

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

  const featureGuide = document.createElement("p");
  featureGuide.className = "favoritesPanelFeatureGuide text-muted";
  featureGuide.hidden = true;

  const content = document.createElement("div");
  content.className = "favoritesPanelContent";

  let currentTab = normalizeFavoritesTab(defaultTab);

  function refreshContent() {
    placeTabButton.classList.toggle("is-active", currentTab === "place");
    characterTabButton.classList.toggle("is-active", currentTab === "character");

    featureGuide.hidden = true;
    featureGuide.textContent = "";

    if (currentTab === "place" && enablePlaceReorder) {
      featureGuide.textContent = "☰をドラッグして並べ替えができます";
      featureGuide.hidden = false;
    }

    if (
      currentTab === "character" &&
      showCharacterMemo &&
      editableCharacterMemo
    ) {
      featureGuide.textContent = "キャラクターごとにメモを残せます";
      featureGuide.hidden = false;
    }

    if (currentTab === "place") {
      renderFavoritePlacesContent(content, {
        favoritePlaces,
        onMoveToPlace,
        enablePlaceReorder,
        onReorderFavoritePlaces,
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
      showCharacterMemo,
      editableCharacterMemo,
      characterMemoMaxLength,
      onUpdateCharacterMemo,
      emptyCharacterText
    });
  }

  placeTabButton.addEventListener("click", () => {
    currentTab = "place";

    if (typeof onTabChange === "function") {
      onTabChange(currentTab);
    }

    refreshContent();
  });

  characterTabButton.addEventListener("click", () => {
    currentTab = "character";

    if (typeof onTabChange === "function") {
      onTabChange(currentTab);
    }
    
    refreshContent();
  });

  tabRow.appendChild(placeTabButton);
  tabRow.appendChild(characterTabButton);

  section.appendChild(heading);
  if (!isLoggedIn) {
    const loginMessage = document.createElement("p");
    loginMessage.className = "commonEmptyText favoritesPanelLoginMessage";
    loginMessage.append("お気に入りを表示するには");

    const loginLink = document.createElement("a");
    loginLink.href = "./index.html";
    loginLink.textContent = "ログイン";
    loginMessage.appendChild(loginLink);
    loginMessage.append("してください");

    section.appendChild(loginMessage);
    container.appendChild(section);
    return { section, heading, loginMessage, loginLink };
  }

  section.appendChild(tabRow);
  section.appendChild(featureGuide);
  section.appendChild(content);
  container.appendChild(section);

  refreshContent();

  return {
    section,
    heading,
    tabRow,
    placeTabButton,
    characterTabButton,
    featureGuide,
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
