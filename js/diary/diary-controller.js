// diary-controller.js

import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "../common/rich-text-toolbar-ui.js";
import { getFavoriteCharacters } from "../services/character-favorite-service.js";
import { getCurrentAccount, loadCharacter, requireLogin } from "../services/storage-service.js";
import {
  CURRENT_DIARY_UPDATE_NO,
  getPublishedDiaryUpdateNos,
  loadDiaryDraft,
  loadPublishedDiary,
  publishDiaryDraft,
  saveDiaryDraft
} from "../services/diary-service.js";

requireLogin();

const titleInput = document.getElementById("diaryDraftTitle");
const bodyInput = document.getElementById("diaryDraftBody");
const toolbar = document.getElementById("diaryDraftToolbar");
const saveButton = document.getElementById("saveDiaryDraft");
const publishButton = document.getElementById("publishDiaryDraft");
const saveStatus = document.getElementById("diarySaveStatus");
const updateSelect = document.getElementById("diaryUpdateSelect");
const favoriteList = document.getElementById("diaryFavoriteList");

function getCurrentEno() {
  const eno = Number(getCurrentAccount()?.eno || 0);
  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

function getCharacterDisplayName(character = {}, eno = 0) {
  const fullName =
    typeof character?.fullName === "string"
      ? character.fullName.trim()
      : "";

  const defaultName =
    typeof character?.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  return fullName || defaultName || (eno ? `Eno.${eno}` : "不明なキャラ");
}

function formatSavedAt(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function setSaveStatus(text) {
  if (!saveStatus) return;
  saveStatus.textContent = text;
}

function setupToolbar() {
  if (!bodyInput || !toolbar) return;

  toolbar.appendChild(createRichTextToolbarButtons());
  bindRichTextToolbar(toolbar, bodyInput);
}

function loadDraftIntoForm() {
  if (!bodyInput) return;

  const eno = getCurrentEno();
  if (!eno) return;

  const draft = loadDiaryDraft(eno);

  if (titleInput) {
    titleInput.value = draft?.title ?? "";
  }

  bodyInput.value = draft?.body ?? "";

  if (draft?.updatedAt) {
    const savedAt = formatSavedAt(draft.updatedAt);
    setSaveStatus(savedAt ? `最終保存：${savedAt}` : "");
  }
}

function saveDraftFromForm() {
  if (!bodyInput) return null;

  const eno = getCurrentEno();
  if (!eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return null;
  }

  const draft = saveDiaryDraft(
    eno,
    titleInput?.value ?? "",
    bodyInput.value
  );

  const savedAt = formatSavedAt(draft.updatedAt);
  setSaveStatus(savedAt ? `保存しました：${savedAt}` : "保存しました");

  return draft;
}

function createPublishedDiaryEntry({ eno, name, diary, isCurrentUser = false }) {
  const entry = document.createElement("article");
  entry.className = "diaryPublishedEntry";

  if (isCurrentUser) {
    entry.classList.add("is-current-user");
  }

  const author = document.createElement("div");
  author.className = "diaryPublishedAuthor";

  const enoText = document.createElement("span");
  enoText.className = "diaryPublishedEno";
  enoText.textContent = `Eno.${eno}`;

  const nameText = document.createElement("span");
  nameText.className = "diaryPublishedName";
  nameText.textContent = name;

  author.appendChild(enoText);
  author.appendChild(nameText);

  const titleButton = document.createElement("button");
  titleButton.type = "button";
  titleButton.className = "button-link diaryPublishedTitle";
  titleButton.textContent = diary.title.trim() || "無題";
  titleButton.dataset.eno = String(eno);
  titleButton.dataset.updateNo = String(diary.updateNo);

  entry.appendChild(author);
  entry.appendChild(titleButton);

  return entry;
}

function getPublishedEntries(updateNo) {
  const currentEno = getCurrentEno();
  if (!currentEno) return [];

  const entries = [];

  const currentCharacter = loadCharacter(currentEno) || {};
  const currentDiary = loadPublishedDiary(updateNo, currentEno);

  if (currentDiary) {
    entries.push({
      eno: currentEno,
      name: getCharacterDisplayName(currentCharacter, currentEno),
      diary: currentDiary,
      isCurrentUser: true
    });
  }

  const favoriteCharacters = getFavoriteCharacters({ currentEno });

  favoriteCharacters.forEach(character => {
    const eno = Number(character?.eno || 0);
    if (!eno || eno === currentEno) return;

    const diary = loadPublishedDiary(updateNo, eno);
    if (!diary) return;

    entries.push({
      eno,
      name: character.name || getCharacterDisplayName(character, eno),
      diary,
      isCurrentUser: false
    });
  });

  return entries;
}

function renderFavoriteDiaryList(updateNo) {
  if (!favoriteList) return;

  favoriteList.innerHTML = "";

  const entries = getPublishedEntries(updateNo);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "diaryFavoritePlaceholder text-muted";
    empty.textContent = "この更新回に公開された日記はありません。";
    favoriteList.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    favoriteList.appendChild(createPublishedDiaryEntry(entry));
  });
}

function renderUpdateSelector(preferredUpdateNo = CURRENT_DIARY_UPDATE_NO) {
  if (!updateSelect) return;

  const updateNos = getPublishedDiaryUpdateNos();
  const selectedUpdateNo =
    updateNos.includes(Number(preferredUpdateNo))
      ? Number(preferredUpdateNo)
      : updateNos[0];

  updateSelect.innerHTML = "";

  updateNos.forEach(updateNo => {
    const option = document.createElement("option");
    option.value = String(updateNo);
    option.textContent = `第${updateNo}回`;
    option.selected = updateNo === selectedUpdateNo;
    updateSelect.appendChild(option);
  });

  renderFavoriteDiaryList(selectedUpdateNo);
}

function publishCurrentDraft() {
  const eno = getCurrentEno();
  if (!eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const draft = saveDraftFromForm();
  if (!draft) return;

  const publishedDiary =
    publishDiaryDraft(eno, CURRENT_DIARY_UPDATE_NO);

  if (!publishedDiary) {
    alert("公開する日記がありません");
    return;
  }

  const publishedAt = formatSavedAt(publishedDiary.publishedAt);
  setSaveStatus(
    publishedAt
      ? `第${CURRENT_DIARY_UPDATE_NO}回として公開しました：${publishedAt}`
      : `第${CURRENT_DIARY_UPDATE_NO}回として公開しました`
  );

  renderUpdateSelector(CURRENT_DIARY_UPDATE_NO);
}

saveButton?.addEventListener("click", saveDraftFromForm);
publishButton?.addEventListener("click", publishCurrentDraft);

updateSelect?.addEventListener("change", () => {
  renderFavoriteDiaryList(Number(updateSelect.value || CURRENT_DIARY_UPDATE_NO));
});

setupToolbar();
loadDraftIntoForm();
renderUpdateSelector();
