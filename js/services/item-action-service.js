// item-action-service.js

function getCharacterActionName(character = {}) {
  const fullName = typeof character.fullName === "string"
    ? character.fullName.trim()
    : "";
  const defaultName = typeof character.defaultName === "string"
    ? character.defaultName.trim()
    : "";
  return fullName || defaultName || "誰か";
}

function applyTemplate(template, values) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, key) =>
    values[key] ?? match
  );
}

export function hasRequiredEnvironmentTags(action, place) {
  const requiredTags = Array.isArray(action?.requiredEnvironmentTags)
    ? action.requiredEnvironmentTags
    : [];
  const environmentTags = new Set(
    Array.isArray(place?.environmentTags) ? place.environmentTags : []
  );

  return requiredTags.every(tagId => environmentTags.has(tagId));
}

function createHoldAction() {
  return {
    actionId: "hold",
    label: "手に持つ",
    actionKind: "hold",
    consumptionPolicy: "preserve",
    message: "{name}は{itemName}を手に持った。"
  };
}

export function getItemActionsForContext(item, context, place = null) {
  if (!item || !context) return [];

  const actions = [];

  if (context === "chat" && item.holdable !== false) {
    actions.push(createHoldAction());
  }

  const itemActions = Array.isArray(item.actions) ? item.actions : [];
  itemActions.forEach(action => {
    const actionKind = action.actionKind === "special" ? "special" : "normal";

    if (context === "inventory" && actionKind !== "normal") return;
    if (context === "chat" && !["normal", "special"].includes(actionKind)) return;

    if (actionKind === "special" && !hasRequiredEnvironmentTags(action, place)) return;
    actions.push(action);
  });

  return actions;
}

export function getItemActionById(item, actionId) {
  if (!item || !actionId) return null;
  if (actionId === "hold" && item.holdable !== false) return createHoldAction();
  return (Array.isArray(item.actions) ? item.actions : [])
    .find(action => action.actionId === actionId) || null;
}

export function buildItemActionMessage({
  item,
  action,
  character,
  quantity = 1
} = {}) {
  if (!item || !action) return "";

  const normalizedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  const resultValues = Array.isArray(action.resultValues)
    ? action.resultValues.filter(value => String(value).trim() !== "")
    : [];
  const result = resultValues.length > 0
    ? resultValues[Math.floor(Math.random() * resultValues.length)]
    : "";
  const template = normalizedQuantity > 1 && action.pluralMessage
    ? action.pluralMessage
    : action.message;

  return applyTemplate(template, {
    name: getCharacterActionName(character),
    itemName: item.name,
    quantity: normalizedQuantity,
    result
  });
}
