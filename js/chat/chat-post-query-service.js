// chat-post-query-service.js

import { getAllPosts } from "./post-service.js";
import { getDisplayPosts } from "../chat/chat-display-rules.js";
import { getHerePosts, getReplyPostsForEno, getSelfPostsForEno } from "../chat/chat-post-filter.js";

export function getChatPostsForViewMode({
  viewMode = "chat",
  currentPlace = null,
  places = [],
  viewerEno = null
} = {}) {
  const allPosts = getAllPosts();

  if (viewMode === "reply") {
    return getReplyPostsForEno(allPosts, viewerEno);
  }

  if (viewMode === "self") {
    return getSelfPostsForEno(allPosts, viewerEno);
  }

  if (viewMode === "here") {
    return getHerePosts(currentPlace, allPosts, viewerEno);
  }

  return getDisplayPosts({
    currentPlace,
    allPosts,
    places,
    viewerEno
  });
}
