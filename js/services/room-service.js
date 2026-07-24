// room-service.js

import { places } from "../data/places-data.js";

const ROOM_STORAGE_KEY = "userCreatedRooms";
const ROOM_ID_PREFIX = "room_";
const ROOM_ID_RANDOM_LENGTH = 16;
const ROOM_NAME_MAX_LENGTH = 25;
const ROOM_SHORT_DESCRIPTION_MAX_LENGTH = 40;
const ROOM_LONG_DESCRIPTION_MAX_LENGTH = 800;
const ROOM_ACCESS_LABELS = {
  public: "公開",
  invite: "招待制",
  private: "非公開",
  password: "招待制"
};

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeAccessType(accessType) {
  return ["public", "invite", "private"].includes(accessType)
    ? accessType
    : "public";
}

function normalizeRoom(room = {}) {
  const placeId = typeof room.placeId === "string" ? room.placeId.trim() : "";
  const parentId = typeof room.parentId === "string" ? room.parentId.trim() : "";
  const now = new Date().toISOString();

  return {
    ...room,
    placeId,
    groupId: typeof room.groupId === "string" && room.groupId.trim() !== ""
      ? room.groupId.trim()
      : placeId,
    zoneId: typeof room.zoneId === "string" ? room.zoneId : "",
    parentId,
    kind: "room",
    layer: null,
    name: normalizeRoomName(room.name) || "無名のルーム",
    shortDescription: normalizeRoomShortDescription(room.shortDescription),
    longDescription: normalizeRoomLongDescription(room.longDescription),
    accessType: normalizeAccessType(room.accessType),
    ownerEno: Number.isInteger(Number(room.ownerEno)) && Number(room.ownerEno) > 0
      ? Number(room.ownerEno)
      : null,
    showParentMainAreaPreview: Boolean(room.showParentMainAreaPreview),
    actionIds: Array.isArray(room.actionIds)
      ? room.actionIds.filter(actionId => typeof actionId === "string" && actionId.trim() !== "")
      : [],
    creationRequirements: Array.isArray(room.creationRequirements)
      ? room.creationRequirements
      : [],
    createdAt: typeof room.createdAt === "string" && room.createdAt ? room.createdAt : now,
    updatedAt: typeof room.updatedAt === "string" && room.updatedAt ? room.updatedAt : now
  };
}

function normalizeRoomName(value) {
  return typeof value === "string"
    ? value
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, ROOM_NAME_MAX_LENGTH)
    : "";
}

function normalizeRoomShortDescription(value) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, ROOM_SHORT_DESCRIPTION_MAX_LENGTH)
    : "";
}

function normalizeRoomLongDescription(value) {
  return typeof value === "string"
    ? value.trim().slice(0, ROOM_LONG_DESCRIPTION_MAX_LENGTH)
    : "";
}

function loadStoredRooms() {
  const parsed = safeParse(localStorage.getItem(ROOM_STORAGE_KEY), []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(normalizeRoom).filter(room => room.placeId && room.parentId);
}

function saveStoredRooms(rooms = []) {
  localStorage.setItem(
    ROOM_STORAGE_KEY,
    JSON.stringify(rooms.map(normalizeRoom))
  );
}

function syncStoredRoomsToPlaces() {
  loadStoredRooms().forEach(room => {
    const index = places.findIndex(place => place.placeId === room.placeId);

    if (index >= 0) {
      places[index] = room;
      return;
    }

    places.push(room);
  });
}

function generateRandomText(length = ROOM_ID_RANDOM_LENGTH) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, byte => chars[byte % chars.length]).join("");
}

function createRoomId() {
  let roomId = "";

  do {
    roomId = `${ROOM_ID_PREFIX}${generateRandomText()}`;
  } while (places.some(place => place.placeId === roomId));

  return roomId;
}

export function getRoomAccessLabel(accessType) {
  return ROOM_ACCESS_LABELS[accessType] ?? ROOM_ACCESS_LABELS.public;
}

export function isRoomPlace(place) {
  return place?.kind === "room";
}

export function isAreaPlace(place) {
  return place?.kind === "area" && place?.layer === "main";
}

export function isRoomOwner(place, eno) {
  const ownerEno = Number(place?.ownerEno || 0);
  const viewerEno = Number(eno || 0);

  return Number.isInteger(ownerEno) && ownerEno > 0 && ownerEno === viewerEno;
}

export function canShowRoomInPublicMapList(room) {
  return !isRoomPlace(room) || room.accessType === "public";
}

export function canAccessRoom(room, account = null) {
  if (!isRoomPlace(room)) {
    return { ok: true, reason: "not-room" };
  }

  const accessType = room.accessType === "password" ? "invite" : room.accessType;

  if (accessType === "public") {
    return { ok: true, reason: "public" };
  }

  if (!account?.eno) {
    return { ok: false, reason: "login-required" };
  }

  if (accessType === "private" && !isRoomOwner(room, account.eno)) {
    return { ok: false, reason: "private" };
  }

  return { ok: true, reason: accessType };
}

export function isInviteRoom(place) {
  return isRoomPlace(place) && ["invite", "password"].includes(place.accessType);
}

export function isInviteRoomPost(post) {
  const place = places.find(item => item.placeId === post?.placeId) || null;
  return isInviteRoom(place);
}

export function isInviteRoomReplyBlocked(post, currentPlace) {
  if (!isInviteRoomPost(post)) {
    return false;
  }

  const postPlaceId = typeof post?.placeId === "string" ? post.placeId : "";
  const currentPlaceId = typeof currentPlace?.placeId === "string" ? currentPlace.placeId : "";

  return postPlaceId !== "" && postPlaceId !== currentPlaceId;
}

export function isPrivateRoom(place) {
  return isRoomPlace(place) && place.accessType === "private";
}

export function getRoomsByParentAreaId(areaPlaceId) {
  return places.filter(place =>
    isRoomPlace(place) &&
    place.parentId === areaPlaceId
  );
}

export function getPublicRoomsByParentAreaId(areaPlaceId) {
  return getRoomsByParentAreaId(areaPlaceId)
    .filter(canShowRoomInPublicMapList);
}

export function getRoomsByOwnerEno(ownerEno) {
  const normalizedOwnerEno = Number(ownerEno || 0);

  if (!Number.isInteger(normalizedOwnerEno) || normalizedOwnerEno <= 0) {
    return [];
  }

  return places.filter(place =>
    isRoomPlace(place) &&
    Number(place.ownerEno || 0) === normalizedOwnerEno
  );
}

export function createRoom(input = {}) {
  const parentPlace = places.find(place => place.placeId === input.parentId) || null;

  if (!isAreaPlace(parentPlace)) {
    return {
      ok: false,
      message: "現在地ではルームを作成できません。エリアに移動してください。",
      room: null
    };
  }

  const ownerEno = Number(input.ownerEno || 0);
  if (!Number.isInteger(ownerEno) || ownerEno <= 0) {
    return { ok: false, message: "ログイン中のアカウント情報を確認できません", room: null };
  }

  const name = normalizeRoomName(input.name);
  if (!name) {
    return { ok: false, message: "ルーム名を入力してください", room: null };
  }

  const now = new Date().toISOString();
  const placeId = createRoomId();
  const shortDescription = normalizeRoomShortDescription(input.shortDescription ?? input.description);
  const longDescription = normalizeRoomLongDescription(input.longDescription ?? input.description);
  const room = normalizeRoom({
    placeId,
    groupId: placeId,
    zoneId: parentPlace.zoneId,
    parentId: parentPlace.placeId,
    name,
    shortDescription,
    longDescription,
    accessType: input.accessType,
    ownerEno,
    showParentMainAreaPreview: Boolean(input.showParentMainAreaPreview),
    actionIds: Array.isArray(input.actionIds) ? input.actionIds : [],
    creationRequirements: [],
    createdAt: now,
    updatedAt: now
  });

  const storedRooms = loadStoredRooms();
  storedRooms.push(room);
  saveStoredRooms(storedRooms);
  places.push(room);

  return { ok: true, message: "ルームを作成しました", room };
}

export function updateRoom(roomPlaceId, input = {}) {
  const room = places.find(place => place.placeId === roomPlaceId) || null;

  if (!isRoomPlace(room)) {
    return { ok: false, message: "ルームが見つかりません", room: null };
  }

  if (!isRoomOwner(room, input.ownerEno)) {
    return { ok: false, message: "このルームを編集できるのは作成者のみです", room };
  }

  const name = normalizeRoomName(input.name);
  if (!name) {
    return { ok: false, message: "ルーム名を入力してください", room };
  }

  const shortDescription = normalizeRoomShortDescription(input.shortDescription ?? input.description);
  const longDescription = normalizeRoomLongDescription(input.longDescription ?? input.description);
  const nextRoom = normalizeRoom({
    ...room,
    name,
    shortDescription,
    longDescription,
    accessType: input.accessType,
    showParentMainAreaPreview: Boolean(input.showParentMainAreaPreview),
    actionIds: Array.isArray(input.actionIds) ? input.actionIds : room.actionIds,
    updatedAt: new Date().toISOString()
  });

  const placeIndex = places.findIndex(place => place.placeId === nextRoom.placeId);
  if (placeIndex >= 0) {
    places[placeIndex] = nextRoom;
  }

  const storedRooms = loadStoredRooms();
  const storedIndex = storedRooms.findIndex(item => item.placeId === nextRoom.placeId);

  if (storedIndex >= 0) {
    storedRooms[storedIndex] = nextRoom;
  } else {
    storedRooms.push(nextRoom);
  }

  saveStoredRooms(storedRooms);

  return { ok: true, message: "ルーム情報を保存しました", room: nextRoom };
}

export function deleteRoom(roomPlaceId, input = {}) {
  const room = places.find(
    place => place.placeId === roomPlaceId
  ) || null;

  if (!isRoomPlace(room)) {
    return {
      ok: false,
      message: "ルームが見つかりません",
      room: null,
      parentPlaceId: null
    };
  }

  if (!isRoomOwner(room, input.ownerEno)) {
    return {
      ok: false,
      message: "このルームを削除できるのは作成者のみです",
      room,
      parentPlaceId: room.parentId || null
    };
  }

  const parentPlaceId = room.parentId || null;

  /*
   * localStorageから削除。
   */
  const storedRooms = loadStoredRooms()
    .filter(item => item.placeId !== roomPlaceId);

  saveStoredRooms(storedRooms);

  /*
   * 実行中のplaces配列からも削除。
   */
  const placeIndex = places.findIndex(
    place => place.placeId === roomPlaceId
  );

  if (placeIndex >= 0) {
    places.splice(placeIndex, 1);
  }

  return {
    ok: true,
    message: "ルームを削除しました",
    room,
    parentPlaceId
  };
}

syncStoredRoomsToPlaces();
