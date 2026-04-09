// new-battlelog-ui-init.js


// =====================
// import
// =====================

import { skillHandlers } from "../data/skills.js";
import { updateUnitStatUI } from "./new-battlelog-ui.js";


export function createSideUI(snapshot, battleState, sideId, team) {

  const side = document.getElementById(sideId);

  if (!snapshot || !side) return;

  const units = snapshot.units.filter(u => u.team === team);

  units.forEach(u => {
    const wrapper = document.createElement("div");
    wrapper.className = `unitFrame team${team}Frame`;

    const div = document.createElement("div");
    div.className = "unitStatus";

    wrapper.appendChild(div);
    div.dataset.unit = u.id;

        div.innerHTML = `

<div class="unitHeader">
  <div class="unitName">${u.name || u.id}</div>
  <div class="nameDivider"></div>
</div>

<div class="unitRow">

  <div class="unitMain">

<div class="unitTopRow">

  <img class="statusIcon" src="${u.icon || "https://placehold.co/60x60"}">

  <div class="statusInfoBlock">

    <div class="effectList">

      <div class="effectItem"><span class="effectIcon">浮</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">加</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">共</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">修</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">衛</span><span class="effectCount">00</span></div>

      <div class="effectItem"><span class="effectIcon">重</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">減</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">妨</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">侵</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">流</span><span class="effectCount">00</span></div>

    </div>

    <div class="statDivider"></div>

<div class="statRow">

  <div class="statItem" data-stat="atk">
    <span class="statLabel">AT</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="def">
    <span class="statLabel">DF</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="heal">
    <span class="statLabel">HL</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="speed">
    <span class="statLabel">SP</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="cri">
    <span class="statLabel">CR</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="tec">
    <span class="statLabel">TC</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

</div>

  </div>

</div>

<div class="hpRow">

  <div class="hpText">
    HP ${(u.hp ?? u.mhp ?? 0)}/${u.mhp ?? u.hp ?? 0}
  </div>

  <div class="hpBar">
    <div class="hpFill" style="width:100%"></div>
  </div>

</div>

  </div>

  <div class="skillSlots">

<div class="skillSlot"></div>
<div class="skillSlot"></div>

<div class="skillSlot"></div>
<div class="skillSlot"></div>

<div class="skillSlot"></div>
<div class="skillSlot"></div>

<div class="skillSlot"></div>
<div class="skillSlot"></div>
  </div>

</div>
`;

    side.appendChild(wrapper);

    const skillSlots = div.querySelectorAll(".skillSlot");

    (u.skills || []).forEach((s, i) => {
      const handler = skillHandlers[s.type];
      if (!handler) return;

      const slot = skillSlots[i];
      if (!slot) return;

      const img = document.createElement("img");
      img.src = handler.icon || "";
      img.style.width = "100%";
      img.style.height = "100%";

      slot.dataset.skill = s.type;

      slot.appendChild(img);
    });

    updateUnitStatUI(u.id, battleState.boardState);

    const nameEl = div.querySelector(".unitName");
    if (nameEl) {
      setTimeout(() => {
        let size = 13;
        while (nameEl.scrollWidth > nameEl.offsetWidth && size > 8) {
          size--;
          nameEl.style.fontSize = size + "px";
        }
      }, 0);
    }
  });
}
