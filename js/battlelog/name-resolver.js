// js/name-resolver.js

function normalizeName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function pickFirstName(...candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeName(candidate);
    if (normalized !== "") {
      return normalized;
    }
  }

  return "";
}

// ========================================
// キャラクター表示名
// 優先順位:
// 1. 手動入力名
// 2. アイコンに紐づいた名前
// 3. キャラクターのデフォルト名
// 4. fallback
// ========================================

export function resolveCharacterDisplayName({
  manualName = "",
  iconName = "",
  defaultCharacterName = "",
  fallback = ""
} = {}) {
  return pickFirstName(
    manualName,
    iconName,
    defaultCharacterName,
    fallback
  );
}

// ========================================
// ユニット表示名
// 優先順位:
// 1. 明示指定名
// 2. ユニット名
// 3. fallback
// ========================================

export function resolveUnitDisplayName({
  manualName = "",
  unitName = "",
  fallback = ""
} = {}) {
  return pickFirstName(
    manualName,
    unitName,
    fallback
  );
}


// ========================================
// 通信パネル表示名
// セリフありの優先順位:
// 1. 個別指定名
// 2. アイコンに紐づいた発言者名
// 3. デフォルトキャラ名
// 4. fallback
//
// セリフなしの場合は「キャラ発言」ではなく
// 「ユニット表示維持」とみなし、ユニット名を優先する
// ========================================

function normalizeCommName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function findCommIconNameById(commIcons, iconId) {
  if (!Array.isArray(commIcons)) return "";

  const safeIconId =
    Number(iconId || 0);

  if (!safeIconId) return "";

  const matched = commIcons.find(item => {
    if (!item || typeof item !== "object") return false;
    return Number(item.id || 0) === safeIconId;
  });

  return normalizeCommName(matched?.name);
}

export function resolveCommDisplayName({
  manualName = "",
  iconId = null,
  commIcons = [],
  defaultCharacterName = "",
  unitName = "",
  fallback = "",
  hasExplicitCommText = false
} = {}) {
  const normalizedManualName =
    normalizeCommName(manualName);

  const normalizedIconName =
    findCommIconNameById(commIcons, iconId);

  const normalizedDefaultCharacterName =
    normalizeCommName(defaultCharacterName);

  const normalizedUnitName =
    normalizeCommName(unitName);

  const normalizedFallback =
    normalizeCommName(fallback);

  if (hasExplicitCommText) {
    return pickFirstName(
      normalizedManualName,
      normalizedIconName,
      normalizedDefaultCharacterName,
      normalizedFallback
    );
  }

  return pickFirstName(
    normalizedUnitName,
    normalizedFallback
  );
}
