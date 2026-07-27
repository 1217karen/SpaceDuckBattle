// notice-service.js

import { NOTICE_CATEGORIES, NOTICES } from "../data/notices-data.js";

function comparePublishedAtDescending(a, b) {
  return String(b?.publishedAt ?? "").localeCompare(
    String(a?.publishedAt ?? "")
  );
}

export function getNotices() {
  return NOTICES.slice().sort(comparePublishedAtDescending);
}

export function getNoticeById(noticeId) {
  if (!noticeId) return null;

  return NOTICES.find(notice => notice.id === noticeId) || null;
}

export function getLatestNotice() {
  return getNotices()[0] || null;
}

export function getNoticeCategoryLabel(category) {
  return NOTICE_CATEGORIES[category] || "お知らせ";
}

export function formatNoticeDate(publishedAt, { short = false } = {}) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(publishedAt ?? "")
  );

  if (!matched) return "";

  const [, year, month, day] = matched;
  return short ? `${month}/${day}` : `${year}/${month}/${day}`;
}
