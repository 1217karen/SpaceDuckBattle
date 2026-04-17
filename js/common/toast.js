//toast.js

let toastContainer = null;

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

  return toastContainer;
}

export function showToast(message, options = {}) {
  const {
    type = "info",
    duration = 2200
  } = options;

  const container = getToastContainer();

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
