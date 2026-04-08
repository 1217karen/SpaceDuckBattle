//icon-picker.js

export function getNoImageUrl() {
  return "https://placehold.co/60x60?text=NO+IMG";
}

export function normalizeCommIcons(commIcons) {
  if (!Array.isArray(commIcons)) return [];

  return commIcons
    .map((item, index) => ({
      id:
        typeof item?.id === "number"
          ? item.id
          : index + 1,
      url:
        typeof item?.url === "string"
          ? item.url
          : "",
      name:
        typeof item?.name === "string"
          ? item.name
          : ""
    }))
    .filter(item => item.url.trim() !== "");
}

export function setButtonPreview(button, iconId, iconUrl) {
  if (!button) return;

  const safeId =
    typeof iconId === "number" && iconId > 0
      ? iconId
      : null;

  const safeUrl =
    typeof iconUrl === "string" && iconUrl.trim() !== ""
      ? iconUrl
      : "";

  button.dataset.selectedId =
    safeId ? String(safeId) : "";

  button.dataset.selectedUrl =
    safeUrl;

  const img = button.querySelector("img");
  if (img) {
    img.src = safeUrl || getNoImageUrl();
  }

    button.dispatchEvent(new CustomEvent("iconchange", {
    detail: {
      iconId: safeId,
      iconUrl: safeUrl
    }
  }));
  
}

export function createIconPicker({
  modalId = "iconPickerModal",
  listId = "iconPickerList",
  closeId = "iconPickerClose"
} = {}) {
  const modal = document.getElementById(modalId);
  const list = document.getElementById(listId);
  const closeBtn = document.getElementById(closeId);

  let currentButton = null;
  let currentIcons = [];

  function createIconCard(item) {
    const card = document.createElement("div");
    card.className = "iconPickerCard";
    card.dataset.id = String(item.id);
    card.dataset.url = item.url;

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = `icon ${item.id}`;

    const label = document.createElement("div");
    label.className = "iconPickerCardId";
    label.textContent = `ID ${item.id}`;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener("click", () => {
      if (!currentButton) return;

      setButtonPreview(
        currentButton,
        item.id,
        item.url
      );

      close();
    });

    return card;
  }

  function render() {
    if (!list) return;

    list.innerHTML = "";

    if (currentIcons.length === 0) {
      const empty = document.createElement("div");
      empty.className = "iconPickerEmpty";
      empty.textContent =
        "assets に登録されたキャラアイコンがありません";
      list.appendChild(empty);
      return;
    }

    currentIcons.forEach(item => {
      list.appendChild(createIconCard(item));
    });
  }

  function open(button, icons = []) {
    currentButton = button || null;
    currentIcons = Array.isArray(icons) ? icons : [];

    render();

    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  function close() {
    if (modal) {
      modal.classList.add("hidden");
    }

    currentButton = null;
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", close);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        close();
      }
    });
  }

  return {
    open,
    close
  };
}
