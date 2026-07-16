// place-unread-service.js

import { getAllPosts } from "./post-service.js";
import { canViewPost } from "../chat/chat-post-filter.js";
import { normalizeEno } from "./chat-post-query-service.js";

const PLACE_READ_STATE_STORAGE_KEY = "chatPlaceLastReadPostIds";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizePlaceId(placeId) {
  return typeof placeId === "string" ? placeId.trim() : "";
}

function normalizeReadState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((result, [placeId, postId]) => {
    const normalizedPlaceId = normalizePlaceId(placeId);
    const normalizedPostId = Number(postId || 0);

    if (normalizedPlaceId && Number.isInteger(normalizedPostId) && normalizedPostId > 0) {
      result[normalizedPlaceId] = normalizedPostId;
    }

    return result;
  }, {});
}

function loadPlaceReadState() {
  return normalizeReadState(
    safeParse(localStorage.getItem(PLACE_READ_STATE_STORAGE_KEY), {})
  );
}

function savePlaceReadState(state = {}) {
  const normalized = normalizeReadState(state);

  localStorage.setItem(
    PLACE_READ_STATE_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  return normalized;
}

function getVisiblePostsForPlace(placeId, viewerEno) {
  const normalizedPlaceId = normalizePlaceId(placeId);

  if (!normalizedPlaceId) {
    return [];
  }

  return getAllPosts().filter(post =>
    post &&
    !post.isDeleted &&
    post.placeId === normalizedPlaceId &&
    canViewPost(post, viewerEno)
  );
}

export function markPlaceReadAtLatestPost(placeId, options = {}) {
  const normalizedPlaceId = normalizePlaceId(placeId);
  const viewerEno = normalizeEno(options.viewerEno);

  if (!normalizedPlaceId || !viewerEno) {
    return loadPlaceReadState();
  }

  const latestPostId = getVisiblePostsForPlace(normalizedPlaceId, viewerEno)
    .reduce((latest, post) => Math.max(latest, Number(post.postId || 0)), 0);

  if (!latestPostId) {
    return loadPlaceReadState();
  }

  return savePlaceReadState({
    ...loadPlaceReadState(),
    [normalizedPlaceId]: latestPostId
  });
}

export function getUnreadCountByPlaceId(placeId, options = {}) {
  const normalizedPlaceId = normalizePlaceId(placeId);
  const viewerEno = normalizeEno(options.viewerEno);

  if (!normalizedPlaceId || !viewerEno) {
    return 0;
  }

  const lastReadPostId = loadPlaceReadState()[normalizedPlaceId] || 0;

  return getVisiblePostsForPlace(normalizedPlaceId, viewerEno)
    .filter(post =>
      Number(post.postId || 0) > lastReadPostId &&
      normalizeEno(post.authorEno) !== viewerEno
    )
    .length;
}

export function addUnreadCountsToPlaces(places = [], options = {}) {
  return (Array.isArray(places) ? places : []).map(place => ({
    ...place,
    unreadCount: getUnreadCountByPlaceId(place?.placeId, options)
  }));
}
