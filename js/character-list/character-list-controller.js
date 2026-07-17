// character-list-controller.js

import { getCurrentAccount, getRegisteredEnoMax, loadCharacter, loadUnit } from "../services/storage-service.js";
import { addUnreadCountsToPlaces } from "../services/place-unread-service.js";
import { getNoImageUrl } from "../common/icon-picker.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { getFavoritePlaces } from "../chat/chat-place-utils.js";
import {
  getFavoriteCharacters,
  getFavoriteCharacterMemoMaxLength,
  saveFavoriteCharacterMemo
} from "../services/character-favorite-service.js";

const characterList = document.getElementById("characterList");
const rightPanel = document.querySelector(".right-panel");

const UNIT_TYPE_LABELS = {
  attack: "アタック",
  defense: "ディフェンス",
  heal: "ヒール",
  speed: "スピード",
  technical: "テクニカル",
  support: "サポート"
};

let allCharacters = [];

function getCurrentEno() {
  const account = getCurrentAccount();
  const eno = Number(account?.eno || 0);

  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

function renderCharacterListFavoritesPanel() {
  const currentEno = getCurrentEno();

  renderFavoritesSidePanel(rightPanel, {
    isLoggedIn: currentEno !== null,
    defaultTab: "character",
    favoritePlaces: addUnreadCountsToPlaces(getFavoritePlaces(), { currentEno, viewerEno: currentEno }),
    favoriteCharacters: getFavoriteCharacters({ currentEno }),
    showCharacterMemo: true,
    editableCharacterMemo: true,
    characterMemoMaxLength: getFavoriteCharacterMemoMaxLength(),
    onUpdateCharacterMemo: saveFavoriteCharacterMemo
  });
}

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

function renderUnitTypeOptions() {
  return Object.entries(UNIT_TYPE_LABELS)
    .map(([value, label]) => `
      <option value="${escapeHtml(value)}">${escapeHtml(label)}</option>
    `)
    .join("");
}

function getUnitStats(stats = {}) {
  return {
    atk: Number(stats?.atk) || 0,
    def: Number(stats?.def) || 0,
    heal: Number(stats?.heal) || 0,
    speed: Number(stats?.speed) || 0,
    cri: Number(stats?.cri) || 0,
    tec: Number(stats?.tec) || 0
  };
}

function renderStatChip(label, value) {
  return `
    <span class="characterListStatChip">
      <span class="characterListStatLabel">${escapeHtml(label)}</span>
      <span class="characterListStatValue">${escapeHtml(value)}</span>
    </span>
  `;
}

function renderStatGroup(stats, keys) {
  const labels = {
    atk: "ATK",
    def: "DEF",
    heal: "HEAL",
    speed: "SPD",
    cri: "CRI",
    tec: "TEC"
  };

  return keys
    .map(key => renderStatChip(labels[key], stats[key]))
    .join("");
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
      unitTypeLabel: getUnitTypeLabel(unitType),
      stats: getUnitStats(unit?.stats)
    });
  }

  return result;
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

function getStatTotal(stats = {}) {
  return (
    (Number(stats.atk) || 0) +
    (Number(stats.def) || 0) +
    (Number(stats.heal) || 0) +
    (Number(stats.speed) || 0) +
    (Number(stats.cri) || 0) +
    (Number(stats.tec) || 0)
  );
}

function getSortValue(item, sortKey) {
  if (sortKey === "fullName") return item.fullName;
  if (sortKey === "unitName") return item.unitName;
  if (sortKey === "unitType") return item.unitTypeLabel;
  if (sortKey === "total") return getStatTotal(item.stats);
  if (sortKey === "atk") return item.stats.atk;
  if (sortKey === "def") return item.stats.def;
  if (sortKey === "heal") return item.stats.heal;
  if (sortKey === "speed") return item.stats.speed;
  if (sortKey === "cri") return item.stats.cri;
  if (sortKey === "tec") return item.stats.tec;

  return item.eno;
}

function isNumericSortKey(sortKey) {
  return [
    "eno",
    "total",
    "atk",
    "def",
    "heal",
    "speed",
    "cri",
    "tec"
  ].includes(sortKey);
}

function getSortedCharacters(characters, sortKey, sortDirection) {
  const direction = sortDirection === "desc" ? -1 : 1;
  const sorted = [...characters];

  sorted.sort((a, b) => {
    let result = 0;

    if (isNumericSortKey(sortKey)) {
      result =
        Number(getSortValue(a, sortKey) || 0) -
        Number(getSortValue(b, sortKey) || 0);
    } else {
      result = compareText(
        getSortValue(a, sortKey),
        getSortValue(b, sortKey)
      );
    }

    if (result === 0) {
      result = a.eno - b.eno;
    }

    return result * direction;
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
      <div class="characterListEno">Eno.${item.eno}</div>

      <div class="characterListCharIconWrap">
        <img
          class="characterListIconImage"
          src="${escapeHtml(item.characterIconUrl)}"
          alt="${escapeHtml(item.fullName)}のキャラアイコン"
          loading="lazy"
        >
      </div>

      <div class="characterListCharNameArea">
        <div class="characterListMobileLabel">CHARACTER</div>
        <div class="characterListName">${escapeHtml(item.fullName)}</div>
      </div>

      <div class="characterListType">
        <span class="characterListTypeBadge">${escapeHtml(item.unitTypeLabel)}</span>
      </div>

      <div class="characterListStats characterListStatsTop">
        ${renderStatGroup(item.stats, ["atk", "def", "heal"])}
      </div>

      <div class="characterListUnitIconWrap">
        <img
          class="characterListIconImage"
          src="${escapeHtml(item.unitIconUrl)}"
          alt="${escapeHtml(item.unitName)}のユニットアイコン"
          loading="lazy"
        >
      </div>

      <div class="characterListUnitNameArea">
        <div class="characterListMobileLabel">UNIT</div>
        <div class="characterListUnitName">${escapeHtml(item.unitName)}</div>
      </div>

      <div class="characterListStats characterListStatsBottom">
        ${renderStatGroup(item.stats, ["speed", "cri", "tec"])}
      </div>
    </a>
  `).join("");
}

function updateCharacterList() {
  const characterSearchInput =
    document.getElementById("characterListCharacterSearch");

  const unitSearchInput =
    document.getElementById("characterListUnitSearch");

  const typeFilterSelect =
    document.getElementById("characterListTypeFilter");

  const sortKeySelect =
    document.getElementById("characterListSortKey");

  const sortDirectionSelect =
    document.getElementById("characterListSortDirection");

  const countText =
    document.getElementById("characterListCount");

  const characterKeyword =
    characterSearchInput?.value
      ?.trim()
      .toLocaleLowerCase("ja-JP") ?? "";

  const unitKeyword =
    unitSearchInput?.value
      ?.trim()
      .toLocaleLowerCase("ja-JP") ?? "";

  const selectedType =
    typeFilterSelect?.value ?? "";

  const sortKey =
    sortKeySelect?.value ?? "eno";

  const sortDirection =
    sortDirectionSelect?.value ?? "asc";

  const filtered = allCharacters.filter(item => {
    const fullName =
      item.fullName.toLocaleLowerCase("ja-JP");

    const unitName =
      item.unitName.toLocaleLowerCase("ja-JP");

    const matchesCharacter =
      characterKeyword === "" ||
      fullName.includes(characterKeyword);

    const matchesUnit =
      unitKeyword === "" ||
      unitName.includes(unitKeyword);

    const matchesType =
      selectedType === "" ||
      item.unitType === selectedType;

    return matchesCharacter && matchesUnit && matchesType;
  });

  const sorted =
    getSortedCharacters(filtered, sortKey, sortDirection);

  if (countText) {
    countText.textContent =
      `表示 ${sorted.length} / 登録 ${allCharacters.length}`;
  }

  renderCharacterRows(sorted);
}

function renderCharacterList() {
  allCharacters = getCharacterSummaries();

  characterList.innerHTML = `
    <section class="characterListControlPanel common-card-framed common-card-rounded-lg common-card-panel">
      <div class="characterListControls">
        <label class="characterListControlLabel characterListControlCharacter">
          <span class="characterListControlText">キャラ名</span>
          <input
            id="characterListCharacterSearch"
            class="characterListControlInput"
            type="search"
            placeholder="キャラ名で検索"
          >
        </label>

        <label class="characterListControlLabel characterListControlUnit">
          <span class="characterListControlText">ユニット名</span>
          <input
            id="characterListUnitSearch"
            class="characterListControlInput"
            type="search"
            placeholder="ユニット名で検索"
          >
        </label>

        <label class="characterListControlLabel characterListControlType">
          <span class="characterListControlText">タイプ</span>
          <select id="characterListTypeFilter" class="characterListControlSelect">
            <option value="">すべて</option>
            ${renderUnitTypeOptions()}
          </select>
        </label>

        <div class="characterListSortControls">
          <label class="characterListControlLabel">
            <span class="characterListControlText">ソート</span>
            <select id="characterListSortKey" class="characterListControlSelect">
              <option value="eno">Eno</option>
              <option value="fullName">キャラ名</option>
              <option value="unitName">ユニット名</option>
              <option value="unitType">ユニットタイプ</option>
              <option value="total">合計ステータス</option>
              <option value="atk">ATK</option>
              <option value="def">DEF</option>
              <option value="heal">HEAL</option>
              <option value="speed">SPEED</option>
              <option value="cri">CRI</option>
              <option value="tec">TEC</option>
            </select>
          </label>

          <label class="characterListControlLabel characterListSortDirectionLabel">
            <span class="characterListControlText">順</span>
            <select id="characterListSortDirection" class="characterListControlSelect">
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <div id="characterListCount" class="characterListCount"></div>

    <section class="characterListPage common-card-framed common-card-rounded-lg common-card-profile">
      <div id="characterListResult" class="characterListResult"></div>
    </section>
  `;

  [
    "characterListCharacterSearch",
    "characterListUnitSearch"
  ].forEach(id => {
    document
      .getElementById(id)
      ?.addEventListener("input", updateCharacterList);
  });

  [
    "characterListTypeFilter",
    "characterListSortKey",
    "characterListSortDirection"
  ].forEach(id => {
    document
      .getElementById(id)
      ?.addEventListener("change", updateCharacterList);
  });

  updateCharacterList();
}

renderCharacterList();
renderCharacterListFavoritesPanel();
