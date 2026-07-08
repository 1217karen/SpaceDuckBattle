// character-list-controller.js

import { getRegisteredEnoMax, loadCharacter, loadUnit } from "../services/storage-service.js";
import { getNoImageUrl } from "../common/icon-picker.js";

const characterList = document.getElementById("characterList");

const UNIT_TYPE_LABELS = {
  attack: "アタック",
  defense: "ディフェンス",
  heal: "ヒール",
  speed: "スピード",
  technical: "テクニカル",
  support: "サポート"
};

let allCharacters = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDisplayText(value, fallback = "未設定") {
  const text = String(value ?? "").trim();

  return text !== ""
    ? text
    : fallback;
}

function getImageUrl(value) {
  const url = String(value ?? "").trim();

  return url !== ""
    ? url
    : getNoImageUrl();
}

function getUnitTypeLabel(type) {
  const key = String(type ?? "").trim();

  if (!key) {
    return "未設定";
  }

  return UNIT_TYPE_LABELS[key] || key;
}

function getCharacterSummaries() {
  const maxEno = getRegisteredEnoMax();
  const result = [];

  for (let eno = 1; eno <= maxEno; eno++) {
    const character = loadCharacter(eno);

    if (!character) {
      continue;
    }

    const unit = loadUnit(eno, 1) || {};
    const unitType = String(unit?.type ?? "").trim();

    result.push({
      eno,
      profileUrl: `./profile.html?eno=${encodeURIComponent(eno)}`,
      characterIconUrl: getImageUrl(character?.defaultIcon),
      unitIconUrl: getImageUrl(unit?.icon?.default),
      fullName: getDisplayText(character?.fullName),
      unitName: getDisplayText(unit?.name),
      unitType,
      unitTypeLabel: getUnitTypeLabel(unitType)
    });
  }

  return result;
}

function getSearchSource(item) {
  return [
    item.eno,
    `Eno.${item.eno}`,
    item.fullName,
    item.unitName,
    item.unitType,
    item.unitTypeLabel
  ]
    .join(" ")
    .toLocaleLowerCase("ja-JP");
}

function compareText(a, b) {
  return String(a ?? "").localeCompare(
    String(b ?? ""),
    "ja-JP",
    {
      numeric: true,
      sensitivity: "base"
    }
  );
}

function getSortedCharacters(characters, sortMode) {
  const sorted = [...characters];

  sorted.sort((a, b) => {
    if (sortMode === "eno-desc") {
      return b.eno - a.eno;
    }

    if (sortMode === "fullName") {
      return compareText(a.fullName, b.fullName) || a.eno - b.eno;
    }

    if (sortMode === "unitName") {
      return compareText(a.unitName, b.unitName) || a.eno - b.eno;
    }

    if (sortMode === "unitType") {
      return compareText(a.unitTypeLabel, b.unitTypeLabel) || a.eno - b.eno;
    }

    return a.eno - b.eno;
  });

  return sorted;
}

function renderCharacterRows(characters) {
  const resultArea = document.getElementById("characterListResult");

  if (!resultArea) {
    return;
  }

  if (characters.length === 0) {
    resultArea.innerHTML = `
      <p class="commonEmptyText characterListEmpty">
        条件に一致するキャラクターはいません
      </p>
    `;
    return;
  }

  resultArea.innerHTML = characters.map(item => `
    <a class="characterListRow" href="${escapeHtml(item.profileUrl)}">
      <div class="characterListIcons">
        <div class="characterListIconBlock">
          <img
            class="characterListIconImage"
            src="${escapeHtml(item.characterIconUrl)}"
            alt="${escapeHtml(item.fullName)}のキャラアイコン"
            loading="lazy"
          >
          <span class="characterListIconLabel">CHARA</span>
        </div>

        <div class="characterListIconBlock">
          <img
            class="characterListIconImage"
            src="${escapeHtml(item.unitIconUrl)}"
            alt="${escapeHtml(item.unitName)}のユニットアイコン"
            loading="lazy"
          >
          <span class="characterListIconLabel">UNIT</span>
        </div>
      </div>

      <div class="characterListEno">Eno.${item.eno}</div>

      <div class="characterListCharacter">
        <div class="characterListMobileLabel">CHARACTER</div>
        <div class="characterListName">${escapeHtml(item.fullName)}</div>
      </div>

      <div class="characterListUnit">
        <div class="characterListMobileLabel">UNIT</div>
        <div class="characterListUnitName">${escapeHtml(item.unitName)}</div>
      </div>

      <div class="characterListType">
        <span class="characterListTypeBadge">${escapeHtml(item.unitTypeLabel)}</span>
      </div>
    </a>
  `).join("");
}

function updateCharacterList() {
  const searchInput = document.getElementById("characterListSearch");
  const sortSelect = document.getElementById("characterListSort");
  const countText = document.getElementById("characterListCount");

  const keyword =
    searchInput?.value
      ?.trim()
      .toLocaleLowerCase("ja-JP") ?? "";

  const sortMode =
    sortSelect?.value ?? "eno-asc";

  const filtered = keyword
    ? allCharacters.filter(item =>
        getSearchSource(item).includes(keyword)
      )
    : allCharacters;

  const sorted = getSortedCharacters(filtered, sortMode);

  if (countText) {
    countText.textContent =
      `表示 ${sorted.length} / 登録 ${allCharacters.length}`;
  }

  renderCharacterRows(sorted);
}

function renderCharacterList() {
  allCharacters = getCharacterSummaries();

  characterList.innerHTML = `
    <section class="characterListPage common-card-framed common-card-rounded-lg common-card-profile">
      <div class="characterListHeader">
        <div class="characterListHeaderMain">
          <div class="common-gradientHeading commonSectionHeading commonSectionHeading-large characterListKicker">
            CHARACTER LIST
          </div>
          <p class="characterListDescription">
            登録済みキャラクターの一覧です。行を選択するとプロフィールを表示します。
          </p>
        </div>

        <div id="characterListCount" class="characterListCount"></div>
      </div>

      <div class="characterListControls">
        <label class="characterListControlLabel">
          <span class="characterListControlText">検索</span>
          <input
            id="characterListSearch"
            class="characterListSearchInput"
            type="search"
            placeholder="Eno / キャラ名 / ユニット名 / タイプ"
          >
        </label>

        <label class="characterListControlLabel characterListSortLabel">
          <span class="characterListControlText">ソート</span>
          <select id="characterListSort" class="characterListSortSelect">
            <option value="eno-asc">Eno 昇順</option>
            <option value="eno-desc">Eno 降順</option>
            <option value="fullName">キャラ名順</option>
            <option value="unitName">ユニット名順</option>
            <option value="unitType">ユニットタイプ順</option>
          </select>
        </label>
      </div>

      <div class="characterListColumnHead" aria-hidden="true">
        <div>ICON</div>
        <div>ENO</div>
        <div>CHARACTER</div>
        <div>UNIT</div>
        <div>TYPE</div>
      </div>

      <div id="characterListResult" class="characterListResult"></div>
    </section>
  `;

  document
    .getElementById("characterListSearch")
    ?.addEventListener("input", updateCharacterList);

  document
    .getElementById("characterListSort")
    ?.addEventListener("change", updateCharacterList);

  updateCharacterList();
}

renderCharacterList();
