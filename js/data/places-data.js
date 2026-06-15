// places-data.js

export const places = [
  {
    placeId: "F1-1",
    groupId: "F1",
    zoneId: "middle",
    parentId: null,
    kind: "field",
    layer: "main",
    name: "セントラルパーク",
    shortDescription: "中層生活区に整備された、コロニー住民たちの憩いの公園。",
    longDescription: "人工空と環境制御の光に包まれた公共公園。遊歩道や休憩所、遊具広場が整備され、様々な人が気軽に立ち寄る。",
    lookAroundText: "{name}は周囲を見渡した。人工空の下に、整えられた緑地と遊歩道が広がっている。",
    actionIds: [
      "park-walk",
      "park-fountain-coin"
    ],
    accessType: null
  },
  {
    placeId: "F1-2",
    groupId: "F1",
    zoneId: "middle",
    parentId: null,
    kind: "field",
    layer: "side",
    name: "セントラルパーク サイド",
    accessType: null
  },
  {
    placeId: "F1-3",
    groupId: "F1",
    zoneId: "middle",
    parentId: null,
    kind: "field",
    layer: "local",
    name: "セントラルパーク ローカル",
    accessType: null
  },

  {
    placeId: "E1-1",
    groupId: "E1",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "main",
    name: "遊具広場",
    shortDescription: "色とりどりの遊具が並ぶ、公園のにぎやかな一角。",
    longDescription: "低重力環境にも対応した遊具が並ぶ遊具広場。子どもたちの遊び場としてだけでなく、大人たちの軽い運動や息抜きにも使われている。",
    lookAroundText: "{name}は周囲を見渡した。低重力対応の遊具が並び、楽しげな声があちこちから聞こえてくる。",
    actionIds: [
      "play-swing",
      "play-slide",
      "play-jungle-gym"
    ],
    accessType: null
  },
  {
    placeId: "E1-2",
    groupId: "E1",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "side",
    name: "遊具広場 サイド",
    accessType: null
  },
  {
    placeId: "E1-3",
    groupId: "E1",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "local",
    name: "遊具広場 ローカル",
    accessType: null
  },

  {
    placeId: "E2-1",
    groupId: "E2",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "main",
    name: "休憩デッキ",
    shortDescription: "公園を見渡せる、静かな休憩スペース。",
    longDescription: "遊具広場を一望できる休憩所。ベンチや自動販売機が置かれ、待ち合わせや雑談の場に使われている。",
    lookAroundText: "{name}は周囲を見渡した。ベンチと小さなテーブルが並び、穏やかな環境音が流れている。",
    actionIds: [
      "deck-buy-drink",
      "deck-sit-chair"
    ],
    accessType: null
  },
  {
    placeId: "E2-2",
    groupId: "E2",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "side",
    name: "休憩デッキ サイド",
    accessType: null
  },
  {
    placeId: "E2-3",
    groupId: "E2",
    zoneId: "middle",
    parentId: "F1-1",
    kind: "area",
    layer: "local",
    name: "休憩デッキ ローカル",
    accessType: null
  },

  {
    placeId: "R1",
    groupId: "R1",
    zoneId: "middle",
    parentId: "E1-1",
    kind: "room",
    layer: null,
    name: "公開ルーム",
    accessType: "public",
    showParentMainAreaPreview: true
  },
  {
    placeId: "R2",
    groupId: "R2",
    zoneId: "middle",
    parentId: "E1-1",
    kind: "room",
    layer: null,
    name: "鍵付きルーム",
    accessType: "password",
    showParentMainAreaPreview: false
  },
  {
    placeId: "R3",
    groupId: "R3",
    zoneId: "middle",
    parentId: "E2-1",
    kind: "room",
    layer: null,
    name: "非公開ルーム",
    accessType: "private",
    showParentMainAreaPreview: true
  }
];
