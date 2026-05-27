//assets-controller.js

import {requireLogin,getCurrentAccount,loadCharacter,loadUnit,saveCharacter,saveUnit} from "../services/storage-service.js";
import { getNoImageUrl } from "../common/icon-picker.js";
requireLogin()

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

function createProfileImageRow(item) {
  const row = document.createElement("div");
  row.className = "profileImageRow";
  row.dataset.id = String(item.id);

  const enabledInput = document.createElement("input");
  enabledInput.type = "checkbox";
  enabledInput.className = "profileImageEnabledInput";
  enabledInput.checked = item.enabled !== false;
  row.appendChild(enabledInput);

  const label = document.createElement("span");
  label.textContent = ` ID ${item.id} `;
  row.appendChild(label);

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "profileImageUrlInput";
  urlInput.value = item.url ?? "";
  urlInput.placeholder = "プロフィール画像URL";
  row.appendChild(urlInput);

  return row;
}

function renderProfileImageArea(profileImages) {
  const area =
    document.getElementById("profileImageArea");

  area.innerHTML = "";

  profileImages.forEach(item => {
    area.appendChild(createProfileImageRow(item));
    area.appendChild(document.createElement("br"));
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

function createCommIconRow(item) {
  const row = document.createElement("div");
  row.className = "commIconRow";
  row.dataset.id = String(item.id);

  const preview = document.createElement("img");
  preview.className = "commIconPreview";
  preview.src =
    typeof item.url === "string" && item.url.trim() !== ""
      ? item.url.trim()
      : getNoImageUrl();
  preview.alt = `アイコン${item.id}`;
  row.appendChild(preview);

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "commIconUrlInput";
  urlInput.value = item.url ?? "";
  urlInput.placeholder = "アイコンURL";

  urlInput.addEventListener("input", () => {
    preview.src =
      urlInput.value.trim() !== ""
        ? urlInput.value.trim()
        : getNoImageUrl();
  });

  row.appendChild(urlInput);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "commIconNameInput";
  nameInput.value = item.name ?? "";
  nameInput.placeholder = "発言者名（未入力ならデフォルト名）";
  row.appendChild(nameInput);

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

  document.getElementById("characterDefaultIcon").value =
    character?.defaultIcon ?? "";

  document.getElementById("iconDefault").value =
    unit?.icon?.default ?? "";

  document.getElementById("iconN").value =
    unit?.icon?.N ?? "";

  document.getElementById("iconE").value =
    unit?.icon?.E ?? "";

  document.getElementById("iconS").value =
    unit?.icon?.S ?? "";

  document.getElementById("iconW").value =
    unit?.icon?.W ?? "";

  const commIcons =
    normalizeCommIcons(character?.commIcons);

  renderCommIconArea(commIcons);
}

document.getElementById("addProfileImage")
  .addEventListener("click", () => {
    const current =
      readProfileImageArea();

    const nextId =
      current.length > 0
        ? Math.max(...current.map(x => x.id)) + 1
        : 1;

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
      readCommIconArea();

    const nextId =
      current.length > 0
        ? Math.max(...current.map(x => x.id)) + 1
        : 1;

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

  const profileImages =
    readProfileImageArea();

  const commIcons =
    readCommIconArea();

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
});

loadManagement();
