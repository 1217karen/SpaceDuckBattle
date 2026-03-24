//character-controller.js

function loadCharacter() {
  const data =
    localStorage.getItem("duck");

  if (!data) return;

  const duck =
    JSON.parse(data);

  document.getElementById("duckName").value =
    duck.name ?? "";

  document.getElementById("battleStartText").value =
    duck.commDialogues?.battleStart?.text ?? "";

  document.getElementById("turnChangeText").value =
    duck.commDialogues?.turnChange?.text ?? "";
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

  const duck = {
    ...oldDuck,
    id: oldDuck.id ?? "player_duck",
    name,
    commDialogues: {
      ...(oldDuck.commDialogues || {}),
      battleStart: {
        ...(oldDuck.commDialogues?.battleStart || {}),
        text: battleStartText
      },
      turnChange: {
        ...(oldDuck.commDialogues?.turnChange || {}),
        text: turnChangeText
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
