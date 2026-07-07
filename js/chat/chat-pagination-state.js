// chat-pagination-state.js

const CHAT_PAGE_SIZE_STORAGE_KEY = "chatPageSize";

export const CHAT_PAGE_SIZE_MIN = 10;
export const CHAT_PAGE_SIZE_MAX = 100;
export const CHAT_PAGE_SIZE_DEFAULT = 30;

function toInteger(value) {
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
  return normalizeChatPageSize(
    localStorage.getItem(CHAT_PAGE_SIZE_STORAGE_KEY),
    CHAT_PAGE_SIZE_DEFAULT
  );
}

export function saveChatPageSize(value) {
  const pageSize = normalizeChatPageSize(value);
  localStorage.setItem(CHAT_PAGE_SIZE_STORAGE_KEY, String(pageSize));
  return pageSize;
}
