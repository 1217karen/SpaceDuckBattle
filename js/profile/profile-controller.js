//profile-controller.js

import { getCurrentAccount, loadCharacter, loadUnit } from "../services/storage-service.js";
import { getNoImageUrl, normalizeCommIcons } from "../common/icon-picker.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { showToast } from "../common/toast.js";
import { getFavoritePlaces } from "../chat/chat-place-utils.js";
import { getFavoriteCharacters, isFavoriteCharacter, toggleFavoriteCharacter } from "../services/character-favorite-service.js";
import { isFavoriteUnit, toggleFavoriteUnit } from "../services/unit-favorite-service.js";

const MAX_CHARACTER_ICONS = 20;

const profilePage = document.getElementById("profilePage");
const rightPanel = document.querySelector(".right-panel");

const unitTypeLabels = {
  attack: "アタック",
  defense: "ディフェンス",
  heal: "ヒール",
  speed: "スピード",
  technical: "テクニカル",
  support: "サポート"
};

const unitDescription =
  unit?.description?.trim() || "";

const unitStatItems = [
  { key: "atk", label: "ATK" },
  { key: "def", label: "DEF" },
  { key: "heal", label: "HEAL" },
  { key: "speed", label: "SPEED" },
  { key: "cri", label: "CRI" },
  { key: "tec", label: "TEC" }
];

function getEnoFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const eno = Number(params.get("eno"));

  if (!eno || eno <= 0) {
    return null;
  }

  return eno;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSafeImageUrl(url) {
  if (typeof url === "string" && url.trim() !== "") {
    return url.trim();
  }

  return getNoImageUrl();
}

function getPublicProfileImageUrl(character) {
  const images = Array.isArray(character?.profileImages)
    ? character.profileImages
    : [];

  const publicImages = images
    .filter(image =>
      typeof image?.url === "string" &&
      image.url.trim() !== "" &&
      image.enabled !== false
    );

  if (publicImages.length === 0) {
    return getNoImageUrl();
  }

  const index =
    Math.floor(Math.random() * publicImages.length);

  return publicImages[index].url.trim();
}

function buildCharacterIconList(character) {
  const result = [];
  const usedUrls = new Set();

  const commIcons = normalizeCommIcons(character?.commIcons);

  for (const icon of commIcons) {
    if (result.length >= MAX_CHARACTER_ICONS) {
      break;
    }

    const url = getSafeImageUrl(icon.url);

    if (url === getNoImageUrl()) {
      continue;
    }

    if (usedUrls.has(url)) {
      continue;
    }

    usedUrls.add(url);

    result.push({
      url,
      name: icon.name?.trim() || `アイコン${icon.id}`
    });
  }

  return result;
}

function getUnitStats(unit) {
  const source = unit?.stats || {};

  return {
    atk: Math.max(0, Number(source.atk) || 0),
    def: Math.max(0, Number(source.def) || 0),
    heal: Math.max(0, Number(source.heal) || 0),
    speed: Math.max(0, Number(source.speed) || 0),
    cri: Math.max(0, Number(source.cri) || 0),
    tec: Math.max(0, Number(source.tec) || 0)
  };
}

function renderStatRadar(stats) {
  const maxValue = 100;

  const center = 60;
  const radius = 38;
  const labelRadius = 50;
  const count = unitStatItems.length;

  const getPoint = (index, rateRadius) => {
    const angle =
      -Math.PI / 2 + (Math.PI * 2 * index) / count;

    return {
      x: center + Math.cos(angle) * rateRadius,
      y: center + Math.sin(angle) * rateRadius
    };
  };

  const gridHtml = [0.25, 0.5, 0.75, 1]
    .map(rate => {
      const points = unitStatItems
        .map((_, index) => {
          const point = getPoint(index, radius * rate);
          return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
        })
        .join(" ");

      return `<polygon class="profileStatRadarGrid" points="${points}"></polygon>`;
    })
    .join("");

  const axisHtml = unitStatItems
    .map((_, index) => {
      const point = getPoint(index, radius);
      return `
        <line
          class="profileStatRadarAxis"
          x1="${center}"
          y1="${center}"
          x2="${point.x.toFixed(1)}"
          y2="${point.y.toFixed(1)}"
        ></line>
      `;
    })
    .join("");

  const valuePoints = unitStatItems
    .map((item, index) => {
      const value = Math.min(stats[item.key], maxValue);
      const rate = value / maxValue;
      const point = getPoint(index, radius * rate);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");

  const labelHtml = unitStatItems
    .map((item, index) => {
      const point = getPoint(index, labelRadius);

      return `
        <text
          class="profileStatRadarLabel"
          x="${point.x.toFixed(1)}"
          y="${point.y.toFixed(1)}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${escapeHtml(item.label)}</text>
      `;
    })
    .join("");

  return `
    <svg
      class="profileStatRadar"
      viewBox="0 0 120 120"
      role="img"
      aria-label="ユニットステータス"
    >
      ${gridHtml}
      ${axisHtml}
      <polygon class="profileStatRadarShape" points="${valuePoints}"></polygon>
      ${labelHtml}
    </svg>
  `;
}

function renderNotFound(message) {
  profilePage.innerHTML = `
    <section class="profileCard">
      <p class="profileMessage">${escapeHtml(message)}</p>
    </section>
  `;
}

function renderProfile(eno, character, unit, options = {}) {
  const { currentEno = null } = options;

  const fullName =
    character?.fullName?.trim() || "未設定";

  const profileText =
    character?.profileText?.trim() || "未設定";

  const profileImageUrl =
    getPublicProfileImageUrl(character);

  const hasUnit =
    !!unit;

  const duckIconUrl =
    getSafeImageUrl(unit?.icon?.default || "");

  const unitName =
    unit?.name?.trim() || "未設定";

  const unitType =
    unit?.type?.trim() || "";

  const unitTypeLabel =
    unitTypeLabels[unitType] || unitType || "未設定";

  const unitDescription =
    unit?.description?.trim() || "";

  const unitNo =
    Number(unit?.unitNo || 1);

  const unitStats =
    getUnitStats(unit);

  const isOwnProfile =
    Number(currentEno) === Number(eno);

  const isFavorite =
    isFavoriteCharacter(eno, { currentEno });

  const isUnitFavorite =
    hasUnit
      ? isFavoriteUnit(eno, unitNo, { currentEno })
      : false;

  const characterIcons =
    buildCharacterIconList(character);

  const characterIconHtml = characterIcons.length > 0
    ? characterIcons.map(icon => `
        <img
          class="profileCommIcon"
          src="${escapeHtml(icon.url)}"
          alt="${escapeHtml(icon.name)}"
        >
      `).join("")
    : `<p class="emptyText">公開されているアイコンはありません</p>`;

  const statValueHtml = unitStatItems
    .map(item => `
      <div class="profileStatValue">
        <span class="profileStatLabel">${escapeHtml(item.label)}</span>
        <span class="profileStatNumber">${escapeHtml(unitStats[item.key])}</span>
      </div>
    `)
    .join("");

  profilePage.innerHTML = `
    <section class="profileCard">
      <header class="profileIdBar">
        <div class="profileIdMain">
          <div class="profileKicker">PROFILE</div>
          <div class="profileIdentityRow">
            <span class="profileEnoText">Eno.${escapeHtml(eno)}</span>
            <h2 class="characterName">${escapeHtml(fullName)}</h2>
          </div>
        </div>

        ${isOwnProfile ? "" : `
          <button
            type="button"
            class="profileFavoriteButton button-icon"
            title="${isFavorite ? "お気に入り解除" : "お気に入り登録"}"
            aria-label="${isFavorite ? "お気に入り解除" : "お気に入り登録"}"
            data-favorite-character-button
          >${isFavorite ? "★" : "☆"}</button>
        `}
      </header>

      <div class="profileMainGrid">
        <div class="profileImageFrame">
          <img
            class="profileMainImage"
            src="${escapeHtml(profileImageUrl)}"
            alt="${escapeHtml(fullName)} プロフィール画像"
          >
        </div>

        <div class="profileSidePanel">

          <section class="profileInfoBlock profileUnitBlock">
            <h3>UNIT DATA</h3>

            ${hasUnit ? `
              <div class="profileUnitHeader">
                <img
                  class="profileUnitIcon"
                  src="${escapeHtml(duckIconUrl)}"
                  alt="ユニットアイコン"
                >

                <div class="profileUnitTitle">
                  <div class="profileUnitNameRow">
                    <div class="profileUnitName">${escapeHtml(unitName)}</div>

                    ${isOwnProfile ? "" : `
                      <button
                        type="button"
                        class="profileFavoriteButton profileUnitFavoriteButton button-icon"
                        title="${isUnitFavorite ? "ユニットのお気に入り解除" : "ユニットをお気に入り登録"}"
                        aria-label="${isUnitFavorite ? "ユニットのお気に入り解除" : "ユニットをお気に入り登録"}"
                        data-favorite-unit-button
                      >${isUnitFavorite ? "★" : "☆"}</button>
                    `}
                  </div>

                  <div class="profileUnitType">${escapeHtml(unitTypeLabel)}</div>
                </div>
              </div>

              ${unitDescription ? `
                <p class="profileUnitDescription">${escapeHtml(unitDescription)}</p>
              ` : ""}

              <div class="profileStatsLayout">
                <div class="profileStatRadarWrap">
                  ${renderStatRadar(unitStats)}
                </div>

                <div class="profileStatValueGrid">
                  ${statValueHtml}
                </div>
              </div>
            ` : `
              <p class="emptyText">ユニット情報はありません</p>
            `}
          </section>
        </div>
      </div>

      <section class="profileSection profileTextSection">
        <h3>PROFILE TEXT</h3>
        <p class="profileText">${escapeHtml(profileText)}</p>
      </section>

      <section class="profileSection profileIconSection">
        <h3>COMM ICONS</h3>
        <div class="profileCommIconGrid">
          ${characterIconHtml}
        </div>
      </section>
    </section>
  `;

  const favoriteButton =
    profilePage.querySelector("[data-favorite-character-button]");

  if (favoriteButton) {
    favoriteButton.addEventListener("click", () => {
      const result =
        toggleFavoriteCharacter(eno, { currentEno });

      favoriteButton.textContent =
        result.isFavorite ? "★" : "☆";

      favoriteButton.title =
        result.isFavorite ? "お気に入り解除" : "お気に入り登録";

      favoriteButton.setAttribute(
        "aria-label",
        result.isFavorite ? "お気に入り解除" : "お気に入り登録"
      );

      showToast(
        result.isFavorite
          ? "お気に入りキャラに登録しました"
          : "お気に入りキャラを解除しました",
        {
          type: result.isFavorite ? "success" : "info"
        }
      );

      renderProfileFavoritesPanel(currentEno);
    });
  }

  const favoriteUnitButton =
    profilePage.querySelector("[data-favorite-unit-button]");

  if (favoriteUnitButton) {
    favoriteUnitButton.addEventListener("click", () => {
      const result =
        toggleFavoriteUnit(eno, unitNo, { currentEno });

      favoriteUnitButton.textContent =
        result.isFavorite ? "★" : "☆";

      favoriteUnitButton.title =
        result.isFavorite
          ? "ユニットのお気に入り解除"
          : "ユニットをお気に入り登録";

      favoriteUnitButton.setAttribute(
        "aria-label",
        result.isFavorite
          ? "ユニットのお気に入り解除"
          : "ユニットをお気に入り登録"
      );

      showToast(
        result.isFavorite
          ? "お気に入りユニットに登録しました"
          : "お気に入りユニットを解除しました",
        {
          type: result.isFavorite ? "success" : "info"
        }
      );
    });
  }
}

function renderProfileFavoritesPanel(currentEno = null) {
  renderFavoritesSidePanel(rightPanel, {
    defaultTab: "character",
    favoritePlaces: getFavoritePlaces(),
    favoriteCharacters: getFavoriteCharacters({ currentEno })
  });
}

function initProfilePage() {
  const account =
    getCurrentAccount();

  const currentEno =
    account?.eno ?? null;

  const eno =
    getEnoFromQuery();

  if (!eno) {
    renderNotFound("Enoが指定されていません");
    renderProfileFavoritesPanel(currentEno);
    return;
  }

  const character =
    loadCharacter(eno);

  const unit =
    loadUnit(eno, 1);

  if (!character && !unit) {
    renderNotFound("このEnoは存在しません");
    renderProfileFavoritesPanel(currentEno);
    return;
  }

  renderProfileFavoritesPanel(currentEno);
  renderProfile(eno, character, unit, { currentEno });
}

initProfilePage();
