// notification-service.js

// notification-service.js

import { getAllPosts } from "./post-service.js";
import { loadCharacter } from "./storage-service.js";
import { normalizeEno } from "./chat-post-query-service.js";

const NOTIFICATION_LIMIT = 10;
const UNKNOWN_CHARACTER_NAME = "不明なキャラ";

function parseDateTimeValue(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return 0;
  }

  const normalized = value.trim().replace(" ", "T");
  const time = Date.parse(normalized);

  return Number.isNaN(time) ? 0 : time;
}

function formatNotificationDate(value) {
  const time = parseDateTimeValue(value);

  if (!time) {
    return "";
  }

  const date = new Date(time);

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getCharacterName(eno) {
  const character = loadCharacter(eno) || {};
  const name =
    typeof character.defaultName === "string" && character.defaultName.trim() !== ""
      ? character.defaultName.trim()
      : typeof character.fullName === "string" && character.fullName.trim() !== ""
        ? character.fullName.trim()
        : typeof character.name === "string" && character.name.trim() !== ""
          ? character.name.trim()
          : "";

  return name || UNKNOWN_CHARACTER_NAME;
}

function isTargetedToViewer(post, viewerEno) {
  if (!Array.isArray(post?.targetEnoList)) {
    return false;
  }

  return post.targetEnoList.some(eno => Number(eno) === viewerEno);
}

function isMessageToViewer(post, viewerEno) {
  if (!Array.isArray(post?.visibleToEnoList)) {
    return false;
  }

  return post.visibleToEnoList.some(eno => Number(eno) === viewerEno);
}

function getThreadRootPostId(post) {
  const threadRootPostId = normalizeEno(post?.threadRootPostId);

  return threadRootPostId || normalizeEno(post?.postId);
}

function buildThreadUrl(post) {
  const params = new URLSearchParams();
  const placeId = typeof post?.placeId === "string" ? post.placeId : "";
  const threadRootPostId = getThreadRootPostId(post);

  if (placeId) {
    params.set("placeId", placeId);
  }

  if (threadRootPostId) {
    params.set("threadRootPostId", String(threadRootPostId));
  }

  return `./chat-thread.html?${params.toString()}`;
}

function buildMessageUrl(post) {
  const authorEno = normalizeEno(post?.authorEno);
  const params = new URLSearchParams();

  params.set("view", "message");
  params.set("page", "1");

  if (authorEno) {
    params.set("filterEno", String(authorEno));
  }

  return `./chat.html?${params.toString()}`;
}

function buildNotificationText(notification) {
  const dateText = notification.dateText
    ? `${notification.dateText} `
    : "";

  if (notification.type === "message") {
    return `${dateText}Eno.${notification.actorEno} ${notification.actorName}さんからメッセージがあります`;
  }

  if (notification.type === "item_transfer") {
    return `${dateText}Eno.${notification.actorEno} ${notification.actorName}さんからアイテムが届いています`;
  }

  return `${dateText}Eno.${notification.actorEno} ${notification.actorName}さんから返信があります`;
}

function createPostNotification(post, type, targetUrl) {
  const actorEno = normalizeEno(post?.authorEno);
  const occurredAt = typeof post?.createdAt === "string" ? post.createdAt : "";
  const notification = {
    id: `${type}:${post.postId}`,
    type,
    sourceId: post.postId,
    actorEno,
    actorName: getCharacterName(actorEno),
    occurredAt,
    occurredAtTime: parseDateTimeValue(occurredAt),
    dateText: formatNotificationDate(occurredAt),
    targetUrl
  };

  return {
    ...notification,
    text: buildNotificationText(notification)
  };
}

export function getNotificationsForViewer(options = {}) {
  const viewerEno = normalizeEno(options.viewerEno);
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? options.limit
    : NOTIFICATION_LIMIT;

  if (!viewerEno) {
    return [];
  }

  return getAllPosts()
    .flatMap(post => {
      if (!post || post.isDeleted || normalizeEno(post.authorEno) === viewerEno) {
        return [];
      }

      if (post.type === "message") {
        return isMessageToViewer(post, viewerEno)
          ? [createPostNotification(post, "message", buildMessageUrl(post))]
          : [];
      }

      if (isTargetedToViewer(post, viewerEno)) {
        return [createPostNotification(post, "reply", buildThreadUrl(post))];
      }

      return [];
    })
    .sort((a, b) => {
      if (b.occurredAtTime !== a.occurredAtTime) {
        return b.occurredAtTime - a.occurredAtTime;
      }

      return Number(b.sourceId || 0) - Number(a.sourceId || 0);
    })
    .slice(0, limit);
}
