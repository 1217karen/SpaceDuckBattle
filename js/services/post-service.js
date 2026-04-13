//post-service.js
  
import { posts as seedPosts } from "../data/posts-data.js";

const POSTS_STORAGE_KEY = "chatPosts";

function clonePost(post) {
  return {
    ...post
  };
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function loadStoredPosts() {
  const parsed = safeParse(
    localStorage.getItem(POSTS_STORAGE_KEY),
    null
  );

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(clonePost);
}

function saveStoredPosts(posts) {
  localStorage.setItem(
    POSTS_STORAGE_KEY,
    JSON.stringify(posts)
  );
}

function getSeedPosts() {
  return seedPosts.map(clonePost);
}

function getSourcePosts() {
  const storedPosts = loadStoredPosts();

  if (storedPosts.length > 0) {
    return storedPosts;
  }

  return getSeedPosts();
}

function getNextPostId(posts) {
  const maxPostId = posts.reduce((max, post) => {
    const postId =
      typeof post?.postId === "number"
        ? post.postId
        : Number(post?.postId || 0);

    return Math.max(max, Number.isNaN(postId) ? 0 : postId);
  }, 0);

  return maxPostId + 1;
}

function formatDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getAllPosts() {
  return getSourcePosts();
}

export function getPostsByPlaceId(placeId) {
  return getAllPosts().filter(post => post.placeId === placeId);
}

export function createPost(input = {}) {
  const allPosts = getSourcePosts();
  const nextPostId = getNextPostId(allPosts);

  const rawTargetEnoList = Array.isArray(input.targetEnoList)
    ? input.targetEnoList
    : [];

  const targetEnoList = rawTargetEnoList
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0);

  const post = {
    postId: nextPostId,
    placeId:
      typeof input.placeId === "string"
        ? input.placeId
        : "",
    speakerName:
      typeof input.speakerName === "string"
        ? input.speakerName
        : "",
    iconId:
      typeof input.iconId === "number" && input.iconId > 0
        ? input.iconId
        : null,
    iconUrl:
      typeof input.iconUrl === "string"
        ? input.iconUrl
        : "",
    body:
      typeof input.body === "string"
        ? input.body
        : "",
    createdAt: formatDateTime(),
    authorEno:
      typeof input.authorEno === "number"
        ? input.authorEno
        : Number(input.authorEno || 0),
    targetEnoList
  };

  const nextPosts = [...allPosts, post];
  saveStoredPosts(nextPosts);

  return clonePost(post);
}
