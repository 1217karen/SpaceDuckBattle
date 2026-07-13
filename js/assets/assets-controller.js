//assets-controller.js

import {requireLogin,getCurrentAccount,loadCharacter,loadUnit,saveCharacter,saveUnit} from "../services/storage-service.js";
import { getNoImageUrl } from "../common/icon-picker.js";

requireLogin();

function normalizeCommIcons(commIcons) {
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
    }));
}

function normalizeProfileImages(profileImages) {
  if (!Array.isArray(profileImages)) return [];

  return profileImages
    .map((item, index) => ({
      id:
        typeof item?.id === "number"
          ? item.id
          : index + 1,
      url:
        typeof item?.url === "string"
          ? item.url
          : "",
      enabled:
        typeof item?.enabled === "boolean"
          ? item.enabled
          : true
    }));
}

let draggedCommIconRow = null;

function bindCommIconDrag(row, dragHandle) {
  dragHandle.draggable = true;
  dragHandle.title = "ドラッグで並べ替え";

  dragHandle.addEventListener("dragstart", (e) => {
    draggedCommIconRow = row;
    row.classList.add("is-dragging");

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", row.dataset.id || "");
    }
  });

  dragHandle.addEventListener("dragend", () => {
    row.classList.remove("is-dragging");
    draggedCommIconRow = null;
  });

  row.addEventListener("dragover", (e) => {
    if (!draggedCommIconRow || draggedCommIconRow === row) return;

    e.preventDefault();

    const area =
      document.getElementById("commIconArea");

    if (!area) return;

    const rect =
      row.getBoundingClientRect();

    const insertAfter =
      e.clientY > rect.top + rect.height / 2;

    if (insertAfter) {
      area.insertBefore(draggedCommIconRow, row.nextSibling);
    } else {
      area.insertBefore(draggedCommIconRow, row);
    }
  });
}

function setIconInputAndPreview(inputId, previewId, value) {
  const input =
    document.getElementById(inputId);

  const preview =
    document.getElementById(previewId);

  if (!input || !preview) return;

  input.value = value ?? "";

  updateIconPreview(inputId, previewId);
}

function updateIconPreview(inputId, previewId) {
  const input =
    document.getElementById(inputId);

  const preview =
    document.getElementById(previewId);

  if (!input || !preview) return;

  preview.src =
    input.value.trim() !== ""
      ? input.value.trim()
      : getNoImageUrl();
}

function createProfileImageRow(item) {
  const row = document.createElement("div");
  row.className = "profileImageRow imageInputRow";
  row.dataset.id = String(item.id);

  const preview = document.createElement("img");
  preview.className = "profileImagePreview imageInputPreview imageInputPreview-large";
  preview.src =
    typeof item.url === "string" && item.url.trim() !== ""
      ? item.url.trim()
      : getNoImageUrl();
  preview.alt = `プロフィール画像${item.id}`;
  row.appendChild(preview);

  const inputArea = document.createElement("div");
  inputArea.className = "profileImageInputArea imageInputBody";

  const publicLabel = document.createElement("label");
  publicLabel.className = "profileImagePublicLabel imageInputMeta";

  const publicText = document.createElement("span");
  publicText.textContent = "公開する";

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.className = "profileImageEnabledInput";
  enabledInput.checked = item.enabled !== false;

  publicLabel.appendChild(publicText);
  publicLabel.appendChild(enabledInput);

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "profileImageUrlInput imageInputControl";
  urlInput.value = item.url ?? "";
  urlInput.placeholder = "プロフィール画像URL";

  urlInput.addEventListener("input", () => {
    preview.src =
      urlInput.value.trim() !== ""
        ? urlInput.value.trim()
        : getNoImageUrl();
  });

  inputArea.appendChild(publicLabel);
  inputArea.appendChild(urlInput);

  row.appendChild(inputArea);

  return row;
}

function renderProfileImageArea(profileImages) {
  const area =
    document.getElementById("profileImageArea");

  area.innerHTML = "";

  profileImages.forEach(item => {
    area.appendChild(createProfileImageRow(item));
  });
}

function readProfileImageArea() {
  const rows =
    document.querySelectorAll(".profileImageRow");

  return [...rows]
    .map(row => {
      const id =
        Number(row.dataset.id);

      const url =
        row.querySelector(".profileImageUrlInput")?.value ?? "";

      const enabled =
        row.querySelector(".profileImageEnabledInput")?.checked ?? true;

      return {
        id,
        url,
        enabled
      };
    })
    .filter(item => item.url.trim() !== "");
}

function getNextRowId(selector) {
  const rows =
    document.querySelectorAll(selector);

  const ids =
    [...rows]
      .map(row => Number(row.dataset.id))
      .filter(id => Number.isFinite(id) && id > 0);

  return ids.length > 0
    ? Math.max(...ids) + 1
    : 1;
}

function createCommIconRow(item) {
  const row = document.createElement("div");
  row.className = "commIconRow imageInputRow";
  row.dataset.id = String(item.id);

  const preview = document.createElement("img");
  preview.className = "commIconPreview imageInputPreview";
  preview.src =
    typeof item.url === "string" && item.url.trim() !== ""
      ? item.url.trim()
      : getNoImageUrl();
  preview.alt = `アイコン${item.id}`;
  row.appendChild(preview);

  bindCommIconDrag(row, preview);

  const inputArea = document.createElement("div");
  inputArea.className = "imageInputBody";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "commIconNameInput imageInputControl";
  nameInput.value = item.name ?? "";
  nameInput.placeholder = "発言者名（未入力時はニックネーム）";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "commIconUrlInput imageInputControl";
  urlInput.value = item.url ?? "";
  urlInput.placeholder = "アイコンURL";

  urlInput.addEventListener("input", () => {
    preview.src =
      urlInput.value.trim() !== ""
        ? urlInput.value.trim()
        : getNoImageUrl();
  });

  inputArea.appendChild(nameInput);
  inputArea.appendChild(urlInput);

  row.appendChild(inputArea);

  return row;
}

function renderCommIconArea(commIcons) {
  const area =
    document.getElementById("commIconArea");

  area.innerHTML = "";

  commIcons.forEach(item => {
    area.appendChild(createCommIconRow(item));
  });
}

function readCommIconArea() {
  const rows =
    document.querySelectorAll(".commIconRow");

  return [...rows]
    .map(row => {
      const id =
        Number(row.dataset.id);

      const url =
        row.querySelector(".commIconUrlInput")?.value ?? "";

      const name =
        row.querySelector(".commIconNameInput")?.value ?? "";

      return {
        id,
        url,
        name
      };
    })
    .filter(item => item.url.trim() !== "");
}

function readBulkCommIconUrls() {
  const textarea =
    document.getElementById("bulkCommIconUrls");

  if (!textarea) return [];

  return textarea.value
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(url => url !== "");
}

function appendBulkCommIcons(commIcons, urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return commIcons;
  }

  let nextId =
    getNextRowId(".commIconRow");

  const addedIcons =
    urls.map(url => {
      const icon = {
        id: nextId,
        url,
        name: ""
      };

      nextId += 1;

      return icon;
    });

  return [
    ...commIcons,
    ...addedIcons
  ];
}

function loadManagement() {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  const unit =
    loadUnit(eno, 1);

  const character =
    loadCharacter(eno);

  const profileImages =
    normalizeProfileImages(character?.profileImages);

  renderProfileImageArea(profileImages);

  setIconInputAndPreview(
    "characterDefaultIcon",
    "characterDefaultIconPreview",
    character?.defaultIcon ?? ""
  );

  setIconInputAndPreview(
    "iconDefault",
    "iconDefaultPreview",
    unit?.icon?.default ?? ""
  );

  setIconInputAndPreview(
    "iconN",
    "iconNPreview",
    unit?.icon?.N ?? ""
  );

  setIconInputAndPreview(
    "iconE",
    "iconEPreview",
    unit?.icon?.E ?? ""
  );

  setIconInputAndPreview(
    "iconS",
    "iconSPreview",
    unit?.icon?.S ?? ""
  );

  setIconInputAndPreview(
    "iconW",
    "iconWPreview",
    unit?.icon?.W ?? ""
  );

  const commIcons =
    normalizeCommIcons(character?.commIcons);

  renderCommIconArea(commIcons);
}

document.getElementById("iconDefault")
  .addEventListener("input", () => {
    updateIconPreview("iconDefault", "iconDefaultPreview");
  });

["N", "E", "S", "W"].forEach(direction => {
  const inputId =
    `icon${direction}`;

  const previewId =
    `icon${direction}Preview`;

  document.getElementById(inputId)
    .addEventListener("input", () => {
      updateIconPreview(inputId, previewId);
    });
});

document.getElementById("characterDefaultIcon")
  .addEventListener("input", () => {
    updateIconPreview(
      "characterDefaultIcon",
      "characterDefaultIconPreview"
    );
  });

document.getElementById("addProfileImage")
  .addEventListener("click", () => {
    const current =
      normalizeProfileImages(
        [...document.querySelectorAll(".profileImageRow")]
          .map(row => ({
            id: Number(row.dataset.id),
            url: row.querySelector(".profileImageUrlInput")?.value ?? "",
            enabled: row.querySelector(".profileImageEnabledInput")?.checked ?? true
          }))
      );

    const nextId =
      getNextRowId(".profileImageRow");

    current.push({
      id: nextId,
      url: "",
      enabled: true
    });

    renderProfileImageArea(current);
  });

document.getElementById("addCommIcon")
  .addEventListener("click", () => {
    const current =
      normalizeCommIcons(
        [...document.querySelectorAll(".commIconRow")]
          .map(row => ({
            id: Number(row.dataset.id),
            url: row.querySelector(".commIconUrlInput")?.value ?? "",
            name: row.querySelector(".commIconNameInput")?.value ?? ""
          }))
      );

    const nextId =
      getNextRowId(".commIconRow");

    current.push({
      id: nextId,
      url: "",
      name: ""
    });

    renderCommIconArea(current);
  });

const saveBtn =
  document.getElementById("saveManagement");

saveBtn.addEventListener("click", () => {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  const oldUnit =
    loadUnit(eno, 1) || {};

  const oldCharacter =
    loadCharacter(eno) || {};

  const icon = {
    default: document.getElementById("iconDefault").value,
    N: document.getElementById("iconN").value,
    E: document.getElementById("iconE").value,
    S: document.getElementById("iconS").value,
    W: document.getElementById("iconW").value
  };

  const hasDefaultIcon =
    icon.default.trim() !== "";

  const hasDirectionIcon =
    icon.N.trim() !== "" ||
    icon.E.trim() !== "" ||
    icon.S.trim() !== "" ||
    icon.W.trim() !== "";

  if (
    !hasDefaultIcon &&
    hasDirectionIcon &&
    !confirm(
      "方向アイコンが設定されていますが、アヒルのデフォルトアイコンが未設定です。\n" +
      "未設定の向きでは No img が表示されます。\n" +
      "このまま保存してよろしいですか？"
    )
  ) {
    return;
  }

  const profileImages =
    readProfileImageArea();

  const commIcons =
    appendBulkCommIcons(
      readCommIconArea(),
      readBulkCommIconUrls()
    );

  const unit = {
    ...oldUnit,
    eno,
    unitNo: oldUnit.unitNo ?? 1,
    id: oldUnit.id ?? "player_unit",
    icon
  };

  const character = {
    ...oldCharacter,
    eno,
    profileImages,
    defaultIcon: document.getElementById("characterDefaultIcon").value,
    commIcons
  };

  saveUnit(eno, 1, unit);
  saveCharacter(eno, character);

  alert("アイコン設定を保存しました");
  window.location.reload();
});

loadManagement();
