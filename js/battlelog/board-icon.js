// board-icon.js

import { getNoImageUrl } from "../common/icon-picker.js";

export function normalizeUnitIconSet(unit = {}) {
  const iconSet = unit.iconSet || {};

  return {
    default:
      typeof iconSet.default === "string"
        ? iconSet.default
        : unit.icon || "",
    N:
      typeof iconSet.N === "string"
        ? iconSet.N
        : "",
    E:
      typeof iconSet.E === "string"
        ? iconSet.E
        : "",
    S:
      typeof iconSet.S === "string"
        ? iconSet.S
        : "",
    W:
      typeof iconSet.W === "string"
        ? iconSet.W
        : ""
  };
}

export function resolveBoardIcon(unit = {}) {
  const iconSet =
    normalizeUnitIconSet(unit);

  const facing =
    typeof unit.facing === "string"
      ? unit.facing
      : "";

  const facingIcon =
    typeof iconSet[facing] === "string"
      ? iconSet[facing].trim()
      : "";

  const defaultIcon =
    typeof iconSet.default === "string"
      ? iconSet.default.trim()
      : "";

  return (
    facingIcon ||
    defaultIcon ||
    getNoImageUrl()
  );
}
