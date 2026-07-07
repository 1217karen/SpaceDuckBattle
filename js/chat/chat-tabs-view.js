//chat-tabs-view.js

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
