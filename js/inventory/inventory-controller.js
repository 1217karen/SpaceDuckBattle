// inventory-controller.js

import { requireLogin, loadCharacter } from "../services/storage-service.js";
import {
  getInventory,
  getOwnedItems,
  getInventoryLogs,
  previewItemUse,
  useInventoryItem,
  updateDebugMoney
} from "../services/inventory-service.js";
import {
  getPlayerResources,
  updateDebugStamina
} from "../services/player-resource-service.js";
import { getItemActionsForContext } from "../services/item-action-service.js";

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

function renderStaminaSection(container, { eno, resources }) {
  const section = document.createElement("section");
  section.className = "inventorySection";

  const heading = document.createElement("h2");
  heading.textContent = "スタミナ";

  const staminaText = document.createElement("div");
  staminaText.className = "inventoryStaminaText";
  staminaText.textContent = `${resources.stamina} / ${resources.normalStaminaLimit}`;

  const help = document.createElement("p");
  help.className = "inventoryResourceHelp";
  help.textContent = "右側の数値は自動回復の通常上限です。アイテム使用では一時的に超える場合があります。";

  const debugBox = document.createElement("div");
  debugBox.className = "inventoryDebugMoneyBox";

  const label = document.createElement("label");
  label.className = "inventoryDebugMoneyLabel";
  label.htmlFor = "debugStaminaInput";
  label.textContent = "デバッグ用：現在スタミナ変更";

  const input = document.createElement("input");
  input.id = "debugStaminaInput";
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(resources.stamina);
  input.className = "inventoryDebugMoneyInput";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-primaryNew inventoryDebugMoneyButton";
  button.textContent = "変更";
  button.addEventListener("click", () => {
    const result = updateDebugStamina(eno, input.value);

    if (!result.ok) {
      alert(result.message);
      return;
    }

    renderInventoryPage();
  });

  debugBox.appendChild(label);
  debugBox.appendChild(input);
  debugBox.appendChild(button);
  section.appendChild(heading);
  section.appendChild(staminaText);
  section.appendChild(help);
  section.appendChild(debugBox);
  container.appendChild(section);
}

function buildItemUseConfirmMessage(preview) {
  const lines = [
    `${preview.item.name}を${preview.quantity}個「${preview.action.label}」で使用しますか？`,
    "",
    `所持数：${preview.ownedQuantity} → ${preview.ownedQuantity - preview.quantity}`
  ];

  if (preview.recovery) {
    lines.push(
      `スタミナ：${preview.recovery.staminaBefore} → ${preview.recovery.staminaAfter}`,
      `実際の回復量：${preview.recovery.appliedRecovery}`
    );

    if (preview.recovery.ineffectiveQuantity > 0) {
      lines.push(
        "",
        `注意：${preview.recovery.ineffectiveQuantity}個分は、使用時点で上限を超えるため回復しません。`,
        "回復しない分もアイテムは消費されます。"
      );
    }
  }

  return lines.join("\n");
}

function renderOwnedItemsSection(container, ownedItems, { eno, character }) {
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
    row.className = "common-card-framed common-card-subtle inventoryItemRow";

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

    const actionArea = document.createElement("div");
    actionArea.className = "inventoryItemActions";
    const inventoryActions = getItemActionsForContext(item, "inventory");

    inventoryActions.forEach(action => {
      if (Number(action.consumeQuantity) < 1) return;

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.min = "1";
      quantityInput.max = String(quantity);
      quantityInput.step = "1";
      quantityInput.value = "1";
      quantityInput.className = "inventoryUseQuantity";
      quantityInput.setAttribute("aria-label", `${item.name}の使用個数`);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "button-box inventoryUseButton";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        const preview = previewItemUse({
          eno,
          itemId,
          actionId: action.actionId,
          quantity: Number(quantityInput.value)
        });

        if (!preview.ok) {
          alert(preview.message);
          return;
        }

        if (!window.confirm(buildItemUseConfirmMessage(preview))) return;

        const result = useInventoryItem({
          eno,
          character,
          itemId,
          actionId: action.actionId,
          quantity: preview.quantity
        });

        if (!result.ok) {
          alert(result.message);
          return;
        }

        alert(`${item.name}を使用しました。`);
        renderInventoryPage();
      });

      actionArea.appendChild(quantityInput);
      actionArea.appendChild(button);
    });

    row.appendChild(main);
    const side = document.createElement("div");
    side.className = "inventoryItemSide";
    side.appendChild(count);
    side.appendChild(actionArea);
    row.appendChild(side);
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
    row.className = "common-card-framed common-card-subtle inventoryLogRow";

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
  const resources = getPlayerResources(eno);

  app.innerHTML = "";

  const ownerText = document.createElement("p");
  ownerText.className = "inventoryOwnerText";
  ownerText.textContent = `${character?.fullName || character?.defaultName || `Eno.${eno}`} の所持情報です。`;
  app.appendChild(ownerText);

  renderMoneySection(app, {
    eno,
    money: inventory?.money ?? 1000
  });

  renderStaminaSection(app, { eno, resources });

  renderOwnedItemsSection(app, getOwnedItems(eno), { eno, character });
  renderLogsSection(app, getInventoryLogs(eno));
}

renderInventoryPage();
