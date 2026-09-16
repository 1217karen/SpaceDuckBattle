// environment-tags-data.js

export const environmentTagDefinitions = [
  {
    tagId: "fire_allowed",
    label: "火気使用可能",
    description: "火を扱うアクションを使用できます。",
    roomSelectable: true
  },
  {
    tagId: "waterside",
    label: "水辺",
    description: "泳ぐ、洗うなど水辺のアクションを使用できます。",
    roomSelectable: true
  },
  {
    tagId: "cooking_facility",
    label: "調理設備あり",
    description: "調理設備を使うアクションを使用できます。",
    roomSelectable: true
  },
  {
    tagId: "maintenance_facility",
    label: "整備設備あり",
    description: "装備や機体を整備するアクションを使用できます。",
    roomSelectable: true
  }
];

export function getRoomSelectableEnvironmentTags() {
  return environmentTagDefinitions.filter(tag => tag.roomSelectable);
}

export function normalizeEnvironmentTags(value, { roomSelectableOnly = false } = {}) {
  const allowedTagIds = new Set(
    environmentTagDefinitions
      .filter(tag => !roomSelectableOnly || tag.roomSelectable)
      .map(tag => tag.tagId)
  );

  return [...new Set(
    (Array.isArray(value) ? value : [])
      .filter(tagId => typeof tagId === "string")
      .map(tagId => tagId.trim())
      .filter(tagId => allowedTagIds.has(tagId))
  )];
}
