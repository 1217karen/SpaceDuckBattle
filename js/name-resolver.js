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
// 2. ユニットのデフォルト名
// 3. fallback
// ========================================

export function resolveUnitDisplayName({
  manualName = "",
  defaultUnitName = "",
  fallback = ""
} = {}) {
  return pickFirstName(
    manualName,
    defaultUnitName,
    fallback
  );
}
