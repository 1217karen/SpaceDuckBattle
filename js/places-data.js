//places-data.js

export const places = [
  {
    placeId: "F1-1",
    groupId: "F1",
    parentId: null,
    kind: "field",
    layer: "main",
    name: "テストフィールド",
    accessType: null
  },
  {
    placeId: "F1-2",
    groupId: "F1",
    parentId: null,
    kind: "field",
    layer: "side",
    name: "テストフィールド サイド",
    accessType: null
  },
  {
    placeId: "F1-3",
    groupId: "F1",
    parentId: null,
    kind: "field",
    layer: "local",
    name: "テストフィールド ローカル",
    accessType: null
  },

  {
    placeId: "E1-1",
    groupId: "E1",
    parentId: "F1",
    kind: "area",
    layer: "main",
    name: "テストエリア1",
    accessType: null
  },
  {
    placeId: "E1-2",
    groupId: "E1",
    parentId: "F1",
    kind: "area",
    layer: "side",
    name: "テストエリア1 サイド",
    accessType: null
  },
  {
    placeId: "E1-3",
    groupId: "E1",
    parentId: "F1",
    kind: "area",
    layer: "local",
    name: "テストエリア1 ローカル",
    accessType: null
  },

  {
    placeId: "E2-1",
    groupId: "E2",
    parentId: "F1",
    kind: "area",
    layer: "main",
    name: "テストエリア2",
    accessType: null
  },
  {
    placeId: "E2-2",
    groupId: "E2",
    parentId: "F1",
    kind: "area",
    layer: "side",
    name: "テストエリア2 サイド",
    accessType: null
  },
  {
    placeId: "E2-3",
    groupId: "E2",
    parentId: "F1",
    kind: "area",
    layer: "local",
    name: "テストエリア2 ローカル",
    accessType: null
  },

  {
    placeId: "R1",
    groupId: "R1",
    parentId: "E1",
    kind: "room",
    layer: null,
    name: "テストルーム1",
    accessType: "public"
  },
  {
    placeId: "R2",
    groupId: "R2",
    parentId: "E1",
    kind: "room",
    layer: null,
    name: "テストルーム2",
    accessType: "password"
  },
  {
    placeId: "R3",
    groupId: "R3",
    parentId: "E2",
    kind: "room",
    layer: null,
    name: "テストルーム3",
    accessType: "private"
  }
];
