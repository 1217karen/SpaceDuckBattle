//chat-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { getAllPosts } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection,renderChatTabsSection,renderPostListSection } from "./chat-view.js";

const centerPanel = document.querySelector(".center-panel");

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

centerPanel.innerHTML = "";

renderPlaceInfoSection(centerPanel, {
  place,
  places,
  onMoveToPlace: moveToPlace
});

if (!place) {
  return;
}

const placeTabs = buildPlaceTabs(place);
const viewTabs = buildViewTabs();

renderChatTabsSection(centerPanel, {
  placeTabs,
  viewTabs
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
