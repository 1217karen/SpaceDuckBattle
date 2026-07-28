// chat-action-view.js

export function renderChatActionSection(container, options = {}) {
  const {
    actions = [],
    selectedActionId = "",
    selectedLogId = "",
    selectedItemActionId = "",
    logOptions = [],
    holdItemOptions = [],
    useItemOptions = [],
    onSelectAction = null,
    onSelectLog = null,
    onSelectItemAction = null,
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

    const actionGroups = [
      actions.filter(action => !["item-selector", "log"].includes(action.type)),
      actions.filter(action => action.type === "item-selector"),
      actions.filter(action => action.type === "log")
    ].filter(group => group.length > 0);

    actionGroups.forEach(group => {
      const groupElement = document.createElement("div");
      groupElement.className = "chatActionButtonGroup";

      group.forEach(action => {
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

        groupElement.appendChild(button);
      });

      buttonList.appendChild(groupElement);
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
      logField.textContent = "投稿するログ";

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

    if (
      selectedAction?.actionId === "hold-item" ||
      selectedAction?.actionId === "use-item"
    ) {
      const isHoldAction = selectedAction.actionId === "hold-item";
      const itemOptions = isHoldAction ? holdItemOptions : useItemOptions;
      const itemField = document.createElement("label");
      itemField.className = "chatActionLogField";
      itemField.textContent = isHoldAction
        ? "手に持つアイテム"
        : "使用するアイテム";

      const itemSelect = document.createElement("select");
      itemSelect.className = "chatActionLogSelect";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = itemOptions.length > 0
        ? "アイテムを選択してください"
        : isHoldAction
          ? "手に持てるアイテムがありません"
          : "使用できるアイテムがありません";
      itemSelect.appendChild(placeholder);

      itemOptions.forEach(optionData => {
        const option = document.createElement("option");
        option.value = optionData.choiceId;
        option.textContent = optionData.label;

        if (optionData.choiceId === selectedItemActionId) {
          option.selected = true;
        }

        itemSelect.appendChild(option);
      });

      itemSelect.disabled = itemOptions.length === 0;

      if (typeof onSelectItemAction === "function") {
        itemSelect.addEventListener("change", () => {
          onSelectItemAction(itemSelect.value);
        });
      }

      itemField.appendChild(itemSelect);
      detail.appendChild(itemField);
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
