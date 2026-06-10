//chat-tabs-view.js

export function renderPlaceTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatPlaceTabsSection",
    buttonClassName: "chatPlaceTabButton button-place-tab",
    tabs
  });
}

export function renderViewTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatViewTabsSection",
    buttonClassName: "chatViewTabButton button-tab",
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
    classNames.push("chatTabButtonActive", "is-active");
  }

  if (tab.isDisabled) {
    classNames.push("chatTabButtonDisabled");
    button.disabled = true;
  }

  if (tab.isCurrent) {
    classNames.push("chatTabButtonCurrent", "is-current");
  }

  button.className = classNames.join(" ");
  button.textContent = tab.label ?? "";

  if (!tab.isDisabled && typeof tab.onClick === "function") {
    button.addEventListener("click", tab.onClick);
  }

  return button;
}
