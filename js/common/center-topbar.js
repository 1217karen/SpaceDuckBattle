//center-topbar.js


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

  const noticeText = topbar.dataset.notice || "お知らせエリア";
  const leftLabel = topbar.dataset.leftLabel || "＜ MENU";
  const rightLabel = topbar.dataset.rightLabel || "";

  topbar.innerHTML = `
    <div class="center-topbar-left">
      <button
        type="button"
        class="panel-toggle-button left-panel-toggle button-topbar-link"
      >${escapeHtml(leftLabel)}</button>
    </div>

    <div class="center-topbar-center">${escapeHtml(noticeText)}</div>

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
}
