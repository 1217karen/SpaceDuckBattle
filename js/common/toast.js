//toast.js

let toastContainer = null;

function updateToastContainerPosition(container) {
  if (!container) {
    return;
  }

  const centerPanel = document.querySelector(".center-panel");

  if (!centerPanel) {
    container.style.left = "50%";
    container.style.width = "min(92vw, 420px)";
    return;
  }

  const rect = centerPanel.getBoundingClientRect();
  const panelCenterX = rect.left + (rect.width / 2);

  container.style.left = `${panelCenterX}px`;
  container.style.width = `${Math.min(rect.width, 420)}px`;
}

function getToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  const existing = document.querySelector(".commonToastContainer");
  if (existing) {
    toastContainer = existing;
    return toastContainer;
  }

  toastContainer = document.createElement("div");
  toastContainer.className = "commonToastContainer";
  document.body.appendChild(toastContainer);

  updateToastContainerPosition(toastContainer);

  window.addEventListener("resize", () => {
    updateToastContainerPosition(toastContainer);
  });

  return toastContainer;
}

export function showToast(message, options = {}) {
  const {
    type = "info",
    duration = 2200
  } = options;

  const container = getToastContainer();
  updateToastContainerPosition(container);

  const toast = document.createElement("div");
  toast.className = `commonToast commonToast-${type}`;
  toast.textContent =
    typeof message === "string" && message.trim() !== ""
      ? message
      : "";

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.classList.add("is-hiding");

    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, duration);
}
