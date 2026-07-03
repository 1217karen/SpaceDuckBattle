// chat-action-view.js

export function renderChatActionSection(container, options = {}) {
  const {
    actions = [],
    selectedActionId = "",
    selectedLogId = "",
    logOptions = [],
    onSelectAction = null,
    onSelectLog = null,
    onExecuteAction = null
  } = options;

  if (!container) {
    return null;
  }

  const selectedAction =
    actions.find(action => action.actionId === selectedActionId) ||
    null;

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
    const buttonList = document.createElement("div");
    buttonList.className = "chatActionButtonList";

    actions.forEach(action => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chatActionButton button-box";

      if (selectedAction?.actionId === action.actionId) {
        button.classList.add("is-active");
      }

      button.textContent = action.label ?? "アクション";

      if (typeof onSelectAction === "function") {
        button.addEventListener("click", () => {
          onSelectAction(action);
        });
      } else {
        button.disabled = true;
      }

      buttonList.appendChild(button);
    });

    inner.appendChild(buttonList);

    const detail = document.createElement("div");
    detail.className = "chatActionDetail";

    const selectedLabel = document.createElement("div");
    selectedLabel.className = "chatActionSelectedLabel";
    selectedLabel.textContent =
      selectedAction
        ? `選択中：${selectedAction.label ?? "アクション"}`
        : "選択中：未選択";

    const description = document.createElement("p");
    description.className = "chatActionDescription";
    description.textContent =
      selectedAction?.description ?? "実行したいアクションを選択してください。";

    detail.appendChild(selectedLabel);

    if (description.textContent) {
      detail.appendChild(description);
    }

    if (selectedAction?.actionId === "post-log") {
      const logField = document.createElement("label");
      logField.className = "chatActionLogField";
      logField.textContent = "流すログ";

      const logSelect = document.createElement("select");
      logSelect.className = "chatActionLogSelect";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "ログを選択してください";
      logSelect.appendChild(placeholder);

      logOptions.forEach(log => {
        const option = document.createElement("option");
        option.value = log.logId;
        option.textContent = log.label ?? log.message ?? "ログ";
        option.disabled = !!log.isPosted;

        if (log.logId === selectedLogId) {
          option.selected = true;
        }

        logSelect.appendChild(option);
      });

      if (typeof onSelectLog === "function") {
        logSelect.addEventListener("change", () => {
          onSelectLog(logSelect.value);
        });
      } else {
        logSelect.disabled = true;
      }

      logField.appendChild(logSelect);
      detail.appendChild(logField);
    }

    inner.appendChild(detail);

    const footer = document.createElement("div");
    footer.className = "chatActionFooter";

    const executeButton = document.createElement("button");
    executeButton.type = "button";
    executeButton.className = "chatActionExecuteButton button-primaryNew";
    executeButton.textContent = "実行";

    if (selectedAction && typeof onExecuteAction === "function") {
      executeButton.addEventListener("click", () => {
        onExecuteAction(selectedAction);
      });
    } else {
      executeButton.disabled = true;
    }

    footer.appendChild(executeButton);
    inner.appendChild(footer);
  }

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section
  };
}
