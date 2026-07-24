// chat-pagination-state.js

import { makeAccountStorageKey } from "../services/account-storage-key.js";

const CHAT_PAGE_SIZE_STORAGE_KEY = "chatPageSize";

export const CHAT_PAGE_SIZE_MIN = 10;
export const CHAT_PAGE_SIZE_MAX = 100;
export const CHAT_PAGE_SIZE_DEFAULT = 30;

function toInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.trunc(number);
}

export function normalizeChatPageSize(value, fallback = CHAT_PAGE_SIZE_DEFAULT) {
  const fallbackNumber = toInteger(fallback) ?? CHAT_PAGE_SIZE_DEFAULT;
  const number = toInteger(value) ?? fallbackNumber;

  if (number < CHAT_PAGE_SIZE_MIN) {
    return CHAT_PAGE_SIZE_MIN;
  }

  if (number > CHAT_PAGE_SIZE_MAX) {
    return CHAT_PAGE_SIZE_MAX;
  }

  return number;
}

export function loadChatPageSize() {
  const storageKey = makeAccountStorageKey(CHAT_PAGE_SIZE_STORAGE_KEY);

  if (!storageKey) {
    return CHAT_PAGE_SIZE_DEFAULT;
  }

  return normalizeChatPageSize(
    localStorage.getItem(storageKey),
    CHAT_PAGE_SIZE_DEFAULT
  );
}

export function saveChatPageSize(value) {
  const pageSize = normalizeChatPageSize(value);
  const storageKey = makeAccountStorageKey(CHAT_PAGE_SIZE_STORAGE_KEY);

  if (storageKey) {
    localStorage.setItem(storageKey, String(pageSize));
  }

  return pageSize;
}


export function getPaginationState(posts = [], requestedPage = 1, pageSize = CHAT_PAGE_SIZE_DEFAULT) {
  const totalItems = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex: startIndex + pageSize
  };
}

export function getPagedPosts(posts = [], pagination = {}) {
  return posts.slice(pagination.startIndex, pagination.endIndex);
}
