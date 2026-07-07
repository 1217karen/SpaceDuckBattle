// chat-pagination-view.js

import { CHAT_PAGE_SIZE_DEFAULT, CHAT_PAGE_SIZE_MAX, CHAT_PAGE_SIZE_MIN } from "./chat-pagination-state.js";

function createPageButton(label, options = {}) {
  const {
    title = "",
    isCurrent = false,
    isDisabled = false,
    onClick = null
  } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "chatPaginationButton button-box";
  button.textContent = label;

  if (title) {
    button.title = title;
  }

  if (isCurrent) {
    button.classList.add("is-current");
    button.setAttribute("aria-current", "page");
  }

  if (isDisabled) {
    button.disabled = true;
  }

  if (!isDisabled && typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }

  return button;
}

function appendEllipsis(container) {
  const ellipsis = document.createElement("span");
  ellipsis.className = "chatPaginationEllipsis";
  ellipsis.textContent = "...";
  container.appendChild(ellipsis);
}

function getVisiblePageNumbers(currentPage, totalPages) {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  const pages = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return {
    pages,
    hasLeadingEllipsis: startPage > 1,
    hasTrailingEllipsis: endPage < totalPages
  };
}

export function renderChatPaginationSection(container, options = {}) {
  const {
    pagination = {},
    pageSize = CHAT_PAGE_SIZE_DEFAULT,
    onSelectPage = null,
    onChangePageSize = null
  } = options;

  if (!container) {
    return null;
  }

  const currentPage = Number(pagination.currentPage || 1);
  const totalPages = Number(pagination.totalPages || 1);

  const section = document.createElement("section");
  section.className = "chatPaginationSection";

  const pager = document.createElement("nav");
  pager.className = "chatPaginationPager";
  pager.setAttribute("aria-label", "投稿ページ送り");

  const canMovePrev = currentPage > 1;
  const canMoveNext = currentPage < totalPages;

  pager.appendChild(createPageButton("≪", {
    title: "最初のページへ",
    isDisabled: !canMovePrev,
    onClick: () => onSelectPage?.(1)
  }));

  pager.appendChild(createPageButton("＜", {
    title: "前のページへ",
    isDisabled: !canMovePrev,
    onClick: () => onSelectPage?.(currentPage - 1)
  }));

  const { pages, hasLeadingEllipsis, hasTrailingEllipsis } = getVisiblePageNumbers(
    currentPage,
    totalPages
  );

  if (hasLeadingEllipsis) {
    appendEllipsis(pager);
  }

  pages.forEach(page => {
    pager.appendChild(createPageButton(String(page), {
      title: `${page}ページ目へ`,
      isCurrent: page === currentPage,
      isDisabled: page === currentPage,
      onClick: () => onSelectPage?.(page)
    }));
  });

  if (hasTrailingEllipsis) {
    appendEllipsis(pager);
  }

  pager.appendChild(createPageButton("＞", {
    title: "次のページへ",
    isDisabled: !canMoveNext,
    onClick: () => onSelectPage?.(currentPage + 1)
  }));

  pager.appendChild(createPageButton("≫", {
    title: "最後のページへ",
    isDisabled: !canMoveNext,
    onClick: () => onSelectPage?.(totalPages)
  }));

  const pageSizeForm = document.createElement("form");
  pageSizeForm.className = "chatPaginationPageSizeForm";

  const pageSizeInput = document.createElement("input");
  pageSizeInput.className = "chatPaginationPageSizeInput";
  pageSizeInput.type = "number";
  pageSizeInput.min = String(CHAT_PAGE_SIZE_MIN);
  pageSizeInput.max = String(CHAT_PAGE_SIZE_MAX);
  pageSizeInput.step = "1";
  pageSizeInput.value = String(pageSize);
  pageSizeInput.setAttribute("aria-label", "1ページあたりの表示件数");

  const pageSizeText = document.createElement("span");
  pageSizeText.className = "chatPaginationPageSizeText";
  pageSizeText.textContent = "件表示にする";

  const pageSizeButton = document.createElement("button");
  pageSizeButton.type = "submit";
  pageSizeButton.className = "chatPaginationPageSizeButton button-box";
  pageSizeButton.textContent = "変更";

  const pageSizeNote = document.createElement("p");
  pageSizeNote.className = "chatPaginationPageSizeNote";
  pageSizeNote.textContent = `${CHAT_PAGE_SIZE_MIN}〜${CHAT_PAGE_SIZE_MAX}件で指定できます。範囲外は自動補正されます。`;

  pageSizeForm.appendChild(pageSizeInput);
  pageSizeForm.appendChild(pageSizeText);
  pageSizeForm.appendChild(pageSizeButton);

  pageSizeForm.addEventListener("submit", event => {
    event.preventDefault();

    if (typeof onChangePageSize === "function") {
      onChangePageSize(pageSizeInput.value);
    }
  });

  section.appendChild(pager);
  section.appendChild(pageSizeForm);
  section.appendChild(pageSizeNote);
  container.appendChild(section);

  return {
    section,
    pager,
    pageSizeForm,
    pageSizeInput
  };
}
