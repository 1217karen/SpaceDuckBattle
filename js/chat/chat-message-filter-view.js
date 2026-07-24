// chat-message-filter-view.js

import { normalizeEno } from "../services/chat-post-query-service.js";

export function renderMessageFilterSection(container, options = {}) {
  const {
    filterEno = null,
    onApplyFilter = null
  } = options;

  if (!container) {
    return;
  }

  const form = document.createElement("form");
  form.className = "chatMessageFilterForm";

  const label = document.createElement("label");
  label.className = "chatMessageFilterLabel";
  label.textContent = "送受信Eno:";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.className = "chatMessageFilterInput";
  input.value = filterEno ? String(filterEno) : "";
  input.placeholder = "Eno";

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button-box chatMessageFilterButton";
  button.textContent = "絞り込み";

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(button);

  if (filterEno) {
    const status = document.createElement("span");
    status.className = "chatMessageFilterStatus";
    status.textContent = `Eno.${filterEno} とのメッセージを表示中`;
    form.appendChild(status);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextFilterEno = normalizeEno(input.value);

    if (typeof onApplyFilter === "function") {
      onApplyFilter(nextFilterEno || null);
    }
  });

  container.appendChild(form);
}

