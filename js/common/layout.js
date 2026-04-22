//layout.js

function updatePanelCollapseState() {
  const layout = document.querySelector(".layout");
  if (!layout) return;

  const rightCollapsed = window.innerWidth <= 1140;
  const leftCollapsed = window.innerWidth <= 840;

  layout.classList.toggle("panel-right-collapsed", rightCollapsed);
  layout.classList.toggle("panel-left-collapsed", leftCollapsed);

  const leftPanel = document.querySelector(".left-panel");
  const rightPanel = document.querySelector(".right-panel");

  if (!rightCollapsed) {
    rightPanel?.classList.remove("open");
  }

  if (!leftCollapsed) {
    leftPanel?.classList.remove("open");
  }
}

function closeLeftPanel() {
  const panel = document.querySelector(".left-panel");
  panel?.classList.remove("open");
}

function closeRightPanel() {
  const panel = document.querySelector(".right-panel");
  panel?.classList.remove("open");
}

export function toggleLeftPanel() {
  const layout = document.querySelector(".layout");
  const panel = document.querySelector(".left-panel");

  if (!layout || !panel) return;
  if (!layout.classList.contains("panel-left-collapsed")) return;

  const willOpen = !panel.classList.contains("open");

  closeRightPanel();

  if (willOpen) {
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }
}

export function toggleRightPanel() {
  const layout = document.querySelector(".layout");
  const panel = document.querySelector(".right-panel");

  if (!layout || !panel) return;
  if (!layout.classList.contains("panel-right-collapsed")) return;

  const willOpen = !panel.classList.contains("open");

  closeLeftPanel();

  if (willOpen) {
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }
}

function handleOutsideClick(event) {
  const leftPanel = document.querySelector(".left-panel");
  const rightPanel = document.querySelector(".right-panel");
  const leftButton = document.querySelector(".left-panel-toggle");
  const rightButton = document.querySelector(".right-panel-toggle");

  const target = event.target;

  const clickedInsideLeftPanel =
    leftPanel?.classList.contains("open") &&
    leftPanel.contains(target);

  const clickedInsideRightPanel =
    rightPanel?.classList.contains("open") &&
    rightPanel.contains(target);

  const clickedLeftButton =
    leftButton && leftButton.contains(target);

  const clickedRightButton =
    rightButton && rightButton.contains(target);

  if (
    clickedInsideLeftPanel ||
    clickedInsideRightPanel ||
    clickedLeftButton ||
    clickedRightButton
  ) {
    return;
  }

  closeLeftPanel();
  closeRightPanel();
}

export function initLayoutPanelToggles() {
  const leftButton = document.querySelector(".left-panel-toggle");
  const rightButton = document.querySelector(".right-panel-toggle");

  leftButton?.addEventListener("click", toggleLeftPanel);
  rightButton?.addEventListener("click", toggleRightPanel);

  document.addEventListener("click", handleOutsideClick);
  window.addEventListener("resize", updatePanelCollapseState);

  updatePanelCollapseState();
}
