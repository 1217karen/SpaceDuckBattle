//post-service.js

const POSTS_STORAGE_KEY = "chatPosts";

function clonePost(post) {
  const rawTargetEnoList = Array.isArray(post?.targetEnoList)
    ? post.targetEnoList
    : [];

  const targetEnoList = rawTargetEnoList
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0);

  const postId =
    typeof post?.postId === "number"
      ? post.postId
      : Number(post?.postId || 0);

  const authorEno =
    typeof post?.authorEno === "number"
      ? post.authorEno
      : Number(post?.authorEno || 0);

  const parentPostId =
    typeof post?.parentPostId === "number"
      ? post.parentPostId
      : Number(post?.parentPostId || 0);

  const threadRootPostId =
    typeof post?.threadRootPostId === "number"
      ? post.threadRootPostId
      : Number(post?.threadRootPostId || 0);

  return {
    postId: Number.isInteger(postId) && postId > 0 ? postId : 0,
    placeId:
      typeof post?.placeId === "string"
        ? post.placeId
        : "",
    speakerName:
      typeof post?.speakerName === "string"
        ? post.speakerName
        : "",
    iconId:
      typeof post?.iconId === "number" && post.iconId > 0
        ? post.iconId
        : null,
    iconUrl:
      typeof post?.iconUrl === "string"
        ? post.iconUrl
        : "",
    body:
      typeof post?.body === "string"
        ? post.body
        : "",
    createdAt:
      typeof post?.createdAt === "string"
        ? post.createdAt
        : "",
    authorEno: Number.isInteger(authorEno) ? authorEno : 0,
    targetEnoList,
    parentPostId:
      Number.isInteger(parentPostId) && parentPostId > 0
        ? parentPostId
        : null,
    threadRootPostId:
      Number.isInteger(threadRootPostId) && threadRootPostId > 0
        ? threadRootPostId
        : null,
    isDeleted: Boolean(post?.isDeleted),
    deletedAt:
      typeof post?.deletedAt === "string"
        ? post.deletedAt
        : null
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

function getSourcePosts() {
  return loadStoredPosts();
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

export function getAllPostsIncludingDeleted() {
  return getSourcePosts();
}

export function getPostsByPlaceId(placeId) {
  return getAllPosts().filter(post => post.placeId === placeId);
}

export function getPostById(postId) {
  const normalizedPostId =
    typeof postId === "number"
      ? postId
      : Number(postId || 0);

  if (!normalizedPostId) {
    return null;
  }

  return getAllPosts().find(post => post.postId === normalizedPostId) || null;
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

  const post = clonePost({
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
    targetEnoList,
    parentPostId:
      typeof input.parentPostId === "number" && input.parentPostId > 0
        ? input.parentPostId
        : null,
    threadRootPostId:
      typeof input.threadRootPostId === "number" && input.threadRootPostId > 0
        ? input.threadRootPostId
        : null,
    isDeleted: false,
    deletedAt: null
  });

  const nextPosts = [...allPosts, post];
  saveStoredPosts(nextPosts);

  return clonePost(post);
}

export function deletePost(postId, actorEno = null) {
  const allPosts = getSourcePosts();

  const nextPosts = allPosts.map(post => {
    if (post.postId !== postId) {
      return post;
    }

    const isOwnPost =
      actorEno === null ||
      actorEno === undefined ||
      String(post.authorEno) === String(actorEno);

    if (!isOwnPost) {
      return post;
    }

    return clonePost({
      ...post,
      isDeleted: true,
      deletedAt: formatDateTime()
    });
  });

  saveStoredPosts(nextPosts);
}
