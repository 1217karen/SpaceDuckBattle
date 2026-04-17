//profile-controller.js

import { loadCharacter, loadUnit } from "../services/storage-service.js";
import { skillHandlers } from "../data/skills.js";

const DEFAULT_NO_IMAGE_URL = "https://example.com/noimg.png";
const MAX_CHARACTER_ICONS = 10;

const profilePage = document.getElementById("profilePage");

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

  return DEFAULT_NO_IMAGE_URL;
}

function normalizeCommIcons(commIcons) {
  if (!Array.isArray(commIcons)) {
    return [];
  }

  return commIcons
    .map((item, index) => ({
      id:
        typeof item?.id === "number"
          ? item.id
          : index + 1,
      url:
        typeof item?.url === "string"
          ? item.url
          : "",
      name:
        typeof item?.name === "string"
          ? item.name
          : ""
    }))
    .filter(item => item.url.trim() !== "");
}

function buildCharacterIconList(character) {
  const result = [];
  const usedKeys = new Set();

  const defaultIconUrl = getSafeImageUrl(character?.defaultIcon || "");
  result.push({
    url: defaultIconUrl,
    name: "デフォルト"
  });
  usedKeys.add(`url:${defaultIconUrl}`);

  const commIcons = normalizeCommIcons(character?.commIcons);

  for (const icon of commIcons) {
    if (result.length >= MAX_CHARACTER_ICONS) {
      break;
    }

    const key = `id:${icon.id}:url:${icon.url}`;

    if (usedKeys.has(key)) {
      continue;
    }

    usedKeys.add(key);

    result.push({
      url: getSafeImageUrl(icon.url),
      name: icon.name?.trim() || `アイコン${icon.id}`
    });
  }

  return result.slice(0, MAX_CHARACTER_ICONS);
}

function getPublicPatterns(unit) {
  if (!Array.isArray(unit?.patterns)) {
    return [];
  }

  return unit.patterns.filter(pattern => pattern?.public);
}

function getPatternSkillList(pattern) {
  if (!Array.isArray(pattern?.skills)) {
    return [];
  }

  return pattern.skills.filter(skill => skill?.type);
}

function renderNotFound(message) {
  profilePage.innerHTML = `
    <section class="profileCard">
      <p class="profileMessage">${escapeHtml(message)}</p>
    </section>
  `;
}

function renderProfile(eno, character, unit) {
  const fullName = character?.fullName?.trim() || "未設定";
  const profileText = character?.profileText?.trim() || "未設定";
  const duckIconUrl = getSafeImageUrl(unit?.icon?.default || "");
  const unitType = unit?.type?.trim() || "未設定";

  const characterIcons = buildCharacterIconList(character);
  const publicPatterns = getPublicPatterns(unit);

  const characterIconHtml = characterIcons.length > 0
    ? characterIcons.map(icon => `
        <div class="iconCard">
          <img src="${escapeHtml(icon.url)}" alt="${escapeHtml(icon.name)}">
          <div class="iconName">${escapeHtml(icon.name)}</div>
        </div>
      `).join("")
    : `<p class="emptyText">キャラアイコンはありません</p>`;

  const publicPatternHtml = publicPatterns.length > 0
    ? publicPatterns.map((pattern, index) => {
        const skills = getPatternSkillList(pattern);

        const skillHtml = skills.length > 0
          ? `
            <ul class="skillList">
              ${skills.map(skill => {
                const skillName =
                  skillHandlers[skill.type]?.name || skill.type;

                return `<li>${escapeHtml(skillName)}</li>`;
              }).join("")}
            </ul>
          `
          : `<p class="emptyText">スキル未設定</p>`;

        return `
          <section class="profileSection">
            <h3>公開設定${index + 1}</h3>
            <div class="profileRow">
              <span class="label">設定名</span>
              <span class="value">${escapeHtml(pattern?.name?.trim() || "未設定")}</span>
            </div>
            ${skillHtml}
          </section>
        `;
      }).join("")
    : `
      <section class="profileSection">
        <h3>公開スキル設定</h3>
        <p class="emptyText">公開されている設定はありません</p>
      </section>
    `;

  profilePage.innerHTML = `
    <section class="profileCard">
      <div class="profileHeader">
        <div class="duckIconWrap">
          <img class="duckIcon" src="${escapeHtml(duckIconUrl)}" alt="アヒルデフォルトアイコン">
        </div>
        <div class="profileHeaderText">
          <div class="enoText">Eno.${escapeHtml(eno)}</div>
          <h2 class="characterName">${escapeHtml(fullName)}</h2>
        </div>
      </div>

      <section class="profileSection">
        <h3>キャラ設定文</h3>
        <p class="profileText">${escapeHtml(profileText)}</p>
      </section>

      <section class="profileSection">
        <h3>キャラアイコン一覧</h3>
        <div class="iconGrid">
          ${characterIconHtml}
        </div>
      </section>

      <section class="profileSection">
        <h3>アヒル情報</h3>
        <div class="profileRow">
          <span class="label">タイプ</span>
          <span class="value">${escapeHtml(unitType)}</span>
        </div>
      </section>

      ${publicPatternHtml}
    </section>
  `;
}

function initProfilePage() {
  const eno = getEnoFromQuery();

  if (!eno) {
    renderNotFound("Enoが指定されていません");
    return;
  }

  const character = loadCharacter(eno);
  const unit = loadUnit(eno, 1);

  if (!character && !unit) {
    renderNotFound("このEnoのプロフィールは存在しません");
    return;
  }

  renderProfile(eno, character || {}, unit || {});
}

initProfilePage();
