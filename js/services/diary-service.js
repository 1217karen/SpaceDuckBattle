// diary-service.js

import { makeAccountStorageKey, normalizeAccountEno } from "./account-storage-key.js";

const DIARY_DRAFT_STORAGE_PREFIX = "diaryDraft";

function getDraftStorageKey(eno) {
  return makeAccountStorageKey(DIARY_DRAFT_STORAGE_PREFIX, eno);
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function loadDiaryDraft(eno) {
  const normalizedEno = normalizeAccountEno(eno);
  if (!normalizedEno) return null;

  const key = getDraftStorageKey(normalizedEno);
  if (!key) return null;

  const stored = safeParse(localStorage.getItem(key), null);
  if (!stored || typeof stored !== "object") return null;

  return {
    eno: normalizedEno,
    body: typeof stored.body === "string" ? stored.body : "",
    status: "draft",
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : ""
  };
}

export function saveDiaryDraft(eno, body) {
  const normalizedEno = normalizeAccountEno(eno);
  if (!normalizedEno) {
    throw new Error("日記下書きの保存には eno が必要です");
  }

  const key = getDraftStorageKey(normalizedEno);
  if (!key) {
    throw new Error("日記下書きの保存先を作成できません");
  }

  const draft = {
    eno: normalizedEno,
    body: typeof body === "string" ? body : "",
    status: "draft",
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(draft));
  return draft;
}
