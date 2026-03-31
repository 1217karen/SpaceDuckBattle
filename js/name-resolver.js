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


// ========================================
// 通信パネル表示名
// 優先順位:
// 1. 個別指定名
// 2. アイコンに紐づいた発言者名
// 3. デフォルトキャラ名
// 4. デフォルトユニット名
//
// 発言テキストも発言用アイコン指定もない場合は
// 「キャラ発言」ではなく「ユニット表示維持」とみなし、
// デフォルトユニット名を優先する
// ========================================

function findIconSpeakerName(commIcons, iconUrl) {
  if (!Array.isArray(commIcons)) return "";
  if (typeof iconUrl !== "string" || iconUrl.trim() === "") return "";

  const normalizedUrl = iconUrl.trim();

  const matched = commIcons.find(icon => {
    if (!icon || typeof icon !== "object") return false;
    if (typeof icon.url !== "string") return false;
    return icon.url.trim() === normalizedUrl;
  });

  if (!matched) return "";

  return pickFirstName(
    matched.speakerName,
    matched.name
  );
}

export function resolveCommDisplayName({
  manualName = "",
  iconUrl = "",
  text = "",
  commIcons = [],
  defaultCharacterName = "",
  defaultUnitName = "",
  fallback = ""
} = {}) {
  const normalizedText = normalizeName(text);
  const normalizedIconUrl = normalizeName(iconUrl);

  const hasCommText = normalizedText !== "";
  const hasCommIcon = normalizedIconUrl !== "";

  if (!hasCommText && !hasCommIcon) {
    return pickFirstName(
      defaultUnitName,
      fallback
    );
  }

  const iconSpeakerName =
    findIconSpeakerName(commIcons, normalizedIconUrl);

  return pickFirstName(
    manualName,
    iconSpeakerName,
    defaultCharacterName,
    defaultUnitName,
    fallback
  );
}
