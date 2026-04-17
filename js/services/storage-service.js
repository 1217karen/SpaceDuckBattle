//storage-service.js

const CURRENT_LOGIN_ID_KEY = "currentLoginId";
const ENO_COUNTER_KEY = "enoCounter";
const DEFAULT_NO_IMAGE_URL = "https://example.com/noimg.png";

function makeAccountKey(loginId) {
  return `account:${loginId}`;
}

function makeCharacterKey(eno) {
  return `character:${eno}`;
}

function makeUnitKey(eno, unitNo = 1) {
  return `unit:${eno}:${unitNo}`;
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function getNextEno() {
  const currentValue =
    Number(localStorage.getItem(ENO_COUNTER_KEY) || 0);

  const nextEno = currentValue + 1;

  localStorage.setItem(
    ENO_COUNTER_KEY,
    String(nextEno)
  );

  return nextEno;
}

export function getRegisteredEnoMax() {
  return Number(localStorage.getItem(ENO_COUNTER_KEY) || 0);
}

export function saveAccount(account) {
  if (!account || !account.loginId) {
    throw new Error("account.loginId が必要です");
  }

  localStorage.setItem(
    makeAccountKey(account.loginId),
    JSON.stringify(account)
  );
}

export function getAccountByLoginId(loginId) {
  if (!loginId) return null;

  return safeParse(
    localStorage.getItem(makeAccountKey(loginId)),
    null
  );
}

export function accountExists(loginId) {
  return !!getAccountByLoginId(loginId);
}

export function setCurrentLoginId(loginId) {
  if (!loginId) {
    localStorage.removeItem(CURRENT_LOGIN_ID_KEY);
    return;
  }

  localStorage.setItem(
    CURRENT_LOGIN_ID_KEY,
    loginId
  );
}

export function getCurrentLoginId() {
  return localStorage.getItem(CURRENT_LOGIN_ID_KEY);
}

export function getCurrentAccount() {
  const loginId = getCurrentLoginId();
  if (!loginId) return null;

  return getAccountByLoginId(loginId);
}

export function clearCurrentLoginId() {
  localStorage.removeItem(CURRENT_LOGIN_ID_KEY);
}

export function saveCharacter(eno, character) {
  if (!eno) {
    throw new Error("character 保存には eno が必要です");
  }

  const data = {
    ...character,
    eno
  };

  localStorage.setItem(
    makeCharacterKey(eno),
    JSON.stringify(data)
  );
}

export function loadCharacter(eno) {
  if (!eno) return null;

  return safeParse(
    localStorage.getItem(makeCharacterKey(eno)),
    null
  );
}

export function saveUnit(eno, unitNo = 1, unit) {
  if (!eno) {
    throw new Error("unit 保存には eno が必要です");
  }

  const data = {
    ...unit,
    eno,
    unitNo
  };

  localStorage.setItem(
    makeUnitKey(eno, unitNo),
    JSON.stringify(data)
  );
}

export function loadUnit(eno, unitNo = 1) {
  if (!eno) return null;

  return safeParse(
    localStorage.getItem(makeUnitKey(eno, unitNo)),
    null
  );
}

export function createInitialCharacter({
  eno,
  fullName,
  defaultName
}) {
  return {
    eno,
    fullName: fullName ?? "",
    defaultName: defaultName ?? "",
    currentPlaceId: "F1-1",
    defaultIcon: DEFAULT_NO_IMAGE_URL,
    commIcons: [],
    commDialogues: {}
  };
}


export function createInitialUnit({
  eno,
  unitNo = 1,
  name
}) {
  return {
    eno,
    unitNo,
    name: name ?? "",
    type: "attack",
    icon: {
      default: DEFAULT_NO_IMAGE_URL,
      N: DEFAULT_NO_IMAGE_URL,
      E: DEFAULT_NO_IMAGE_URL,
      S: DEFAULT_NO_IMAGE_URL,
      W: DEFAULT_NO_IMAGE_URL
    },
    stats: {
      atk: 0,
      def: 0,
      heal: 0,
      speed: 0,
      cri: 0,
      tec: 0
    },
    patterns: [
      {
        name: "",
        public: true,
        skills: [
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" }
        ]
      },
      {
        name: "",
        public: false,
        skills: [
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" }
        ]
      },
      {
        name: "",
        public: false,
        skills: [
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" },
          { type: "" }
        ]
      }
    ]
  };
}

export function requireLogin(redirectTo = "./index.html") {
  const account = getCurrentAccount();

  if (!account?.loginId) {
    window.location.href = redirectTo;
    return null;
  }

  return account;
}
