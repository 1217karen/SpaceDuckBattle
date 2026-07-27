// player-resource-service.js

const PLAYER_RESOURCE_KEY_PREFIX = "playerResources:";
const DEFAULT_STAMINA = 100;
const DEFAULT_NORMAL_STAMINA_LIMIT = 100;

function makePlayerResourceKey(eno) {
  return `${PLAYER_RESOURCE_KEY_PREFIX}${eno}`;
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeEno(eno) {
  const numberEno = Number(eno);
  return Number.isInteger(numberEno) && numberEno > 0
    ? numberEno
    : null;
}

function normalizeNonNegativeInteger(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : fallback;
}

function normalizePlayerResources(rawResources, eno) {
  return {
    eno,
    stamina: normalizeNonNegativeInteger(
      rawResources?.stamina,
      DEFAULT_STAMINA
    ),
    normalStaminaLimit: normalizeNonNegativeInteger(
      rawResources?.normalStaminaLimit,
      DEFAULT_NORMAL_STAMINA_LIMIT
    )
  };
}

function savePlayerResources(eno, resources) {
  const normalizedEno = normalizeEno(eno);

  if (!normalizedEno) {
    throw new Error("スタミナの保存には eno が必要です");
  }

  const normalized = normalizePlayerResources(resources, normalizedEno);
  localStorage.setItem(
    makePlayerResourceKey(normalizedEno),
    JSON.stringify(normalized)
  );
  return normalized;
}

export function getPlayerResources(eno) {
  const normalizedEno = normalizeEno(eno);
  if (!normalizedEno) return null;

  return normalizePlayerResources(
    safeParse(localStorage.getItem(makePlayerResourceKey(normalizedEno)), null),
    normalizedEno
  );
}

export function calculateStaminaRecovery({
  stamina,
  normalStaminaLimit,
  recoveryPerItem,
  quantity
} = {}) {
  const before = normalizeNonNegativeInteger(stamina, 0);
  const normalLimit = normalizeNonNegativeInteger(normalStaminaLimit, 0);
  const recovery = normalizeNonNegativeInteger(recoveryPerItem, 0);
  const itemQuantity = normalizeNonNegativeInteger(quantity, 0);

  let after = before;
  let effectiveQuantity = 0;

  for (let index = 0; index < itemQuantity; index++) {
    if (after > normalLimit) continue;

    after += recovery;
    effectiveQuantity += 1;
  }

  return {
    staminaBefore: before,
    staminaAfter: after,
    normalStaminaLimit: normalLimit,
    recoveryPerItem: recovery,
    requestedRecovery: recovery * itemQuantity,
    appliedRecovery: after - before,
    effectiveQuantity,
    ineffectiveQuantity: itemQuantity - effectiveQuantity
  };
}

export function previewStaminaRecovery(eno, recoveryPerItem, quantity = 1) {
  const resources = getPlayerResources(eno);
  if (!resources) return null;

  return calculateStaminaRecovery({
    stamina: resources.stamina,
    normalStaminaLimit: resources.normalStaminaLimit,
    recoveryPerItem,
    quantity
  });
}

export function applyStaminaRecovery(eno, recoveryPerItem, quantity = 1) {
  const resources = getPlayerResources(eno);
  if (!resources) return null;

  const recovery = previewStaminaRecovery(eno, recoveryPerItem, quantity);
  savePlayerResources(eno, {
    ...resources,
    stamina: recovery.staminaAfter
  });
  return recovery;
}

export function updateDebugStamina(eno, stamina) {
  const resources = getPlayerResources(eno);
  const nextStamina = Number(stamina);

  if (!resources) {
    return { ok: false, message: "ログイン情報を確認できません" };
  }

  if (!Number.isFinite(nextStamina) || nextStamina < 0) {
    return { ok: false, message: "スタミナには0以上の数値を入力してください" };
  }

  const saved = savePlayerResources(eno, {
    ...resources,
    stamina: Math.floor(nextStamina)
  });

  return { ok: true, resources: saved };
}
