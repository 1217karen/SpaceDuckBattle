// map-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";

const mapContent = document.querySelector("#mapContent");

const MAP_IMAGE_URL = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=Map_BG.webp";

const ZONE_LABELS = {
  upper: "上層",
  middle: "中層",
  lower: "下層"
};

const ZONE_ORDER = ["upper", "middle", "lower"];

const expandedFieldIds = new Set();
const expandedAreaIds = new Set();

let selectedFieldId = null;
let moveConfirmPlaceId = null;

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

function openMoveConfirm(placeId) {
  moveConfirmPlaceId = placeId;
  renderMapTree();
}

function closeMoveConfirm() {
  moveConfirmPlaceId = null;
  renderMapTree();
}

function findPlaceById(placeId) {
  return places.find(place => place.placeId === placeId) || null;
}

function findFieldByPlaceId(placeId) {
  let place = findPlaceById(placeId);

  while (place) {
    if (place.kind === "field") {
      return place;
    }

    place = findPlaceById(place.parentId);
  }

  return null;
}

function getMainFields() {
  return places.filter(place =>
    place.kind === "field" &&
    place.layer === "main"
  );
}

function getFieldByZoneId(zoneId) {
  return getMainFields().find(place => place.zoneId === zoneId) || null;
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

function createMapVisual() {
  const wrapper = document.createElement("div");
  wrapper.className = "mapVisual";

  const image = document.createElement("img");
  image.className = "mapVisualImage";
  image.src = MAP_IMAGE_URL;
  image.alt = "コロニーマップ";

  wrapper.appendChild(image);

  ZONE_ORDER.forEach(zoneId => {
    const field = getFieldByZoneId(zoneId);

    if (!field) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `mapLayerHotspot mapLayer${capitalize(zoneId)}`;
    button.textContent = ZONE_LABELS[zoneId] ?? field.name;

    if (field.placeId === selectedFieldId) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", () => {
      selectedFieldId = field.placeId;
      expandedFieldIds.add(field.placeId);
      renderMapTree();
    });

    wrapper.appendChild(button);
  });

  return wrapper;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createToggleButton({
  canToggle,
  isExpanded,
  onToggle
}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mapTreeToggle";

  if (!canToggle) {
    button.textContent = "・";
    button.disabled = true;
    return button;
  }

  button.textContent = isExpanded ? "▼" : "▶";
  button.addEventListener("click", onToggle);

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

  const toggleButton = createToggleButton({
    canToggle,
    isExpanded,
    onToggle
  });

  const nameButton = document.createElement("button");
  nameButton.type = "button";
  nameButton.className = "mapPlaceName";
  nameButton.textContent = place.name;

  nameButton.addEventListener("click", () => {
    openMoveConfirm(place.placeId);
  });

  row.appendChild(toggleButton);
  row.appendChild(nameButton);

  if (place.placeId === currentPlaceId) {
    const currentMark = document.createElement("span");
    currentMark.className = "mapCurrentMark";
    currentMark.textContent = "← 現在地";
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

function renderMoveConfirmModal() {
  const place = findPlaceById(moveConfirmPlaceId);

  if (!place) {
    return null;
  }

  const overlay = document.createElement("div");
  overlay.className = "mapModalOverlay";

  const modal = document.createElement("div");
  modal.className = "mapModal";

  const title = document.createElement("h2");
  title.className = "mapModalTitle";
  title.textContent = place.name;
  modal.appendChild(title);

  if (place.shortDescription) {
    const description = document.createElement("p");
    description.className = "mapModalDescription";
    description.textContent = place.shortDescription;
    modal.appendChild(description);
  }

  const message = document.createElement("p");
  message.className = "mapModalMessage";
  message.textContent = "この場所へ移動します。よろしいですか？";
  modal.appendChild(message);

  const buttonRow = document.createElement("div");
  buttonRow.className = "mapModalButtonRow";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "button-primaryNew mapModalButton";
  confirmButton.textContent = "移動する";

  confirmButton.addEventListener("click", () => {
    moveToPlace(place.placeId);
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "button-box mapModalButton";
  cancelButton.textContent = "戻る";

  cancelButton.addEventListener("click", () => {
    closeMoveConfirm();
  });

  buttonRow.appendChild(confirmButton);
  buttonRow.appendChild(cancelButton);
  modal.appendChild(buttonRow);

  overlay.addEventListener("click", () => {
    closeMoveConfirm();
  });

  modal.addEventListener("click", event => {
    event.stopPropagation();
  });

  overlay.appendChild(modal);

  return overlay;
}

function renderMapTree() {
  if (!mapContent) return;

  const character = getCurrentCharacter();
  const currentPlaceId = character?.currentPlaceId ?? null;

  mapContent.innerHTML = "";

  const heading = document.createElement("h1");
  heading.className = "mapTitle";
  heading.textContent = "マップ";
  mapContent.appendChild(heading);

  const info = document.createElement("p");
  info.className = "mapCurrentInfo";
  info.textContent =
    `保存中の現在地: ${currentPlaceId ?? "なし"}`;
  mapContent.appendChild(info);

  mapContent.appendChild(createMapVisual());

  const tree = document.createElement("div");
  tree.className = "mapTree";

if (!selectedFieldId) {
  const empty = document.createElement("p");
  empty.className = "mapTreeEmpty";
  empty.textContent = "移動したい階層を選んでください";
  tree.appendChild(empty);
  mapContent.appendChild(tree);
    if (moveConfirmPlaceId) {
    const modal = renderMoveConfirmModal();

    if (modal) {
      mapContent.appendChild(modal);
    }
  }
  return;
}

const selectedField = findPlaceById(selectedFieldId);

if (!selectedField) {
  const empty = document.createElement("p");
  empty.className = "mapTreeEmpty";
  empty.textContent = "表示できる階層がありません";
  tree.appendChild(empty);
  mapContent.appendChild(tree);
  return;
}

expandedFieldIds.add(selectedField.placeId);

tree.appendChild(
  renderFieldNode(selectedField, currentPlaceId)
);

mapContent.appendChild(tree);
}

renderMapTree();
