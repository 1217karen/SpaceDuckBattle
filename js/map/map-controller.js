// map-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { addUnreadCountsToPlaces } from "../services/place-unread-service.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { getFavoriteCharacters } from "../services/character-favorite-service.js";
import { getFavoritePlaces, saveFavoritePlaceIds } from "../chat/chat-place-utils.js";
import { showToast } from "../common/toast.js";
import { createRoom, getPublicRoomsByParentAreaId, getRoomAccessLabel, getRoomsByOwnerEno, isAreaPlace, updateRoom } from "../services/room-service.js";

const mapContent = document.querySelector("#mapContent");
const rightPanel = document.querySelector(".right-panel");

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
let editingRoomPlaceId = null;

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
  return getPublicRoomsByParentAreaId(areaPlaceId);
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
      renderMapTree();
renderMapFavoritesPanel();
showPendingMapToast();
    });

    wrapper.appendChild(button);
  });

  return wrapper;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createMapSectionHeading(
  text,
  sizeClass = "commonSectionHeading-medium"
) {
  const heading = document.createElement("h2");

  heading.className = [
    "common-gradientHeading",
    "commonSectionHeading",
    sizeClass,
    "mapSectionHeading"
  ].join(" ");

  heading.textContent = text;

  return heading;
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

function createMoveButton(place) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-box mapMoveButton";
  button.textContent = "MOVE";

  button.addEventListener("click", () => {
    openMoveConfirm(place.placeId);
  });

  return button;
}

function createPlaceNameBlock(place, currentPlaceId) {
  const nameWrap = document.createElement("div");
  nameWrap.className = "mapListNameWrap";

  const name = document.createElement("span");
  name.className = "mapListName";
  name.textContent = place.name;
  nameWrap.appendChild(name);

  if (place.placeId === currentPlaceId) {
    const currentMark = document.createElement("span");
    currentMark.className = "mapCurrentMark";
    currentMark.textContent = "← 現在地";
    nameWrap.appendChild(currentMark);
  }

  return nameWrap;
}

function renderRoomRow(roomPlace, currentPlaceId) {
  const row = document.createElement("div");
  row.className = "mapRoomRow";

  row.appendChild(
    createPlaceNameBlock(roomPlace, currentPlaceId)
  );

  row.appendChild(
    createMoveButton(roomPlace)
  );

  return row;
}

function renderAreaCard(areaPlace, currentPlaceId) {
  const card = document.createElement("div");
  card.className = "common-card mapAreaCard";

  const roomList = getRoomsByAreaId(areaPlace.placeId);
  const isExpanded = expandedAreaIds.has(areaPlace.placeId);

  const mainRow = document.createElement("div");
  mainRow.className = "mapAreaMainRow";

  mainRow.appendChild(
    createPlaceNameBlock(areaPlace, currentPlaceId)
  );

  mainRow.appendChild(
    createMoveButton(areaPlace)
  );

  card.appendChild(mainRow);

  const roomControlRow = document.createElement("div");
  roomControlRow.className = "mapRoomControlRow";

  if (roomList.length > 0) {
    const roomToggle = document.createElement("button");
    roomToggle.type = "button";
    roomToggle.className = "button-plain mapRoomToggle";
    roomToggle.textContent =
      `ルーム ${roomList.length}件 ${isExpanded ? "▼" : "▶"}`;

    roomToggle.addEventListener("click", () => {
      if (expandedAreaIds.has(areaPlace.placeId)) {
        expandedAreaIds.delete(areaPlace.placeId);
      } else {
        expandedAreaIds.add(areaPlace.placeId);
      }

      renderMapTree();
renderMapFavoritesPanel();
showPendingMapToast();
    });

    roomControlRow.appendChild(roomToggle);
  } else {
    const noRoom = document.createElement("span");
    noRoom.className = "mapNoRoomText";
    noRoom.textContent = "ルームなし";
    roomControlRow.appendChild(noRoom);
  }

  card.appendChild(roomControlRow);

  if (isExpanded) {
    const roomListElement = document.createElement("div");
    roomListElement.className = "mapRoomList";

    roomList.forEach(roomPlace => {
      roomListElement.appendChild(
        renderRoomRow(roomPlace, currentPlaceId)
      );
    });

    card.appendChild(roomListElement);
  }

  return card;
}

function renderFieldList(fieldPlace, currentPlaceId) {
  const fragment = document.createDocumentFragment();

  const fieldHeader = document.createElement("div");
  fieldHeader.className = "mapFieldHeader";

  fieldHeader.appendChild(
    createPlaceNameBlock(fieldPlace, currentPlaceId)
  );

  fieldHeader.appendChild(
    createMoveButton(fieldPlace)
  );

  fragment.appendChild(fieldHeader);

  const areaList = getMainAreasByFieldId(fieldPlace.placeId);

  if (areaList.length === 0) {
    const empty = document.createElement("p");
    empty.className = "mapTreeEmpty";
    empty.textContent = "この階層には表示できるエリアがありません";
    fragment.appendChild(empty);
    return fragment;
  }

  const areaListElement = document.createElement("div");
  areaListElement.className = "mapAreaList";

  areaList.forEach(areaPlace => {
    areaListElement.appendChild(
      renderAreaCard(areaPlace, currentPlaceId)
    );
  });

  fragment.appendChild(areaListElement);

  return fragment;
}

function renderMoveConfirmModal() {
  const place = findPlaceById(moveConfirmPlaceId);

  if (!place) {
    return null;
  }

  const overlay = document.createElement("div");
  overlay.className = "commonModalOverlay";

  const modal = document.createElement("div");
  modal.className = "commonModal";

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

function getCurrentEno() {
  const account = getCurrentAccount();
  const eno = Number(account?.eno || 0);

  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

function renderMapFavoritesPanel() {
  const currentEno = getCurrentEno();

  renderFavoritesSidePanel(rightPanel, {
    isLoggedIn: currentEno !== null,
    defaultTab: "place",
    favoritePlaces: addUnreadCountsToPlaces(getFavoritePlaces(), { currentEno, viewerEno: currentEno }),
    favoriteCharacters: getFavoriteCharacters({ currentEno }),
    onMoveToPlace: moveToPlace,
    showCharacterMemo: true,
    enablePlaceReorder: true,
    onReorderFavoritePlaces: (placeIds) => {
      saveFavoritePlaceIds(placeIds);
      renderMapFavoritesPanel();
    }
  });
}

function readRoomFormData(form) {
  return {
    name: form.querySelector("[name=roomName]")?.value ?? "",
    shortDescription: form.querySelector("[name=roomShortDescription]")?.value ?? "",
    longDescription: form.querySelector("[name=roomLongDescription]")?.value ?? "",
    accessType: form.querySelector("[name=roomAccessType]:checked")?.value ?? "public",
    showParentMainAreaPreview: Boolean(form.querySelector("[name=showParentMainAreaPreview]")?.checked),
    actionIds: form.querySelector("[name=actionLookAround]")?.checked ? ["look-around"] : []
  };
}

function renderRoomCreatorSection(currentPlaceId) {
  /*
   * ROOM全体のラッパー。
   * この要素自体にはカードの見た目を付けない。
   */
  const section = document.createElement("section");
  section.className = "mapRoomSection";

  const account = getCurrentAccount();
  const currentPlace = findPlaceById(currentPlaceId);

  const editingRoom = editingRoomPlaceId
    ? findPlaceById(editingRoomPlaceId)
    : null;

  const canCreateRoom = isAreaPlace(currentPlace);

  /*
   * ROOM見出し。
   * 作成カードと作成済み一覧カードの両方より外側に置く。
   */
  section.appendChild(
    createMapSectionHeading("ROOM")
  );

  /*
   * ルーム作成・編集用のカード。
   */
  const creatorCard = document.createElement("div");
  creatorCard.className = [
    "common-card",
    "common-card-themed",
    "mapRoomCreatorCard"
  ].join(" ");

  const title = document.createElement("h2");
  title.className = "mapRoomCreatorTitle";
  title.textContent = editingRoom
    ? "ルーム編集"
    : "ルーム作成";

  creatorCard.appendChild(title);

  const help = document.createElement("p");
  help.className = "mapRoomCreatorHelp";
  help.textContent =
    "現在いるエリアにルームを作成します。作成後は自動でそのルームへ移動します。";

  creatorCard.appendChild(help);

  /*
   * 現在地と、作成できない場合の注意文。
   */
  const currentRow = document.createElement("div");
  currentRow.className = "mapRoomCurrentRow";

  const currentInfo = document.createElement("p");
  currentInfo.className = "mapRoomCurrentInfo";
  currentInfo.textContent =
    `現在地：${currentPlace?.name ?? "なし"}`;

  currentRow.appendChild(currentInfo);

  if (!editingRoom && !canCreateRoom) {
    const notice = document.createElement("p");
    notice.className = "mapRoomCreatorNotice";
    notice.textContent =
      "※現在地ではルームを作成できません。エリアに移動してください。";

    currentRow.appendChild(notice);
  }

  creatorCard.appendChild(currentRow);

  /*
   * 未ログイン時。
   * 作成カードだけ表示し、作成済み一覧は表示しない。
   */
  if (!account?.eno) {
    const loginNotice = document.createElement("p");
    loginNotice.className = "mapRoomCreatorNotice";
    loginNotice.textContent =
      "ルーム作成・編集にはログインが必要です。";

    creatorCard.appendChild(loginNotice);
    section.appendChild(creatorCard);

    return section;
  }

  /*
   * 入力フォーム。
   */
  const form = document.createElement("form");
  form.className = "mapRoomForm";

  const roomName = editingRoom?.name ?? "";
  const roomShortDescription =
    editingRoom?.shortDescription ?? "";
  const roomLongDescription =
    editingRoom?.longDescription ?? "";

  const accessType =
    editingRoom?.accessType === "invite" ||
    editingRoom?.accessType === "private"
      ? editingRoom.accessType
      : "public";

  const showParentPreview = editingRoom
    ? Boolean(editingRoom.showParentMainAreaPreview)
    : true;

  const hasLookAround = editingRoom
    ? Array.isArray(editingRoom.actionIds) &&
      editingRoom.actionIds.includes("look-around")
    : true;

  form.innerHTML = `
    <label class="mapRoomFormField">
      <span>ルーム名</span>
      <input
        type="text"
        name="roomName"
        value="${escapeHtml(roomName)}"
        maxlength="40"
        required
      >
    </label>

    <label class="mapRoomFormField">
      <span>簡易説明</span>
      <input
        type="text"
        name="roomShortDescription"
        value="${escapeHtml(roomShortDescription)}"
        maxlength="40"
        placeholder="最大40文字"
      >
      <small class="text-muted mapRoomFormHint">
        一覧やヘッダーに出る1行説明です。
      </small>
    </label>

    <label class="mapRoomFormField">
      <span>詳細説明</span>
      <textarea
        name="roomLongDescription"
        maxlength="800"
        rows="5"
        placeholder="最大800文字"
      >${escapeHtml(roomLongDescription)}</textarea>
      <small class="text-muted mapRoomFormHint">
        ルーム詳細に出る説明です。文字装飾が使用可能です。
      </small>
    </label>

    <fieldset class="common-card-subtle mapRoomFormFieldset">
      <legend class="text-muted">
        公開範囲
      </legend>

      <label>
        <input
          type="radio"
          name="roomAccessType"
          value="public"
          ${accessType === "public" ? "checked" : ""}
        >
        公開
      </label>

      <label>
        <input
          type="radio"
          name="roomAccessType"
          value="invite"
          ${accessType === "invite" ? "checked" : ""}
        >
        招待制
      </label>

      <label>
        <input
          type="radio"
          name="roomAccessType"
          value="private"
          ${accessType === "private" ? "checked" : ""}
        >
        非公開
      </label>
    </fieldset>

    <label class="mapRoomFormCheckbox">
      <input
        type="checkbox"
        name="showParentMainAreaPreview"
        ${showParentPreview ? "checked" : ""}
      >
      親エリアの発言を表示する
    </label>

    <label class="mapRoomFormCheckbox">
      <input
        type="checkbox"
        name="actionLookAround"
        ${hasLookAround ? "checked" : ""}
      >
      アクション「周囲を見る」を使えるようにする
    </label>
  `;

  /*
   * 作成・保存ボタン。
   */
  const buttonRow = document.createElement("div");
  buttonRow.className = "mapRoomFormButtonRow";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className =
    "button-primaryNew mapRoomFormSubmitButton";
  submitButton.textContent = editingRoom
    ? "変更を保存"
    : "ルームを作成";

  buttonRow.appendChild(submitButton);

  /*
   * 編集中だけキャンセルボタンを表示。
   */
  if (editingRoom) {
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className =
      "button-box mapRoomFormSecondaryButton";
    cancelButton.textContent = "編集をやめる";

    cancelButton.addEventListener("click", () => {
      editingRoomPlaceId = null;
      renderMapTree();
    });

    buttonRow.appendChild(cancelButton);
  }

  form.appendChild(buttonRow);

  form.addEventListener("submit", event => {
    event.preventDefault();

    const input = readRoomFormData(form);

    const result = editingRoom
      ? updateRoom(editingRoom.placeId, {
          ...input,
          ownerEno: account.eno
        })
      : createRoom({
          ...input,
          parentId: currentPlaceId,
          ownerEno: account.eno
        });

    if (!result.ok) {
      showToast(result.message, {
        type: "error"
      });

      return;
    }

    showToast(result.message, {
      type: "success"
    });

    if (editingRoom) {
      editingRoomPlaceId = null;
      renderMapTree();
      return;
    }

    moveToPlace(result.room.placeId);
  });

  /*
   * 新規作成時、現在地がエリアでなければフォームを無効化。
   * 編集中は現在地に関係なく編集可能。
   */
  if (!editingRoom && !canCreateRoom) {
    form
      .querySelectorAll("input, textarea, button")
      .forEach(element => {
        element.disabled = true;
      });
  }

  /*
   * フォームは作成カード内に入れる。
   */
  creatorCard.appendChild(form);

  /*
   * ROOM見出しの下に、
   * 作成カードと作成済み一覧カードを別々に追加する。
   */
  section.appendChild(creatorCard);
  section.appendChild(
    renderOwnedRoomList(account.eno)
  );

  return section;
}

function renderOwnedRoomList(ownerEno) {
  const wrapper = document.createElement("div");

  wrapper.className = [
    "common-card",
    "common-card-themed",
    "common-card-surface",
    "mapOwnedRoomListSection"
  ].join(" ");

  const title = document.createElement("h2");
  title.className = "mapRoomCreatorTitle mapOwnedRoomListTitle";
  title.textContent = "作成済みルーム一覧";
  wrapper.appendChild(title);

  const rooms = getRoomsByOwnerEno(ownerEno);

  if (rooms.length === 0) {
    const empty = document.createElement("p");
    empty.className = "mapNoRoomText";
    empty.textContent = "作成済みルームはありません。";
    wrapper.appendChild(empty);

    return wrapper;
  }

  const list = document.createElement("div");
  list.className = "mapOwnedRoomList";

  rooms.forEach(room => {
    const row = document.createElement("div");
    row.className = "mapOwnedRoomRow";

    const name = document.createElement("span");
    name.className = "mapOwnedRoomName";
    name.textContent =
      `${room.name} [${getRoomAccessLabel(room.accessType)}]`;

    row.appendChild(name);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "button-box mapMoveButton";
    editButton.textContent = "編集";

    editButton.addEventListener("click", () => {
      editingRoomPlaceId = room.placeId;
      renderMapTree();
    });

    row.appendChild(editButton);
    list.appendChild(row);
  });

  wrapper.appendChild(list);

  return wrapper;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMoveConfirmModalIfNeeded() {
  if (!moveConfirmPlaceId) {
    return;
  }

  const modal = renderMoveConfirmModal();

  if (modal) {
    mapContent.appendChild(modal);
  }
}

function showPendingMapToast() {
  const pendingToast = sessionStorage.getItem("chatToastMessage");

  if (!pendingToast) {
    return;
  }

  sessionStorage.removeItem("chatToastMessage");

  try {
    const parsed = JSON.parse(pendingToast);
    if (parsed?.message) {
      showToast(parsed.message, {
        type: parsed.type || "info"
      });
    }
  } catch {
    // 何もしない
  }
}

function renderMapTree() {
  if (!mapContent) return;

  const character = getCurrentCharacter();
  const currentPlaceId = character?.currentPlaceId ?? null;

  mapContent.innerHTML = "";

  const heading = document.createElement("h1");
  heading.className = "pageTitle mapTitle";
  heading.textContent = "MAP";
  mapContent.appendChild(heading);

  mapContent.appendChild(createMapVisual());

  mapContent.appendChild(
    createMapSectionHeading("MOVE")
  );

  const tree = document.createElement("div");
  tree.className = "mapTree";

  if (!selectedFieldId) {
    const empty = document.createElement("p");
    empty.className = "mapTreeEmpty";
    empty.textContent = "移動したい階層を選んでください";
    tree.appendChild(empty);
    mapContent.appendChild(tree);
    mapContent.appendChild(renderRoomCreatorSection(currentPlaceId));

    renderMoveConfirmModalIfNeeded();
    return;
  }

  const selectedField = findPlaceById(selectedFieldId);

  if (!selectedField) {
    const empty = document.createElement("p");
    empty.className = "mapTreeEmpty";
    empty.textContent = "表示できる階層がありません";
    tree.appendChild(empty);
    mapContent.appendChild(tree);
    mapContent.appendChild(renderRoomCreatorSection(currentPlaceId));

    renderMoveConfirmModalIfNeeded();
    return;
  }

tree.appendChild(
  renderFieldList(selectedField, currentPlaceId)
);

mapContent.appendChild(tree);
    mapContent.appendChild(renderRoomCreatorSection(currentPlaceId));

renderMoveConfirmModalIfNeeded();
}

renderMapTree();
renderMapFavoritesPanel();
showPendingMapToast();
