// chat-action-view.js

export function renderChatActionSection(container, options = {}) {
  const {
    actions = [],
    onSelectAction = null
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "chatActionSection";

  const inner = document.createElement("div");
  inner.className = "chatActionInner";

  if (actions.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "chatActionEmptyText";
    emptyText.textContent = "実行できるアクションはありません。";
    inner.appendChild(emptyText);
  } else {
    actions.forEach(action => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chatActionButton button-box";
      button.textContent = action.label ?? "アクション";

      if (typeof onSelectAction === "function") {
        button.addEventListener("click", () => {
          onSelectAction(action);
        });
      } else {
        button.disabled = true;
      }

      inner.appendChild(button);
    });
  }

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section
  };
}
