// diary-controller.js

import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "../common/rich-text-toolbar-ui.js";
import { getCurrentAccount, requireLogin } from "../services/storage-service.js";
import { loadDiaryDraft, saveDiaryDraft } from "../services/diary-service.js";

requireLogin();

const bodyInput = document.getElementById("diaryDraftBody");
const toolbar = document.getElementById("diaryDraftToolbar");
const saveButton = document.getElementById("saveDiaryDraft");
const saveStatus = document.getElementById("diarySaveStatus");

function getCurrentEno() {
  const eno = Number(getCurrentAccount()?.eno || 0);
  return Number.isInteger(eno) && eno > 0 ? eno : null;
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
  bodyInput.value = draft?.body ?? "";

  if (draft?.updatedAt) {
    const savedAt = formatSavedAt(draft.updatedAt);
    setSaveStatus(savedAt ? `最終保存：${savedAt}` : "");
  }
}

function saveDraftFromForm() {
  if (!bodyInput) return;

  const eno = getCurrentEno();
  if (!eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const draft = saveDiaryDraft(eno, bodyInput.value);
  const savedAt = formatSavedAt(draft.updatedAt);
  setSaveStatus(savedAt ? `保存しました：${savedAt}` : "保存しました");
}

saveButton?.addEventListener("click", saveDraftFromForm);

setupToolbar();
loadDraftIntoForm();
