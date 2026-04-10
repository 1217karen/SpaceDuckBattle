//chat-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { getAllPosts } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection,renderPlaceSwitchSection,renderPostListSection } from "./chat-view.js";

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
  places
});

if (!place) {
  return;
}

  const sameGroupPlaces =
  getPlacesInSameGroup(place)
    .slice()
    .sort((a, b) =>
      getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
    );

renderPlaceSwitchSection(centerPanel, {
  currentPlace: place,
  sameGroupPlaces,
  getLayerLabel,
  onMoveToPlace: moveToPlace
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
