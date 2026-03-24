//management-controller.js


function loadManagement() {
  const data =
    localStorage.getItem("duck");

  if (!data) return;

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
}

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

  const duck = {
    ...oldDuck,
    id: oldDuck.id ?? "player_duck",
    icon
  };

  localStorage.setItem(
    "duck",
    JSON.stringify(duck)
  );

  alert("アイコン設定を保存しました");
});

loadManagement();
