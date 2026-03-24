//character-controller.js

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

function createIconCard(item, selectedId, onSelect) {
  const card = document.createElement("div");
  card.className = "commIconCard";

  if (item.id === selectedId) {
    card.classList.add("selected");
  }

  card.dataset.id = String(item.id);
  card.dataset.url = item.url;

  const img = document.createElement("img");
  img.src = item.url;
  img.alt = `icon ${item.id}`;

  const label = document.createElement("div");
  label.className = "commIconCardId";
  label.textContent = `ID ${item.id}`;

  card.appendChild(img);
  card.appendChild(label);

  card.addEventListener("click", () => {
    onSelect(item);
  });

  return card;
}

function renderIconList(containerId, commIcons, selectedId) {
  const container =
    document.getElementById(containerId);

  container.innerHTML = "";

  if (commIcons.length === 0) {
    const empty = document.createElement("div");
    empty.className = "commIconEmpty";
    empty.textContent = "assets に登録されたキャラアイコンがありません";
    container.appendChild(empty);
    return;
  }

  const onSelect = (item) => {
    container.dataset.selectedId = String(item.id);
    container.dataset.selectedUrl = item.url;
    renderIconList(containerId, commIcons, item.id);
  };

  commIcons.forEach(item => {
    container.appendChild(
      createIconCard(item, selectedId, onSelect)
    );
  });
}

function loadCharacter() {
  const data =
    localStorage.getItem("duck");

  if (!data) {
    renderIconList("battleStartIconList", [], null);
    renderIconList("turnChangeIconList", [], null);
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

  const commIcons =
    normalizeCommIcons(duck.commIcons);

  const battleStartId =
    duck.commDialogues?.battleStart?.iconId ?? null;

  const turnChangeId =
    duck.commDialogues?.turnChange?.iconId ?? null;

  renderIconList(
    "battleStartIconList",
    commIcons,
    battleStartId
  );

  renderIconList(
    "turnChangeIconList",
    commIcons,
    turnChangeId
  );

  const battleStartList =
    document.getElementById("battleStartIconList");

  const turnChangeList =
    document.getElementById("turnChangeIconList");

  const battleStartIcon =
    commIcons.find(x => x.id === battleStartId);

  const turnChangeIcon =
    commIcons.find(x => x.id === turnChangeId);

  battleStartList.dataset.selectedId =
    battleStartIcon ? String(battleStartIcon.id) : "";

  battleStartList.dataset.selectedUrl =
    battleStartIcon?.url ?? "";

  turnChangeList.dataset.selectedId =
    turnChangeIcon ? String(turnChangeIcon.id) : "";

  turnChangeList.dataset.selectedUrl =
    turnChangeIcon?.url ?? "";
}

const saveBtn =
  document.getElementById("saveCharacter");

saveBtn.addEventListener("click", () => {
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

  const battleStartList =
    document.getElementById("battleStartIconList");

  const turnChangeList =
    document.getElementById("turnChangeIconList");

  const battleStartIconId =
    Number(battleStartList.dataset.selectedId || 0);

  const turnChangeIconId =
    Number(turnChangeList.dataset.selectedId || 0);

  const battleStartIconUrl =
    battleStartList.dataset.selectedUrl || "";

  const turnChangeIconUrl =
    turnChangeList.dataset.selectedUrl || "";

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
