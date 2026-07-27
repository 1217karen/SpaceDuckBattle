// items-data.js

export const items = [
  {
    itemId: "drink-water",
    name: "飲料水",
    description: "環境制御区で管理された、くせのない飲料水。",
    price: 100,
    category: "drink",
    actions: [
      {
        actionId: "drink",
        label: "飲む",
        contexts: ["inventory", "chat"],
        consumeQuantity: 1,
        staminaRecovery: 10,
        message: "{name}は飲料水を飲んだ。",
        pluralMessage: "{name}は飲料水を{quantity}本飲んだ。"
      }
    ]
  },
  {
    itemId: "drink-duck-soda",
    name: "ダックソーダ",
    description: "中層でよく見かける、軽い炭酸飲料。",
    price: 160,
    category: "drink",
    actions: [
      {
        actionId: "drink",
        label: "飲む",
        contexts: ["inventory", "chat"],
        consumeQuantity: 1,
        staminaRecovery: 20,
        message: "{name}はダックソーダの栓を開け、一気に飲んだ。",
        pluralMessage: "{name}はダックソーダを{quantity}本飲んだ。"
      }
    ]
  },
  {
    itemId: "snack-energy-bar",
    name: "エナジーバー",
    description: "任務前や移動中の軽食にも使われる携帯食。",
    price: 220,
    category: "food"
  },
  {
    itemId: "food-pack-sandwich",
    name: "パックサンド",
    description: "商店街で売られている手軽な軽食。",
    price: 280,
    category: "food",
    actions: [
      {
        actionId: "eat",
        label: "食べる",
        contexts: ["inventory", "chat"],
        consumeQuantity: 1,
        staminaRecovery: 20,
        message: "{name}はパックサンドを食べた。",
        pluralMessage: "{name}はパックサンドを{quantity}個食べた。"
      }
    ]
  },
  {
    itemId: "food-duck-bun",
    name: "アヒルまん",
    description: "アヒルの形をした、ほんのり甘い蒸しまんじゅう。",
    price: 200,
    category: "food"
  },
  {
    itemId: "goods-logo-towel",
    name: "ロゴ入りタオル",
    description: "コロニーのロゴが入った小さなタオル。",
    price: 350,
    category: "goods"
  },
  {
    itemId: "gear-training-gloves",
    name: "訓練用グローブ",
    description: "訓練時に使う、丈夫で扱いやすいグローブ。",
    price: 500,
    category: "gear"
  },
  {
    itemId: "gear-maintenance-kit",
    name: "簡易整備キット",
    description: "装備やマイアヒルの軽い点検に使える道具一式。",
    price: 800,
    category: "gear"
  },
  {
    itemId: "gear-battery-pack",
    name: "予備バッテリーパック",
    description: "小型機器や装備の補助電源として使える予備バッテリー。",
    price: 650,
    category: "gear"
  },
  {
    itemId: "food-odd-carrot",
    name: "規格外ニンジン",
    description: "人工畑で採れた、少し形の変わったニンジン。",
    price: 80,
    category: "food"
  },
  {
    itemId: "food-leaf-pack",
    name: "葉物パック",
    description: "人工畑で採れた葉物野菜の詰め合わせ。",
    price: 120,
    category: "food"
  },
  {
    itemId: "food-today-vegetable",
    name: "本日の規格外野菜",
    description: "その日に余った規格外品をまとめた野菜パック。",
    price: 150,
    category: "food"
  },
  {
    itemId: "goods-dice",
    name: "サイコロ",
    description: "手のひらに収まる、ごく普通の六面サイコロ。",
    price: 120,
    category: "goods",
    actions: [
      {
        actionId: "roll",
        label: "振る",
        contexts: ["chat"],
        consumeQuantity: 0,
        resultValues: ["1", "2", "3", "4", "5", "6"],
        message: "{name}はサイコロを振った。{result}が出た。"
      }
    ]
  },
  {
    itemId: "goods-handheld-firework",
    name: "手持ち花火",
    description: "海辺で静かに楽しめる、小さな手持ち花火。",
    price: 180,
    category: "goods",
    actions: [
      {
        actionId: "light",
        label: "火をつける",
        contexts: ["chat"],
        placeGroupIds: ["E8"],
        consumeQuantity: 1,
        message: "{name}は海辺で手持ち花火に火をつけた。"
      }
    ]
  }
];
