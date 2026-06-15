// chat-action-data.js

export const chatActionDefinitions = [
  {
    actionId: "look-around",
    label: "周囲を見る",
    type: "common",
    description: "周囲を見ます。",
    resultBaseText: "{name}は周囲を見渡した。",
    resultSuffixTexts: [
      "ここは{placeName}だ。"
    ]
  },

  {
    actionId: "park-walk",
    label: "ウォーキングをする",
    type: "place",
    description: "公園内を軽く歩きます。",
    resultBaseText: "{name}はセントラルパーク内を歩いた。",
    resultSuffixTexts: [
      "見慣れない鳥が空高く飛んでいる。",
      "少し強い風が後ろから吹いた。",
      "どこからか子供の投げたボールが飛んできた。",
      "野花が咲いているのを見つけた。",
      "街路樹から鳥の鳴き声が聞こえる。"
    ]
  },
  {
    actionId: "park-fountain-coin",
    label: "噴水の壺に小銭を投げる",
    type: "place",
    description: "入ると願いが叶うという噴水の壺に小銭を投げ入れます。",
    resultBaseText: "{name}は噴水の壺目掛けて小銭を投げた。",
    resultSuffixTexts: [
      "小銭はきれいな弧を描いて壺に入った。",
      "しかし壺の縁に弾かれてしまった。",
      "しかし全く違う方向に飛んで行ってしまった。",
      "しかし風に煽られて逸れてしまった。",
      "しかし手が滑って小銭は足元に落ちた。"
    ]
  },

  {
    actionId: "play-swing",
    label: "ブランコに乗る",
    type: "place",
    description: "ブランコに乗ります。",
    resultBaseText: "{name}はブランコに乗った。",
    resultSuffixTexts: [
      "ブランコはゆっくりと揺れている。",
      "鎖が小さくきしむ音を立てた。",
      "少し強くこいだら、人工空が近づいては遠ざかった。",
      "思ったより勢いがついて少し驚いた。",
      "しばらく揺れているうちに、少しだけ童心に返った。"
    ]
  },
  {
    actionId: "play-slide",
    label: "滑り台を滑る",
    type: "place",
    description: "滑り台を滑ります。",
    resultBaseText: "{name}は滑り台を滑った。",
    resultSuffixTexts: [
      "可もなく不可もない滑りをした。",
      "服の裾が砂だらけになった。",
      "勢いが出て猛スピードで滑り降りた。",
      "しかし途中で引っかかってしまった。",
      "着地は少しぎこちなかった。"
    ]
  },
  {
    actionId: "play-jungle-gym",
    label: "ジャングルジムに登る",
    type: "place",
    description: "ジャングルジムに登ります。",
    resultBaseText: "{name}はジャングルジムに登った。",
    resultSuffixTexts: [
      "思ったより高い位置まで登れた。",
      "上から遊具広場を見渡した。",
      "慎重に足場を選びながら進んだ。",
      "途中で降りるタイミングを見失った。",
      "金属の手すりが少しひんやりしていた。"
    ]
  },

  {
    actionId: "deck-buy-drink",
    label: "飲み物を買う",
    type: "place",
    description: "自動販売機で飲み物を買います。",
    resultBaseText: "{name}は自動販売機で飲み物を買った。",
    resultSuffixTexts: [
      "冷たい缶飲料が取り出し口に落ちてきた。",
      "見慣れない味の飲み物が出てきた。",
      "取り出し口で缶が少し引っかかった。",
      "しかし売り切れのランプが点いていた。",
      "どれにするか少し迷ってから、無難なものを選んだ。"
    ]
  },
  {
    actionId: "deck-sit-chair",
    label: "ベンチに座る",
    type: "place",
    description: "休憩デッキのベンチに座ります。",
    resultBaseText: "{name}はベンチに腰掛けた。",
    resultSuffixTexts: [
      "木の匂いがした。",
      "遊具広場から声が響いている。",
      "しばらく周囲の環境音に耳を澄ませた。",
      "通り過ぎる人々をぼんやり眺めた。",
      "思ったより座り心地がよかった。"
    ]
  }
];
