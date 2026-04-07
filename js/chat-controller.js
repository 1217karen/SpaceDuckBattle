//chat-controller.js

import { places } from "./places-data.js";
import { posts } from "./posts-data.js";
import {getCurrentAccount,loadCharacter,saveCharacter} from "./storage-service.js";

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

function getPostsByPlaceId(placeId) {
  return posts.filter(post => post.placeId === placeId);
}

function renderChatPlaceInfo() {
  if (!centerPanel) return;

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId =
    getPlaceIdFromQuery() ||
    character?.currentPlaceId ||
    "F1";

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

  const currentPlaceRow = document.createElement("p");
  currentPlaceRow.textContent =
    `保存中の現在地: ${character?.currentPlaceId ?? "なし"}`;
  centerPanel.appendChild(currentPlaceRow);

    if (place.kind !== "room") {
    const switchHeading = document.createElement("h2");
    switchHeading.textContent = "場所切替";
    centerPanel.appendChild(switchHeading);

    const sameGroupPlaces =
      getPlacesInSameGroup(place)
        .slice()
        .sort((a, b) =>
          getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
        );

    sameGroupPlaces.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";

      const label =
        `${getLayerLabel(item.layer)} : ${item.name}`;

      button.textContent = label;

      if (item.placeId === place.placeId) {
        button.disabled = true;
      } else {
        button.addEventListener("click", () => {
          moveToPlace(item.placeId);
        });
      }

      centerPanel.appendChild(button);
    });
  }

    const postsHeading = document.createElement("h2");
  postsHeading.textContent = "発言一覧";
  centerPanel.appendChild(postsHeading);

  const currentPosts = getPostsByPlaceId(place.placeId);

  if (currentPosts.length === 0) {
    const emptyPosts = document.createElement("p");
    emptyPosts.textContent = "発言はありません";
    centerPanel.appendChild(emptyPosts);
  } else {
    currentPosts.forEach(post => {
      const postBox = document.createElement("div");

      const meta = document.createElement("p");
      meta.textContent =
        `${post.speakerName} / ${post.createdAt} / ${post.placeId}`;

      const body = document.createElement("p");
      body.textContent = post.body;

      postBox.appendChild(meta);
      postBox.appendChild(body);

      centerPanel.appendChild(postBox);
    });
  }
}

renderChatPlaceInfo();
