// inventory-controller.js

import { requireLogin, loadCharacter } from "../services/storage-service.js";
import {
  getInventory,
  getOwnedItems,
  getInventoryLogs,
  updateDebugMoney
} from "../services/inventory-service.js";

const app = document.querySelector("#inventoryApp");

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ja-JP");
}

function renderMoneySection(container, { eno, money }) {
  const section = document.createElement("section");
  section.className = "inventorySection";

  const heading = document.createElement("h2");
  heading.textContent = "所持金";
  section.appendChild(heading);

  const moneyText = document.createElement("div");
  moneyText.className = "inventoryMoneyText";
  moneyText.textContent = `${money} C`;
  section.appendChild(moneyText);

  const debugBox = document.createElement("div");
  debugBox.className = "inventoryDebugMoneyBox";

  const label = document.createElement("label");
  label.className = "inventoryDebugMoneyLabel";
  label.htmlFor = "debugMoneyInput";
  label.textContent = "デバッグ用：所持金変更";

  const input = document.createElement("input");
  input.id = "debugMoneyInput";
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(money);
  input.className = "inventoryDebugMoneyInput";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-primaryNew inventoryDebugMoneyButton";
  button.textContent = "変更";

  button.addEventListener("click", () => {
    const result = updateDebugMoney(eno, input.value);

    if (!result.ok) {
      alert(result.message);
      return;
    }

    renderInventoryPage();
  });

  debugBox.appendChild(label);
  debugBox.appendChild(input);
  debugBox.appendChild(button);
  section.appendChild(debugBox);

  container.appendChild(section);
}

function renderOwnedItemsSection(container, ownedItems) {
  const section = document.createElement("section");
  section.className = "inventorySection";

  const heading = document.createElement("h2");
  heading.textContent = "所持アイテム";
  section.appendChild(heading);

  if (ownedItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "inventoryEmptyText";
    empty.textContent = "所持アイテムはありません。";
    section.appendChild(empty);
    container.appendChild(section);
    return;
  }

  const list = document.createElement("div");
  list.className = "inventoryItemList";

  ownedItems.forEach(({ item, itemId, quantity }) => {
    const row = document.createElement("div");
    row.className = "inventoryItemRow";

    const main = document.createElement("div");
    main.className = "inventoryItemMain";

    const name = document.createElement("div");
    name.className = "inventoryItemName";
    name.textContent = item?.name ?? `不明なアイテム: ${itemId}`;
    main.appendChild(name);

    if (item?.description) {
      const description = document.createElement("div");
      description.className = "inventoryItemDescription";
      description.textContent = item.description;
      main.appendChild(description);
    }

    const meta = document.createElement("div");
    meta.className = "inventoryItemMeta";
    meta.textContent = item?.category ? `カテゴリ: ${item.category}` : "カテゴリ: -";
    main.appendChild(meta);

    const count = document.createElement("div");
    count.className = "inventoryItemCount";
    count.textContent = `${quantity}個`;

    row.appendChild(main);
    row.appendChild(count);
    list.appendChild(row);
  });

  section.appendChild(list);
  container.appendChild(section);
}

function renderLogsSection(container, logs) {
  const section = document.createElement("section");
  section.className = "inventorySection";

  const heading = document.createElement("h2");
  heading.textContent = "ログ一覧";
  section.appendChild(heading);

  if (logs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "inventoryEmptyText";
    empty.textContent = "保存されているログはありません。";
    section.appendChild(empty);
    container.appendChild(section);
    return;
  }

  const list = document.createElement("div");
  list.className = "inventoryLogList";

  logs.forEach(log => {
    const row = document.createElement("div");
    row.className = "inventoryLogRow";

    if (log.isPosted) {
      row.classList.add("is-posted");
    }

    const message = document.createElement("div");
    message.className = "inventoryLogMessage";
    message.textContent = log.message ?? "";

    const meta = document.createElement("div");
    meta.className = "inventoryLogMeta";
    meta.textContent = `${formatDateTime(log.createdAt)} / ${log.isPosted ? "投稿済み" : "未投稿"}`;

    row.appendChild(message);
    row.appendChild(meta);
    list.appendChild(row);
  });

  section.appendChild(list);
  container.appendChild(section);
}

function renderInventoryPage() {
  if (!app) return;

  const account = requireLogin();

  if (!account) {
    return;
  }

  const eno = account.eno;
  const inventory = getInventory(eno);
  const character = loadCharacter(eno);

  app.innerHTML = "";

  const ownerText = document.createElement("p");
  ownerText.className = "inventoryOwnerText";
  ownerText.textContent = `${character?.fullName || character?.defaultName || `Eno.${eno}`} の所持情報です。`;
  app.appendChild(ownerText);

  renderMoneySection(app, {
    eno,
    money: inventory?.money ?? 1000
  });

  renderOwnedItemsSection(app, getOwnedItems(eno));
  renderLogsSection(app, getInventoryLogs(eno));
}

renderInventoryPage();
