//chat-controller.js

import { places } from "./places-data.js";

const centerPanel = document.querySelector(".center-panel");

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId") || "F1";
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

function renderChatPlaceInfo() {
  if (!centerPanel) return;

  const placeId = getPlaceIdFromQuery();
  const place = getPlaceById(placeId);

  centerPanel.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = "チャット";
  centerPanel.appendChild(heading);

  if (!place) {
    const error = document.createElement("p");
    error.textContent = "場所が見つかりません";
    centerPanel.appendChild(error);
    return;
  }

  const placeIdRow = document.createElement("p");
  placeIdRow.textContent = `場所ID: ${place.placeId}`;
  centerPanel.appendChild(placeIdRow);

  const nameRow = document.createElement("p");
  nameRow.textContent = `場所名: ${place.name}`;
  centerPanel.appendChild(nameRow);

  const kindRow = document.createElement("p");
  kindRow.textContent = `種別: ${getKindLabel(place.kind)}`;
  centerPanel.appendChild(kindRow);

  const layerRow = document.createElement("p");
  layerRow.textContent = `区分: ${getLayerLabel(place.layer)}`;
  centerPanel.appendChild(layerRow);

  const parentRow = document.createElement("p");
  parentRow.textContent = `親ID: ${place.parentId ?? "なし"}`;
  centerPanel.appendChild(parentRow);

  const groupRow = document.createElement("p");
  groupRow.textContent = `グループID: ${place.groupId}`;
  centerPanel.appendChild(groupRow);
}

renderChatPlaceInfo();
