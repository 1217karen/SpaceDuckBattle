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

function isActionAvailableAtPlace(action, place) {
  const groupIds = Array.isArray(action?.placeGroupIds)
    ? action.placeGroupIds
    : [];

  return groupIds.length === 0 || groupIds.includes(place?.groupId);
}

export function getItemActionsForContext(item, context, place = null) {
  if (!item || !context) return [];

  const actions = [];

  if (context === "chat" && item.holdable !== false) {
    actions.push({
      actionId: "hold",
      label: "手に持つ",
      contexts: ["chat"],
      consumeQuantity: 0,
      message: "{name}は{itemName}を手に持った。"
    });
  }

  const itemActions = Array.isArray(item.actions) ? item.actions : [];
  itemActions.forEach(action => {
    if (!Array.isArray(action.contexts) || !action.contexts.includes(context)) {
      return;
    }

    if (!isActionAvailableAtPlace(action, place)) return;
    actions.push(action);
  });

  return actions;
}

export function getItemActionById(item, actionId) {
  if (!item || !actionId) return null;
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
