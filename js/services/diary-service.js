// diary-service.js

import { makeAccountStorageKey, normalizeAccountEno } from "./account-storage-key.js";

const DIARY_DRAFT_STORAGE_PREFIX = "diaryDraft";
const DIARY_PUBLISHED_STORAGE_PREFIX = "diaryPublished";

export const CURRENT_DIARY_UPDATE_NO = 1;

function getDraftStorageKey(eno) {
  return makeAccountStorageKey(DIARY_DRAFT_STORAGE_PREFIX, eno);
}

function normalizeUpdateNo(value) {
  const updateNo = Number(value || 0);
  return Number.isInteger(updateNo) && updateNo > 0 ? updateNo : null;
}

function getPublishedStorageKey(updateNo, eno) {
  const normalizedUpdateNo = normalizeUpdateNo(updateNo);
  const normalizedEno = normalizeAccountEno(eno);

  if (!normalizedUpdateNo || !normalizedEno) {
    return null;
  }

  return `${DIARY_PUBLISHED_STORAGE_PREFIX}:${normalizedUpdateNo}:${normalizedEno}`;
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
    title: typeof stored.title === "string" ? stored.title : "",
    body: typeof stored.body === "string" ? stored.body : "",
    status: "draft",
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : ""
  };
}

export function saveDiaryDraft(eno, title, body) {
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
    title: typeof title === "string" ? title.slice(0, 40) : "",
    body: typeof body === "string" ? body : "",
    status: "draft",
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(draft));
  return draft;
}

export function loadPublishedDiary(updateNo, eno) {
  const normalizedUpdateNo = normalizeUpdateNo(updateNo);
  const normalizedEno = normalizeAccountEno(eno);
  const key = getPublishedStorageKey(normalizedUpdateNo, normalizedEno);

  if (!key) return null;

  const stored = safeParse(localStorage.getItem(key), null);
  if (!stored || typeof stored !== "object") return null;

  return {
    updateNo: normalizedUpdateNo,
    eno: normalizedEno,
    title: typeof stored.title === "string" ? stored.title : "",
    body: typeof stored.body === "string" ? stored.body : "",
    status: "published",
    publishedAt: typeof stored.publishedAt === "string" ? stored.publishedAt : ""
  };
}

export function publishDiaryDraft(eno, updateNo = CURRENT_DIARY_UPDATE_NO) {
  const normalizedEno = normalizeAccountEno(eno);
  const normalizedUpdateNo = normalizeUpdateNo(updateNo);

  if (!normalizedEno || !normalizedUpdateNo) {
    throw new Error("日記公開には eno と更新回が必要です");
  }

  const draft = loadDiaryDraft(normalizedEno);

  if (!draft || (!draft.title.trim() && !draft.body.trim())) {
    return null;
  }

  const publishedDiary = {
    updateNo: normalizedUpdateNo,
    eno: normalizedEno,
    title: draft.title.slice(0, 40),
    body: draft.body,
    status: "published",
    publishedAt: new Date().toISOString()
  };

  const key = getPublishedStorageKey(normalizedUpdateNo, normalizedEno);
  localStorage.setItem(key, JSON.stringify(publishedDiary));

  return publishedDiary;
}

export function getPublishedDiaryUpdateNos() {
  const updateNos = new Set([CURRENT_DIARY_UPDATE_NO]);
  const prefix = `${DIARY_PUBLISHED_STORAGE_PREFIX}:`;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(prefix)) {
      continue;
    }

    const [, updateNoText] = key.split(":");
    const updateNo = normalizeUpdateNo(updateNoText);

    if (updateNo) {
      updateNos.add(updateNo);
    }
  }

  return [...updateNos].sort((a, b) => b - a);
}
