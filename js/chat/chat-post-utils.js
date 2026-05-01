//chat-post-utils.js

import { loadCharacter } from "../services/storage-service.js";

export function openThreadFromPost(post, fallbackPlaceId = "F1-1") {
  if (!post) {
    return;
  }

  const threadRootPostId =
    typeof post.threadRootPostId === "number" && post.threadRootPostId > 0
      ? post.threadRootPostId
      : post.postId;

  const placeId =
    typeof post.placeId === "string" && post.placeId.trim() !== ""
      ? post.placeId
      : fallbackPlaceId;

  window.location.href =
    `./chat-thread.html?placeId=${encodeURIComponent(placeId)}&threadRootPostId=${encodeURIComponent(threadRootPostId)}`;
}

export function getReplyTargetLabels(post) {
  if (!post) {
    return [];
  }

  const targetEnoSet = new Set();

  const fixedReplyTargetEno =
    typeof post.authorEno === "number" && post.authorEno > 0
      ? post.authorEno
      : null;

  if (fixedReplyTargetEno) {
    targetEnoSet.add(fixedReplyTargetEno);
  }

  if (Array.isArray(post.targetEnoList)) {
    post.targetEnoList.forEach(item => {
      const eno = Number(item);
      if (Number.isInteger(eno) && eno > 0) {
        targetEnoSet.add(eno);
      }
    });
  }

  return [...targetEnoSet].map(eno => {
    const character = loadCharacter(eno);
    const defaultName =
      typeof character?.defaultName === "string" && character.defaultName.trim() !== ""
        ? character.defaultName.trim()
        : "";

    return {
      eno,
      name: defaultName
    };
  });
}
