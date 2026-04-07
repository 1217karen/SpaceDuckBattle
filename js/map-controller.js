//map-controller.js

import { places } from "./places-data.js";
import {getCurrentAccount,loadCharacter,saveCharacter} from "./storage-service.js";

const centerPanel = document.querySelector(".center-panel");

const expandedFieldIds = new Set();
const expandedAreaIds = new Set();

function getCurrentCharacter() {
  const account = getCurrentAccount();

  if (!account?.eno) {
    return null;
  }

  return loadCharacter(account.eno) || null;
}

function saveCurrentPlace(placeId) {
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
}

function moveToPlace(placeId) {
  saveCurrentPlace(placeId);

  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
}

function getMainFields() {
  return places.filter(place =>
    place.kind === "field" &&
    place.layer === "main"
  );
}

function getMainAreasByFieldId(fieldPlaceId) {
  return places.filter(place =>
    place.kind === "area" &&
    place.layer === "main" &&
    place.parentId === fieldPlaceId
  );
}

function getRoomsByAreaId(areaPlaceId) {
  return places.filter(place =>
    place.kind === "room" &&
    place.parentId === areaPlaceId
  );
}

function createMoveButton(place) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "ここに移動する";

  button.addEventListener("click", () => {
    moveToPlace(place.placeId);
  });

  return button;
}

function createToggleButton(isExpanded) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = isExpanded ? "▼" : "▶";
  return button;
}

function createPlaceLine({
  place,
  depth,
  canToggle,
  isExpanded,
  onToggle,
  currentPlaceId
}) {
  const row = document.createElement("div");
  row.className = "mapTreeRow";
  row.style.marginLeft = `${depth * 20}px`;

  const toggleButton = createToggleButton(isExpanded);

  if (!canToggle) {
    toggleButton.textContent = "・";
    toggleButton.disabled = true;
  } else {
    toggleButton.addEventListener("click", onToggle);
  }

  const nameButton = document.createElement("button");
  nameButton.type = "button";
  nameButton.textContent = place.name;

  if (canToggle) {
    nameButton.addEventListener("click", onToggle);
  } else {
    nameButton.disabled = true;
  }

  const moveButton = createMoveButton(place);

  row.appendChild(toggleButton);
  row.appendChild(nameButton);
  row.appendChild(moveButton);

  if (place.placeId === currentPlaceId) {
    const currentMark = document.createElement("span");
    currentMark.textContent = " ← 現在地";
    row.appendChild(currentMark);
  }

  return row;
}

function renderAreaNode(areaPlace, depth, currentPlaceId) {
  const fragment = document.createDocumentFragment();
  const isExpanded = expandedAreaIds.has(areaPlace.placeId);
  const roomList = getRoomsByAreaId(areaPlace.placeId);
  const canToggle = roomList.length > 0;

  fragment.appendChild(
    createPlaceLine({
      place: areaPlace,
      depth,
      canToggle,
      isExpanded,
      onToggle: () => {
        if (expandedAreaIds.has(areaPlace.placeId)) {
          expandedAreaIds.delete(areaPlace.placeId);
        } else {
          expandedAreaIds.add(areaPlace.placeId);
        }

        renderMapTree();
      },
      currentPlaceId
    })
  );

  if (isExpanded) {
    roomList.forEach(roomPlace => {
      fragment.appendChild(
        createPlaceLine({
          place: roomPlace,
          depth: depth + 1,
          canToggle: false,
          isExpanded: false,
          onToggle: null,
          currentPlaceId
        })
      );
    });
  }

  return fragment;
}

function renderFieldNode(fieldPlace, currentPlaceId) {
  const fragment = document.createDocumentFragment();
  const isExpanded = expandedFieldIds.has(fieldPlace.placeId);
  const areaList = getMainAreasByFieldId(fieldPlace.placeId);
  const canToggle = areaList.length > 0;

  fragment.appendChild(
    createPlaceLine({
      place: fieldPlace,
      depth: 0,
      canToggle,
      isExpanded,
      onToggle: () => {
        if (expandedFieldIds.has(fieldPlace.placeId)) {
          expandedFieldIds.delete(fieldPlace.placeId);
        } else {
          expandedFieldIds.add(fieldPlace.placeId);
        }

        renderMapTree();
      },
      currentPlaceId
    })
  );

  if (isExpanded) {
    areaList.forEach(areaPlace => {
      fragment.appendChild(
        renderAreaNode(areaPlace, 1, currentPlaceId)
      );
    });
  }

  return fragment;
}

function renderMapTree() {
  if (!centerPanel) return;

  const character = getCurrentCharacter();
  const currentPlaceId = character?.currentPlaceId ?? null;

  centerPanel.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = "マップ";
  centerPanel.appendChild(heading);

  const info = document.createElement("p");
  info.textContent =
    `保存中の現在地: ${currentPlaceId ?? "なし"}`;
  centerPanel.appendChild(info);

  const mainFields = getMainFields();

  if (mainFields.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "表示できるフィールドがありません";
    centerPanel.appendChild(empty);
    return;
  }

  mainFields.forEach(fieldPlace => {
    centerPanel.appendChild(
      renderFieldNode(fieldPlace, currentPlaceId)
    );
  });
}

renderMapTree();
