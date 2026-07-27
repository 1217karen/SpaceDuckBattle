// notice-controller.js

import {
  formatNoticeDate,
  getNoticeCategoryLabel,
  getNotices
} from "../services/notice-service.js";
import { renderNoticeRichText } from "./notice-rich-text.js";

const noticeList = document.getElementById("noticeList");
const noticeIndex = document.getElementById("noticeIndex");

function createNoticeArticle(notice) {
  const article = document.createElement("article");
  article.id = notice.id;
  article.className = [
    "noticeArticle",
    "common-card-framed",
    "common-card-rounded-lg",
    "common-card-profile"
  ].join(" ");

  const meta = document.createElement("div");
  meta.className = "noticeArticleMeta";

  const date = document.createElement("time");
  date.className = "noticeArticleDate";
  date.dateTime = notice.publishedAt;
  date.textContent = formatNoticeDate(notice.publishedAt);

  const category = document.createElement("span");
  category.className = `noticeCategory noticeCategory-${notice.category}`;
  category.textContent = getNoticeCategoryLabel(notice.category);

  meta.appendChild(date);
  meta.appendChild(category);

  const title = document.createElement("h2");
  title.className = "noticeArticleTitle";
  title.textContent = notice.title;

  const body = document.createElement("div");
  body.className = "noticeArticleBody";
  renderNoticeRichText(body, notice.body);

  article.appendChild(meta);
  article.appendChild(title);
  article.appendChild(body);

  return article;
}

function createNoticeIndexLink(notice) {
  const link = document.createElement("a");
  link.className = "noticeIndexLink";
  link.href = `#${encodeURIComponent(notice.id)}`;
  link.textContent = notice.title;
  return link;
}

function renderNotices() {
  if (!noticeList || !noticeIndex) return;

  const notices = getNotices();
  noticeList.innerHTML = "";
  noticeIndex.innerHTML = "";

  if (notices.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "commonEmptyText";
    emptyText.textContent = "お知らせはまだありません。";
    noticeList.appendChild(emptyText);
    return;
  }

  notices.forEach(notice => {
    noticeList.appendChild(createNoticeArticle(notice));
    noticeIndex.appendChild(createNoticeIndexLink(notice));
  });
}

renderNotices();
