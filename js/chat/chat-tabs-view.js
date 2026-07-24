//chat-tabs-view.js
import { hasShopForPlace } from "../services/shop-service.js";

export function renderPlaceTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatPlaceTabsSection",
    buttonClassName: "chatPlaceTabButton button-pill",
    tabs
  });
}

export function renderViewTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatViewTabsSection",
    buttonClassName: "chatViewTabButton button-box",
    tabs
  });
}

function renderChatTabSection(container, options = {}) {
  const {
    sectionClassName = "",
    buttonClassName = "",
    tabs = []
  } = options;

  const section = document.createElement("section");
  section.className = `chatTabsSection ${sectionClassName}`.trim();

  const inner = document.createElement("div");
  inner.className = "chatTabsInner";

  const row = document.createElement("div");
  row.className = "chatTabRow";

  tabs.forEach(tab => {
    row.appendChild(createChatTabButton(tab, buttonClassName));
  });

  inner.appendChild(row);
  section.appendChild(inner);
  container.appendChild(section);
}

function createChatTabButton(tab = {}, buttonClassName = "") {
  const button = document.createElement("button");
  button.type = "button";

  const classNames = ["chatTabButton"];

  if (buttonClassName) {
    classNames.push(...buttonClassName.split(" ").filter(Boolean));
  }

  if (tab.isActive) {
    classNames.push("is-active");
  }

  if (tab.isDisabled) {
    classNames.push("is-disabled");
    button.disabled = true;
  }

  if (tab.isCurrent) {
    classNames.push("is-current");
  }

  button.className = classNames.join(" ");
  button.textContent = tab.label ?? "";

  if (typeof tab.onClose === "function") {
    const closeButton = document.createElement("span");
    closeButton.className = "chatTabCloseButton";
    closeButton.textContent = "×";
    closeButton.setAttribute("role", "button");
    closeButton.setAttribute("tabindex", "0");
    closeButton.setAttribute("aria-label", `${tab.label ?? "タブ"}を閉じる`);

    const closeTab = (event) => {
      event.stopPropagation();
      tab.onClose();
    };

    closeButton.addEventListener("click", closeTab);
    closeButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closeTab(event);
      }
    });

    button.appendChild(document.createTextNode(" "));
    button.appendChild(closeButton);
  }

  if (!tab.isDisabled && typeof tab.onClick === "function") {
    button.addEventListener("click", tab.onClick);
  }

  return button;
}

function getPlacesInSameGroup(place, places = []) {
  if (!place?.groupId) return [];

  return places.filter(item =>
    item.groupId === place.groupId
  );
}

function getLayerSortValue(layer) {
  if (layer === "main") return 1;
  if (layer === "side") return 2;
  if (layer === "local") return 3;
  return 999;
}

export function buildPlaceTabs(place, options = {}) {
  const {
    places = [],
    isShopOpen = false,
    isActionOpen = false,
    onMoveToPlace = null,
    onToggleShop = null,
    onToggleAction = null,
    onSelectCurrentPlace = null
  } = options;

  if (!place) {
    return [];
  }

  const sameGroupPlaces =
    place.kind === "room"
      ? []
      : getPlacesInSameGroup(place, places)
          .slice()
          .sort((a, b) =>
            getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
          );

  const tabs = sameGroupPlaces.map(item => {
    const isCurrentPlace = item.placeId === place.placeId;

    return {
      key: `layer-${item.layer}`,
      label: String(item.layer ?? "").toUpperCase(),
      isActive: isCurrentPlace,
      isCurrent: isCurrentPlace,
      isDisabled: false,
      onClick: () => {
        if (isCurrentPlace) {
          if (typeof onSelectCurrentPlace === "function") {
            onSelectCurrentPlace();
          }
          return;
        }

        if (typeof onMoveToPlace === "function") {
          onMoveToPlace(item.placeId);
        }
      }
    };
  });

  if (hasShopForPlace(place)) {
    tabs.push({
      key: "shop",
      label: "SHOP",
      isActive: isShopOpen,
      isDisabled: typeof onToggleShop !== "function",
      onClick: () => {
        if (typeof onToggleShop === "function") {
          onToggleShop();
        }
      }
    });
  }

  tabs.push({
    key: "action",
    label: "ACTION",
    isActive: isActionOpen,
    isDisabled: typeof onToggleAction !== "function",
    onClick: () => {
      if (typeof onToggleAction === "function") {
        onToggleAction();
      }
    }
  });

  return tabs;
}

export function buildViewTabs(options = {}) {
  const {
    currentMode = "chat",
    authorEno = null,
    onSelectMode = null
  } = options;

  const tabs = [
    {
      key: "chat",
      label: "CHAT",
      isActive: currentMode === "chat",
      isCurrent: currentMode === "chat",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("chat");
        }
      }
    },
    {
      key: "here",
      label: "HERE",
      isActive: currentMode === "here",
      isCurrent: currentMode === "here",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("here");
        }
      }
    },
    {
      key: "reply",
      label: "REPLY",
      isActive: currentMode === "reply",
      isCurrent: currentMode === "reply",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("reply");
        }
      }
    },
    {
      key: "message",
      label: "MESSAGE",
      isActive: currentMode === "message",
      isCurrent: currentMode === "message",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("message");
        }
      }
    },
    {
      key: "favorite",
      label: "FAVORITE",
      isActive: currentMode === "favorite",
      isCurrent: currentMode === "favorite",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("favorite");
        }
      }
    },
    {
      key: "self",
      label: "SELF",
      isActive: currentMode === "self",
      isCurrent: currentMode === "self",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("self");
        }
      }
    }
  ];

  const normalizedAuthorEno = Number(authorEno || 0);

  if (Number.isInteger(normalizedAuthorEno) && normalizedAuthorEno > 0) {
    tabs.push({
      key: `eno-${normalizedAuthorEno}`,
      label: `Eno.${normalizedAuthorEno}`,
      isActive: currentMode === "eno",
      isCurrent: currentMode === "eno",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("eno", {
            eno: normalizedAuthorEno
          });
        }
      },
      onClose: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("chat", {
            closeAuthorEno: true
          });
        }
      }
    });
  }

  return tabs;
}
