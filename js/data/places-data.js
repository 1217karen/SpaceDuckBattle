//places-data.js

export const places = [
{
  placeId: "F1-1",
  groupId: "F1",
  parentId: null,
  kind: "field",
  layer: "main",
  name: "テストフィールド",
  shortDescription: "ここはテスト用のフィールドです。",
  longDescription: "ここには詳細説明文が入ります。あとで場所ごとの案内や特徴を書けるようにします。",
  lookAroundText: "{name}は周囲を見渡した。広々としたテスト用のフィールドが広がっている。",
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
  parentId: "F1-1",
  kind: "area",
  layer: "main",
  name: "テストエリア1",
  lookAroundText: "{name}は周囲を見回した。フィールドから少し奥まったエリアだ。",
  accessType: null
},
  {
    placeId: "E1-2",
    groupId: "E1",
    parentId: "F1-1",
    kind: "area",
    layer: "side",
    name: "テストエリア1 サイド",
    accessType: null
  },
  {
    placeId: "E1-3",
    groupId: "E1",
    parentId: "F1-1",
    kind: "area",
    layer: "local",
    name: "テストエリア1 ローカル",
    accessType: null
  },

{
  placeId: "E2-1",
  groupId: "E2",
  parentId: "F1-1",
  kind: "area",
  layer: "main",
  name: "テストエリア2",
  lookAroundText: "{name}は周囲を見回した。エリア１とは逆方向の分岐だ。",
  accessType: null
},
  {
    placeId: "E2-2",
    groupId: "E2",
    parentId: "F1-1",
    kind: "area",
    layer: "side",
    name: "テストエリア2 サイド",
    accessType: null
  },
  {
    placeId: "E2-3",
    groupId: "E2",
    parentId: "F1-1",
    kind: "area",
    layer: "local",
    name: "テストエリア2 ローカル",
    accessType: null
  },

  {
    placeId: "R1",
    groupId: "R1",
    parentId: "E1-1",
    kind: "room",
    layer: null,
    name: "テストルーム1",
    accessType: "public",
    showParentMainAreaPreview: true
  },
  {
    placeId: "R2",
    groupId: "R2",
    parentId: "E1-1",
    kind: "room",
    layer: null,
    name: "テストルーム2",
    accessType: "password",
    showParentMainAreaPreview: false
  },
  {
    placeId: "R3",
    groupId: "R3",
    parentId: "E2-1",
    kind: "room",
    layer: null,
    name: "テストルーム3",
    accessType: "private",
    showParentMainAreaPreview: true
  }
];
