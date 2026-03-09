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
