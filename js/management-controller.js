//management-controller.js

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
    }));
}

function createCommIconRow(item) {
  const row = document.createElement("div");
  row.className = "commIconRow";
  row.dataset.id = String(item.id);

  const label = document.createElement("span");
  label.textContent = `ID ${item.id} `;
  row.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "commIconUrlInput";
  input.value = item.url ?? "";
  row.appendChild(input);

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

    return {
      id,
      url
    };
  });
}

function loadManagement() {
  const data =
    localStorage.getItem("duck");

  if (!data) {
    renderCommIconArea([]);
    return;
  }

  const duck =
    JSON.parse(data);

  document.getElementById("iconDefault").value =
    duck.icon?.default ?? "";

  document.getElementById("iconN").value =
    duck.icon?.N ?? "";

  document.getElementById("iconE").value =
    duck.icon?.E ?? "";

  document.getElementById("iconS").value =
    duck.icon?.S ?? "";

  document.getElementById("iconW").value =
    duck.icon?.W ?? "";

  const commIcons =
    normalizeCommIcons(duck.commIcons);

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
      url: ""
    });

    renderCommIconArea(current);
  });

const saveBtn =
  document.getElementById("saveManagement");

saveBtn.addEventListener("click", () => {
  const oldData =
    localStorage.getItem("duck");

  const oldDuck =
    oldData ? JSON.parse(oldData) : {};

  const icon = {
    default: document.getElementById("iconDefault").value,
    N: document.getElementById("iconN").value,
    E: document.getElementById("iconE").value,
    S: document.getElementById("iconS").value,
    W: document.getElementById("iconW").value
  };

  const commIcons =
    readCommIconArea();

  const duck = {
    ...oldDuck,
    id: oldDuck.id ?? "player_duck",
    icon,
    commIcons
  };

  localStorage.setItem(
    "duck",
    JSON.stringify(duck)
  );

  alert("アイコン設定を保存しました");
});

loadManagement();
