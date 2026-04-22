//layout.js

function updatePanelCollapseState() {
  const layout = document.querySelector(".layout");
  if (!layout) return;

  const rightCollapsed = window.innerWidth <= 1140;
  const leftCollapsed = window.innerWidth <= 840;

  layout.classList.toggle("panel-right-collapsed", rightCollapsed);
  layout.classList.toggle("panel-left-collapsed", leftCollapsed);

  if (!rightCollapsed) {
    const rightPanel = document.querySelector(".right-panel");
    rightPanel?.classList.remove("open");
  }

  if (!leftCollapsed) {
    const leftPanel = document.querySelector(".left-panel");
    leftPanel?.classList.remove("open");
  }
}

export function toggleLeftPanel() {
  const layout = document.querySelector(".layout");
  const panel = document.querySelector(".left-panel");

  if (!layout || !panel) return;
  if (!layout.classList.contains("panel-left-collapsed")) return;

  panel.classList.toggle("open");
}

export function toggleRightPanel() {
  const layout = document.querySelector(".layout");
  const panel = document.querySelector(".right-panel");

  if (!layout || !panel) return;
  if (!layout.classList.contains("panel-right-collapsed")) return;

  panel.classList.toggle("open");
}

export function initLayoutPanelToggles() {
  const leftButton = document.querySelector(".left-panel-toggle");
  const rightButton = document.querySelector(".right-panel-toggle");

  leftButton?.addEventListener("click", toggleLeftPanel);
  rightButton?.addEventListener("click", toggleRightPanel);

  updatePanelCollapseState();
  window.addEventListener("resize", updatePanelCollapseState);
}
