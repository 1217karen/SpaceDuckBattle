//character-controller.js

function getNoImageUrl() {
  return "https://placehold.co/60x60?text=NO+IMG";
}

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
          : ""
    }))
    .filter(item => item.url.trim() !== "");
}

let currentPickerTarget = null;
let currentCommIcons = [];

function setPreview(target, iconId, iconUrl) {
  const preview =
    document.getElementById(`${target}IconPreview`);

  const button =
    document.getElementById(`${target}IconButton`);

  if (!preview || !button) return;

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

  preview.src =
    safeUrl || getNoImageUrl();
}

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
    if (!currentPickerTarget) return;

    setPreview(
      currentPickerTarget,
      item.id,
      item.url
    );

    closeIconPicker();
  });

  return card;
}

function renderIconPicker() {
  const list =
    document.getElementById("iconPickerList");

  list.innerHTML = "";

  if (currentCommIcons.length === 0) {
    const empty = document.createElement("div");
    empty.className = "iconPickerEmpty";
    empty.textContent = "assets に登録されたキャラアイコンがありません";
    list.appendChild(empty);
    return;
  }

  currentCommIcons.forEach(item => {
    list.appendChild(createIconCard(item));
  });
}

function openIconPicker(target) {
  currentPickerTarget = target;
  renderIconPicker();

  document.getElementById("iconPickerModal")
    .classList.remove("hidden");
}

function closeIconPicker() {
  document.getElementById("iconPickerModal")
    .classList.add("hidden");

  currentPickerTarget = null;
}

function loadCharacter() {
  const data =
    localStorage.getItem("duck");

  if (!data) {
    currentCommIcons = [];
    setPreview("battleStart", null, "");
    setPreview("turnChange", null, "");
    return;
  }

  const duck =
    JSON.parse(data);

  document.getElementById("duckName").value =
    duck.name ?? "";

  document.getElementById("battleStartText").value =
    duck.commDialogues?.battleStart?.text ?? "";

  document.getElementById("turnChangeText").value =
    duck.commDialogues?.turnChange?.text ?? "";

  currentCommIcons =
    normalizeCommIcons(duck.commIcons);

  setPreview(
    "battleStart",
    duck.commDialogues?.battleStart?.iconId ?? null,
    duck.commDialogues?.battleStart?.iconUrl ?? ""
  );

  setPreview(
    "turnChange",
    duck.commDialogues?.turnChange?.iconId ?? null,
    duck.commDialogues?.turnChange?.iconUrl ?? ""
  );
}

document.getElementById("battleStartIconButton")
  .addEventListener("click", () => {
    openIconPicker("battleStart");
  });

document.getElementById("turnChangeIconButton")
  .addEventListener("click", () => {
    openIconPicker("turnChange");
  });

document.getElementById("iconPickerClose")
  .addEventListener("click", closeIconPicker);

document.getElementById("iconPickerModal")
  .addEventListener("click", (e) => {
    if (e.target.id === "iconPickerModal") {
      closeIconPicker();
    }
  });

document.getElementById("saveCharacter")
  .addEventListener("click", () => {
    const oldData =
      localStorage.getItem("duck");

    const oldDuck =
      oldData ? JSON.parse(oldData) : {};

    const name =
      document.getElementById("duckName").value;

    const battleStartText =
      document.getElementById("battleStartText").value.trim();

    const turnChangeText =
      document.getElementById("turnChangeText").value.trim();

    const battleStartButton =
      document.getElementById("battleStartIconButton");

    const turnChangeButton =
      document.getElementById("turnChangeIconButton");

    const battleStartIconId =
      Number(battleStartButton.dataset.selectedId || 0);

    const turnChangeIconId =
      Number(turnChangeButton.dataset.selectedId || 0);

    const battleStartIconUrl =
      battleStartButton.dataset.selectedUrl || "";

    const turnChangeIconUrl =
      turnChangeButton.dataset.selectedUrl || "";

    const duck = {
      ...oldDuck,
      id: oldDuck.id ?? "player_duck",
      name,
      commDialogues: {
        ...(oldDuck.commDialogues || {}),
        battleStart: {
          ...(oldDuck.commDialogues?.battleStart || {}),
          text: battleStartText,
          iconId: battleStartIconId || null,
          iconUrl: battleStartIconUrl
        },
        turnChange: {
          ...(oldDuck.commDialogues?.turnChange || {}),
          text: turnChangeText,
          iconId: turnChangeIconId || null,
          iconUrl: turnChangeIconUrl
        }
      }
    };

    localStorage.setItem(
      "duck",
      JSON.stringify(duck)
    );

    alert("キャラ設定を保存しました");
  });

loadCharacter();
