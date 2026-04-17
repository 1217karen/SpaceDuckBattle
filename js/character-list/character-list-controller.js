//character-list-controller.js

import { getRegisteredEnoMax, loadCharacter } from "../services/storage-service.js";

const characterList = document.getElementById("characterList");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCharacterSummaries() {
  const maxEno = getRegisteredEnoMax();
  const result = [];

  for (let eno = 1; eno <= maxEno; eno++) {
    const character = loadCharacter(eno);

    if (!character) {
      continue;
    }

    result.push({
      eno,
      fullName: character.fullName?.trim() || "未設定"
    });
  }

  return result;
}

function renderCharacterList() {
  const characters = getCharacterSummaries();

  if (characters.length === 0) {
    characterList.innerHTML = `<p class="emptyText">登録キャラクターはいません</p>`;
    return;
  }

  characterList.innerHTML = `
    <div class="characterListTable">
      <div class="characterListHead">Eno</div>
      <div class="characterListHead">フルネーム</div>
      ${characters.map(item => `
        <div class="characterListCell">
          <a href="./profile.html?eno=${item.eno}">Eno.${item.eno}</a>
        </div>
        <div class="characterListCell">
          <a href="./profile.html?eno=${item.eno}">${escapeHtml(item.fullName)}</a>
        </div>
      `).join("")}
    </div>
  `;
}

renderCharacterList();
