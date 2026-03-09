import { skillHandlers } from "./skills.js";

const skillList = Object.keys(skillHandlers);

const selects =
  document.querySelectorAll(".skillSelect");

for (const select of selects) {

  for (const skillId of skillList) {

    const option =
      document.createElement("option");

    option.value = skillId;
    option.textContent = skillId;

    select.appendChild(option);
  }
}
const saveBtn =
  document.getElementById("saveDuck");

saveBtn.addEventListener("click", () => {

  const name =
    document.getElementById("duckName").value;

  const type =
    document.getElementById("duckType").value;

  const icon = {
    main: document.getElementById("iconMain").value,
    N: document.getElementById("iconN").value,
    E: document.getElementById("iconE").value,
    S: document.getElementById("iconS").value,
    W: document.getElementById("iconW").value
  };

  const stats = {
    atk: Number(document.getElementById("statAT").value),
    df: Number(document.getElementById("statDF").value),
    heal: Number(document.getElementById("statHEAL").value),
    speed: Number(document.getElementById("statSPEED").value),
    cri: Number(document.getElementById("statCRI").value),
    int: Number(document.getElementById("statINT").value)
  };

  const mhp =
    100 +
    stats.atk * 2 +
    stats.df * 3 +
    stats.heal * 2;

  const skillSelects =
    document.querySelectorAll(".skillSelect");

  const skills = [];

  for (const s of skillSelects) {

    if (s.value !== "") {
      skills.push(s.value);
    }

  }

  const duck = {

    id: "player_duck",

    name,
    type,

    icon,

    stats,

    mhp,

    skills

  };

  localStorage.setItem(
    "duck",
    JSON.stringify(duck)
  );

  alert("アヒルを保存しました");

});
