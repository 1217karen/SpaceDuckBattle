//assets-controller.js

import {getCurrentAccount,loadCharacter,loadUnit,saveCharacter,saveUnit} from "./storage-service.js";

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

function createCommIconRow(item) {
  const row = document.createElement("div");
  row.className = "commIconRow";
  row.dataset.id = String(item.id);

  const label = document.createElement("span");
  label.textContent = `ID ${item.id} `;
  row.appendChild(label);

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "commIconUrlInput";
  urlInput.value = item.url ?? "";
  urlInput.placeholder = "アイコンURL";
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
    area.appendChild(document.createElement("br"));
  });
}

function readCommIconArea() {
  const rows =
    document.querySelectorAll(".commIconRow");

  return [...rows].map(row => {
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
  });
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
    defaultIcon: document.getElementById("characterDefaultIcon").value,
    commIcons
  };

  saveUnit(eno, 1, unit);
  saveCharacter(eno, character);

  alert("アイコン設定を保存しました");
});

loadManagement();
