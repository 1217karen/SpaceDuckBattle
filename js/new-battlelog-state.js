//new-battlelog-state.js

export const battleState = {
  // 再生制御
  speed: 1,
  autoPlay: false,

  // ログ進行
  logIndex: 0,
  battleLog: [],

  // UI状態
  uiTurn: 0,
  requiredSet: new Set(),
  actedSet: new Set(),

  // 盤面
  boardState: { units: {} },

  // 外部参照
  nameMap: {},
  turnDisplay: null,
  logArea: null,
  nextBtn: null
};

