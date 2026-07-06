// chat-shop-view.js

import { getShopIdsForPlace, getShopsForPlace } from "../services/shop-service.js";

function readPurchaseItems(purchaseTargets) {
  return purchaseTargets
    .map(target => {
      const quantity = Number.parseInt(target.quantityInput.value, 10);

      return {
        item: target.item,
        quantity: Number.isInteger(quantity) && quantity > 0
          ? quantity
          : 0
      };
    })
    .filter(target => target.quantity > 0);
}

export function renderShopSection(container, options = {}) {
  const {
    place = null,
    onPurchaseRequest = null
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "chatShopSection";

  const inner = document.createElement("div");
  inner.className = "chatShopInner";

  const shopIds = getShopIdsForPlace(place);
  const purchaseTargets = [];

  if (shopIds.length === 0) {
    const card = document.createElement("div");
    card.className = "chatShopCard";

    const text = document.createElement("p");
    text.className = "chatShopPlaceholderText";
    text.textContent = "この場所には利用できるショップがありません";

    card.appendChild(text);
    inner.appendChild(card);
    section.appendChild(inner);
    container.appendChild(section);

    return {
      section
    };
  }

  getShopsForPlace(place).forEach(({ shopId, shop, items }) => {
    const card = document.createElement("div");
    card.className = "common-card common-card-themed chatShopCard";

    if (!shop) {
      const missing = document.createElement("p");
      missing.className = "chatShopPlaceholderText";
      missing.textContent = `ショップ情報が見つかりません: ${shopId}`;
      card.appendChild(missing);
      inner.appendChild(card);
      return;
    }

    const heading = document.createElement("h3");
    heading.className = "chatShopTitle";
    heading.textContent = shop.name;
    card.appendChild(heading);

    if (shop.description) {
      const description = document.createElement("p");
      description.className = "chatShopDescription";
      description.textContent = shop.description;
      card.appendChild(description);
    }

    const itemList = document.createElement("div");
    itemList.className = "chatShopItemList";

    items.forEach(({ itemId, item }) => {
      const itemRow = document.createElement("div");
      itemRow.className = "chatShopItemRow";

      if (!item) {
        const missingItem = document.createElement("div");
        missingItem.className = "chatShopItemMain";
        missingItem.textContent = `アイテム情報が見つかりません: ${itemId}`;
        itemRow.appendChild(missingItem);
        itemList.appendChild(itemRow);
        return;
      }

      const itemMain = document.createElement("div");
      itemMain.className = "chatShopItemMain";

      const itemName = document.createElement("div");
      itemName.className = "chatShopItemName";
      itemName.textContent = item.name;
      itemMain.appendChild(itemName);

      if (item.description) {
        const itemDescription = document.createElement("div");
        itemDescription.className = "chatShopItemDescription";
        itemDescription.textContent = item.description;
        itemMain.appendChild(itemDescription);
      }

      const buyArea = document.createElement("div");
      buyArea.className = "chatShopItemBuyArea";

      const itemPrice = document.createElement("div");
      itemPrice.className = "chatShopItemPrice";

      if (typeof item.price === "number") {
        itemPrice.textContent = `${item.price} C`;
      } else {
        itemPrice.textContent = "-";
      }

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.className = "chatShopQuantityInput";
      quantityInput.min = "0";
      quantityInput.step = "1";
      quantityInput.value = "0";
      quantityInput.inputMode = "numeric";
      quantityInput.setAttribute("aria-label", `${item.name}の購入数`);

      buyArea.appendChild(itemPrice);
      buyArea.appendChild(quantityInput);

      purchaseTargets.push({
        item,
        quantityInput
      });

      itemRow.appendChild(itemMain);
      itemRow.appendChild(buyArea);
      itemList.appendChild(itemRow);
    });

    card.appendChild(itemList);
    inner.appendChild(card);
  });

  const footer = document.createElement("div");
  footer.className = "chatShopFooter";

  const purchaseButton = document.createElement("button");
  purchaseButton.type = "button";
  purchaseButton.className = "button-primaryNew chatShopPurchaseButton";
  purchaseButton.textContent = "購入";

  purchaseButton.addEventListener("click", () => {
    const purchaseItems = readPurchaseItems(purchaseTargets);

    if (purchaseItems.length === 0) {
      alert("購入するアイテムの数を入力してください");
      return;
    }

    if (typeof onPurchaseRequest === "function") {
      onPurchaseRequest(purchaseItems);
    }
  });

  footer.appendChild(purchaseButton);
  inner.appendChild(footer);

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section
  };
}

export function renderShopPurchaseConfirmModal(purchaseItems, options = {}) {
  const {
    onConfirm = null,
    onCancel = null
  } = options;

  if (!Array.isArray(purchaseItems) || purchaseItems.length === 0) {
    return null;
  }

  const overlay = document.createElement("div");
  overlay.className = "commonModalOverlay";

  const modal = document.createElement("div");
  modal.className = "commonModal";

  const title = document.createElement("h2");
  title.className = "chatShopModalTitle";
  title.textContent = "購入確認";
  modal.appendChild(title);

  const itemList = document.createElement("div");
  itemList.className = "chatShopModalItemList";

  purchaseItems.forEach(({ item, quantity }) => {
    const line = document.createElement("div");
    line.className = "chatShopModalItemLine";
    line.textContent = `${item.name}　${quantity}個`;
    itemList.appendChild(line);
  });

  modal.appendChild(itemList);

  const message = document.createElement("p");
  message.className = "chatShopModalMessage";
  message.textContent = "を購入します。よろしいですか？";
  modal.appendChild(message);

  const buttonRow = document.createElement("div");
  buttonRow.className = "chatShopModalButtonRow";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "button-primaryNew chatShopModalButton";
  confirmButton.textContent = "はい";

  confirmButton.addEventListener("click", () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "button-box chatShopModalButton";
  cancelButton.textContent = "いいえ";

  cancelButton.addEventListener("click", () => {
    if (typeof onCancel === "function") {
      onCancel();
    }
  });

  buttonRow.appendChild(confirmButton);
  buttonRow.appendChild(cancelButton);
  modal.appendChild(buttonRow);

  overlay.addEventListener("click", () => {
    if (typeof onCancel === "function") {
      onCancel();
    }
  });

  modal.addEventListener("click", event => {
    event.stopPropagation();
  });

  overlay.appendChild(modal);

  return overlay;
}

export function renderShopPurchaseConfirmModalIfNeeded(container, options = {}) {
  const {
    purchaseItems = [],
    onConfirm = null,
    onCancel = null
  } = options;

  const modal = renderShopPurchaseConfirmModal(purchaseItems, {
    onConfirm,
    onCancel
  });

  if (modal) {
    container.appendChild(modal);
  }
}
