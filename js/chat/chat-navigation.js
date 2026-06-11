import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { getPlaceLabel } from "./chat-place-utils.js";

export function buildChatPlaceUrl(placeId) {
  return `./chat.html?placeId=${encodeURIComponent(placeId)}`;
}

export function navigateToChatPlace(placeId) {
  if (!placeId) {
    return;
  }

  window.location.href = buildChatPlaceUrl(placeId);
}

export function moveToChatPlace(placeId, options = {}) {
  const {
    onBeforeMove = null
  } = options;

  if (!placeId) {
    return false;
  }

  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return false;
  }

  const eno = account.eno;
  const character = loadCharacter(eno) || {};

  if (typeof onBeforeMove === "function") {
    onBeforeMove();
  }

  saveCharacter(eno, {
    ...character,
    currentPlaceId: placeId
  });

  const placeLabel = getPlaceLabel(placeId);

  sessionStorage.setItem(
    "chatToastMessage",
    JSON.stringify({
      message: `${placeLabel}に移動しました`,
      type: "info"
    })
  );

  navigateToChatPlace(placeId);

  return true;
}

export function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}
