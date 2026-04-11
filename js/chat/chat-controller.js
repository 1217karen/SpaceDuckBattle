//chat-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, normalizeCommIcons, setButtonPreview } from "../common/icon-picker.js";
import { bindSpeakerNameSync } from "../common/speaker-name-sync.js";
import { getAllPosts } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection,renderPlaceTabsSection,renderChatComposerSection,renderViewTabsSection,renderPostListSection } from "./chat-view.js";

const centerPanel = document.querySelector(".center-panel");
const chatIconPicker = createIconPicker();

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}

function getPlaceById(placeId) {
  return places.find(place => place.placeId === placeId) || null;
}

function getKindLabel(kind) {
  if (kind === "field") return "フィールド";
  if (kind === "area") return "エリア";
  if (kind === "room") return "ルーム";
  return "";
}

function getLayerLabel(layer) {
  if (layer === "main") return "メイン";
  if (layer === "side") return "サイド";
  if (layer === "local") return "ローカル";
  return "なし";
}

function getPlacesInSameGroup(place) {
  if (!place?.groupId) return [];

  return places.filter(item =>
    item.groupId === place.groupId
  );
}

function getLayerSortValue(layer) {
  if (layer === "main") return 1;
  if (layer === "side") return 2;
  if (layer === "local") return 3;
  return 999;
}

function moveToPlace(placeId) {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;
  const character = loadCharacter(eno) || {};

  saveCharacter(eno, {
    ...character,
    currentPlaceId: placeId
  });

  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
}

function getPlaceLabel(placeId) {
  const place = getPlaceById(placeId);
  return place?.name || placeId;
}

function getAroundBasePlace(place) {
  if (!place) {
    return null;
  }

  if (place.kind === "room") {
    return place;
  }

  if (place.layer === "main") {
    return place;
  }

  return places.find(item =>
    item.groupId === place.groupId &&
    item.kind === place.kind &&
    item.layer === "main"
  ) || place;
}

function buildPlaceTabs(place) {
  if (!place) {
    return [];
  }

  if (place.kind === "room") {
    const tabs = [];

    if (place.accessType === "public" || place.accessType === "password" || place.accessType === "private") {
      tabs.push({
        key: "shop",
        label: "SHOP",
        isActive: false,
        isDisabled: true
      });
    }

    return tabs;
  }

  const sameGroupPlaces =
    getPlacesInSameGroup(place)
      .slice()
      .sort((a, b) =>
        getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
      );

const tabs = sameGroupPlaces.map(item => ({
  key: `layer-${item.layer}`,
  label: String(item.layer ?? "").toUpperCase(),
  isActive: item.placeId === place.placeId,
  isCurrent: item.placeId === place.placeId,
  isDisabled: item.placeId === place.placeId,
  onClick: () => {
    moveToPlace(item.placeId);
  }
}));

  tabs.push({
    key: "shop",
    label: "SHOP",
    isActive: false,
    isDisabled: true
  });

  return tabs;
}

function buildViewTabs() {
  return [
    {
      key: "chat",
      label: "CHAT",
      isActive: true,
      isDisabled: true
    },
    {
      key: "reply",
      label: "REPLY",
      isActive: false,
      isDisabled: true
    },
    {
      key: "message",
      label: "MESSAGE",
      isActive: false,
      isDisabled: true
    },
    {
      key: "favorite",
      label: "FAVORITE",
      isActive: false,
      isDisabled: true
    },
    {
      key: "self",
      label: "SELF",
      isActive: false,
      isDisabled: true
    }
  ];
}

function getInitialComposerIcon(character) {
  const commIcons = normalizeCommIcons(character?.commIcons);
  const defaultIconUrl =
    typeof character?.defaultIcon === "string"
      ? character.defaultIcon.trim()
      : "";

  if (defaultIconUrl !== "") {
    return {
      iconId: null,
      iconUrl: defaultIconUrl
    };
  }

  if (commIcons.length > 0) {
    return {
      iconId: commIcons[0].id,
      iconUrl: commIcons[0].url
    };
  }

  return {
    iconId: null,
    iconUrl: getNoImageUrl()
  };
}

function getInitialComposerSpeakerName(character, initialIcon) {
  const defaultName =
    typeof character?.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  const commIcons = normalizeCommIcons(character?.commIcons);

  if (initialIcon?.iconId) {
    const matchedIcon = commIcons.find(item => item.id === initialIcon.iconId) || null;
    const iconName =
      typeof matchedIcon?.name === "string"
        ? matchedIcon.name.trim()
        : "";

    if (iconName !== "") {
      return iconName;
    }
  }

  return defaultName;
}

function setupComposerIconPicker(composerRefs, character) {
  if (!composerRefs?.iconButton) {
    return;
  }

  const commIcons = normalizeCommIcons(character?.commIcons);
  const initialIcon = getInitialComposerIcon(character);
  const initialSpeakerName =
    getInitialComposerSpeakerName(character, initialIcon);

  setButtonPreview(
    composerRefs.iconButton,
    initialIcon.iconId,
    initialIcon.iconUrl
  );

  if (composerRefs.nameInput) {
    composerRefs.nameInput.value = initialSpeakerName;
  }

  bindSpeakerNameSync({
    nameInput: composerRefs.nameInput,
    button: composerRefs.iconButton,
    getIcons: () => commIcons,
    getDefaultName: () =>
      typeof character?.defaultName === "string"
        ? character.defaultName.trim()
        : "",
    mode: "value"
  });

  composerRefs.iconButton.addEventListener("click", () => {
    chatIconPicker.open(composerRefs.iconButton, commIcons);
  });
}

function renderChatPlaceInfo() {
  if (!centerPanel) return;

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId =
    getPlaceIdFromQuery() ||
    character?.currentPlaceId ||
    "F1-1";

const place = getPlaceById(placeId);
  const aroundBasePlace = getAroundBasePlace(place);

centerPanel.innerHTML = "";

renderPlaceInfoSection(centerPanel, {
  place,
  aroundBasePlace,
  places,
  onMoveToPlace: moveToPlace
});

if (!place) {
  return;
}

const placeTabs = buildPlaceTabs(place);
const viewTabs = buildViewTabs();

renderPlaceTabsSection(centerPanel, {
  tabs: placeTabs
});

const composerRefs = renderChatComposerSection(centerPanel, {
  speakerName: "テストネーム",
  replyTargetLabel: "返信先なし"
});

setupComposerIconPicker(composerRefs, character);

renderViewTabsSection(centerPanel, {
  tabs: viewTabs
});

const allPosts = getAllPosts();

const displayPosts = getDisplayPosts({
  currentPlace: place,
  allPosts,
  places
});

renderPostListSection(centerPanel, {
  posts: displayPosts,
  getPlaceLabel
});
}

renderChatPlaceInfo();
