//center-topbar.js

import { formatNoticeDate,getLatestNotice,getNoticeCategoryLabel } from "../services/notice-service.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function initCenterTopbar() {
  const topbar = document.querySelector(".center-topbar");

  if (!topbar) {
    return;
  }

  const leftLabel = topbar.dataset.leftLabel || "＜ MENU";
  const rightLabel = topbar.dataset.rightLabel || "";

  topbar.innerHTML = `
    <div class="center-topbar-left">
      <button
        type="button"
        class="panel-toggle-button left-panel-toggle button-topbar-link"
      >${escapeHtml(leftLabel)}</button>
    </div>

    <div class="center-topbar-center"></div>

    <div class="center-topbar-right">
      ${
        rightLabel
          ? `<button
              type="button"
              class="panel-toggle-button right-panel-toggle button-topbar-link"
            >${escapeHtml(rightLabel)}</button>`
          : ""
      }
    </div>
  `;
  const noticeArea = topbar.querySelector(".center-topbar-center");
  const latestNotice = getLatestNotice();

  if (!noticeArea) return;

  if (!latestNotice) {
    noticeArea.textContent = topbar.dataset.notice || "お知らせはありません";
    return;
  }

  const noticeLink = document.createElement("a");
  noticeLink.className = "center-topbar-notice-link";
  noticeLink.href = `./notice.html#${encodeURIComponent(latestNotice.id)}`;
  noticeLink.textContent = [
    formatNoticeDate(latestNotice.publishedAt, { short: true }),
    `【${getNoticeCategoryLabel(latestNotice.category)}】`,
    latestNotice.title
  ].filter(Boolean).join(" ");
  noticeLink.title = noticeLink.textContent;

  noticeArea.appendChild(noticeLink);
}
