// inventory-service.js

import { getItemById } from "./shop-service.js";

const DEFAULT_MONEY = 1000;
const INVENTORY_KEY_PREFIX = "inventory:";

function makeInventoryKey(eno) {
  return `${INVENTORY_KEY_PREFIX}${eno}`;
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeEno(eno) {
  const numberEno = Number(eno);
  return Number.isInteger(numberEno) && numberEno > 0
    ? numberEno
    : null;
}

function createInitialInventory(eno) {
  return {
    eno,
    money: DEFAULT_MONEY,
    items: [],
    logs: []
  };
}

function normalizeInventory(rawInventory, eno) {
  const base = createInitialInventory(eno);

  if (!rawInventory || typeof rawInventory !== "object") {
    return base;
  }

  const money = Number(rawInventory.money);

  return {
    ...base,
    ...rawInventory,
    eno,
    money: Number.isFinite(money) ? Math.max(0, Math.floor(money)) : DEFAULT_MONEY,
    items: Array.isArray(rawInventory.items) ? rawInventory.items : [],
    logs: Array.isArray(rawInventory.logs) ? rawInventory.logs : []
  };
}

function loadInventory(eno) {
  const normalizedEno = normalizeEno(eno);

  if (!normalizedEno) {
    return null;
  }

  return normalizeInventory(
    safeParse(localStorage.getItem(makeInventoryKey(normalizedEno)), null),
    normalizedEno
  );
}

function saveInventory(eno, inventory) {
  const normalizedEno = normalizeEno(eno);

  if (!normalizedEno) {
    throw new Error("所持品の保存には eno が必要です");
  }

  const normalizedInventory = normalizeInventory(inventory, normalizedEno);

  localStorage.setItem(
    makeInventoryKey(normalizedEno),
    JSON.stringify(normalizedInventory)
  );

  return normalizedInventory;
}

function getCharacterLogName(character = {}) {
  const fullName =
    typeof character.fullName === "string"
      ? character.fullName.trim()
      : "";

  const defaultName =
    typeof character.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  return fullName || defaultName || "誰か";
}

function createLogId(type) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${type}-${Date.now()}-${random}`;
}

function createPurchaseLog({ character, item, quantity, totalPrice }) {
  const name = getCharacterLogName(character);

  return {
    logId: createLogId("purchase"),
    logType: "purchase",
    createdAt: new Date().toISOString(),
    itemId: item.itemId,
    itemName: item.name,
    quantity,
    totalPrice,
    message: `${name}は${item.name}を${quantity}個購入した。`,
    isPosted: false
  };
}

function mergePurchasedItem(items, itemId, quantity) {
  const existingItem = items.find(item => item.itemId === itemId);

  if (existingItem) {
    return items.map(item =>
      item.itemId === itemId
        ? {
            ...item,
            quantity: Number(item.quantity || 0) + quantity
          }
        : item
    );
  }

  return [
    ...items,
    {
      itemId,
      quantity
    }
  ];
}

export function getInventory(eno) {
  return loadInventory(eno);
}

export function getMoney(eno) {
  return loadInventory(eno)?.money ?? DEFAULT_MONEY;
}

export function updateDebugMoney(eno, money) {
  const inventory = loadInventory(eno);
  const nextMoney = Number(money);

  if (!inventory) {
    return {
      ok: false,
      message: "ログイン情報を確認できません"
    };
  }

  if (!Number.isFinite(nextMoney) || nextMoney < 0) {
    return {
      ok: false,
      message: "所持金には0以上の数値を入力してください"
    };
  }

  saveInventory(eno, {
    ...inventory,
    money: Math.floor(nextMoney)
  });

  return {
    ok: true,
    money: Math.floor(nextMoney)
  };
}

export function getOwnedItems(eno) {
  const inventory = loadInventory(eno);

  if (!inventory) {
    return [];
  }

  return inventory.items
    .filter(item => Number(item.quantity) > 0)
    .map(item => ({
      itemId: item.itemId,
      quantity: Number(item.quantity),
      item: getItemById(item.itemId)
    }));
}

export function getInventoryLogs(eno) {
  const inventory = loadInventory(eno);

  if (!inventory) {
    return [];
  }

  return inventory.logs.slice().sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
  );
}

export function purchaseItems({ eno, character, purchaseItems } = {}) {
  const inventory = loadInventory(eno);

  if (!inventory) {
    return {
      ok: false,
      message: "ログイン情報を確認できません"
    };
  }

  const normalizedItems = Array.isArray(purchaseItems)
    ? purchaseItems.map(target => {
        const quantity = Number(target.quantity);
        const itemId = target.item?.itemId;
        const item = itemId ? getItemById(itemId) : null;

        return {
          item,
          quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 0
        };
      }).filter(target => target.item && target.quantity > 0)
    : [];

  if (normalizedItems.length === 0) {
    return {
      ok: false,
      message: "購入するアイテムの数を入力してください"
    };
  }

  const totalPrice = normalizedItems.reduce((sum, target) => {
    const price = typeof target.item.price === "number" ? target.item.price : 0;
    return sum + price * target.quantity;
  }, 0);

  if (inventory.money < totalPrice) {
    return {
      ok: false,
      message: `所持金が足りません（必要: ${totalPrice} C / 所持: ${inventory.money} C）`
    };
  }

  const nextItems = normalizedItems.reduce(
    (items, target) => mergePurchasedItem(items, target.item.itemId, target.quantity),
    inventory.items
  );

  const nextLogs = [
    ...inventory.logs,
    ...normalizedItems.map(target => {
      const price = typeof target.item.price === "number" ? target.item.price : 0;
      return createPurchaseLog({
        character,
        item: target.item,
        quantity: target.quantity,
        totalPrice: price * target.quantity
      });
    })
  ];

  const nextInventory = saveInventory(eno, {
    ...inventory,
    money: inventory.money - totalPrice,
    items: nextItems,
    logs: nextLogs
  });

  return {
    ok: true,
    money: nextInventory.money,
    totalPrice,
    logs: nextLogs.slice(inventory.logs.length)
  };
}

export function markInventoryLogPosted(eno, logId) {
  const inventory = loadInventory(eno);

  if (!inventory || !logId) {
    return false;
  }

  const nextLogs = inventory.logs.map(log =>
    log.logId === logId
      ? {
          ...log,
          isPosted: true,
          postedAt: new Date().toISOString()
        }
      : log
  );

  saveInventory(eno, {
    ...inventory,
    logs: nextLogs
  });

  return true;
}
