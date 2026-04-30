//chat-controller.js

import { places } from "../data/places-data.js";
import { getPlaceById, getPlaceLabel, getFavoritePlaces } from "./chat-place-utils.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, setButtonPreview } from "../common/icon-picker.js";
import { setupComposerIconPicker, setupComposerDraftPersistence } from "./chat-composer-ui.js";
import { createPost,deletePost,getAllPosts,getAllPostsIncludingDeleted } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection,renderThreadHeaderSection,renderPlaceTabsSection,renderChatComposerSection,
        renderViewTabsSection,renderPostListSection,renderPostListContent } from "./chat-view.js";
import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,applyComposerDraftToRefs } from "./chat-composer-state.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost } from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost } from "./chat-composer-post.js";
import { getThreadRootPostIdFromQuery,getThreadPosts } from "./chat-thread-view.js";
import { createPostActions } from "./chat-post-actions.js";
import { showToast } from "../common/toast.js";
import { isFavoritePlace,toggleFavoritePlace } from "./chat-place-favorites.js";
import { renderFavoritePlacesPanel } from "./chat-favorites-panel.js";

const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenPostIds = new Set();
let currentViewMode = "chat";
let isShopOpen = false;

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}


function getKindLabel(kind) {
  if (kind === "field") return "フィールド";
  if (kind === "area") return "エリア";
  if (kind === "room") return "ルーム";
  return "";
}

function getLayerLabel(layer) {
  if (layer === "main") return "メイン";
  if (layer === "side") return "サイド";
  if (layer === "local") return "ローカル";
  return "なし";
}

function getPlacesInSameGroup(place) {
  if (!place?.groupId) return [];

  return places.filter(item =>
    item.groupId === place.groupId
  );
}

function getLayerSortValue(layer) {
  if (layer === "main") return 1;
  if (layer === "side") return 2;
  if (layer === "local") return 3;
  return 999;
}

function moveToPlace(placeId) {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;
  const character = loadCharacter(eno) || {};

  isShopOpen = false;

  saveCharacter(eno, {
    ...character,
    currentPlaceId: placeId
  });

  const placeLabel = getPlaceLabel(placeId);
  sessionStorage.setItem(
    "chatToastMessage",
    JSON.stringify({
      message: `${placeLabel}に移動しました`,
      type: "info"
    })
  );

  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
}

function openThread(post) {
  if (!post) {
    return;
  }

  const threadRootPostId =
    typeof post.threadRootPostId === "number" && post.threadRootPostId > 0
      ? post.threadRootPostId
      : post.postId;

  const placeId = getPlaceIdFromQuery() || post.placeId || "F1-1";

  window.location.href =
    `./chat-thread.html?placeId=${encodeURIComponent(placeId)}&threadRootPostId=${encodeURIComponent(threadRootPostId)}`;}

function getReplyTargetLabels(post) {
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

function getAroundBasePlace(place) {
  if (!place) {
    return null;
  }

  if (place.kind === "room") {
    return place;
  }

  if (place.layer === "main") {
    return place;
  }

  return places.find(item =>
    item.groupId === place.groupId &&
    item.kind === place.kind &&
    item.layer === "main"
  ) || place;
}

function buildPlaceTabs(place, options = {}) {
  const {
    isShopOpen = false,
    onToggleShop = null
  } = options;

  if (!place) {
    return [];
  }

  if (place.kind === "room") {
    return [];
  }

  const sameGroupPlaces =
    getPlacesInSameGroup(place)
      .slice()
      .sort((a, b) =>
        getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
      );

  const tabs = sameGroupPlaces.map(item => ({
    key: `layer-${item.layer}`,
    label: String(item.layer ?? "").toUpperCase(),
    isActive: item.placeId === place.placeId,
    isCurrent: item.placeId === place.placeId,
    isDisabled: item.placeId === place.placeId,
    onClick: () => {
      moveToPlace(item.placeId);
    }
  }));

  tabs.push({
    key: "shop",
    label: "SHOP",
    isActive: isShopOpen,
    isDisabled: typeof onToggleShop !== "function",
    onClick: () => {
      if (typeof onToggleShop === "function") {
        onToggleShop();
      }
    }
  });

  return tabs;
}

function getHerePosts(currentPlace, allPosts) {
  if (!currentPlace?.placeId) {
    return [];
  }

  return allPosts
    .filter(post =>
      post.placeId === currentPlace.placeId &&
      !post.isDeleted
    )
    .map(post => ({
      ...post,
      displayType: "normal"
    }))
    .sort((a, b) => b.postId - a.postId);
}

function getReplyPostsForEno(allPosts, eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  if (!normalizedEno) {
    return [];
  }

  return allPosts
    .filter(post => {
      if (post?.isDeleted) {
        return false;
      }

      if (!Array.isArray(post?.targetEnoList)) {
        return false;
      }

      return post.targetEnoList.some(item =>
        Number(item) === normalizedEno
      );
    })
    .map(post => ({
      ...post,
      displayType: "normal"
    }))
    .sort((a, b) => b.postId - a.postId);
}

function getSelfPostsForEno(allPosts, eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  if (!normalizedEno) {
    return [];
  }

  return allPosts
    .filter(post =>
      !post.isDeleted &&
      Number(post.authorEno) === normalizedEno
    )
    .map(post => ({
      ...post,
      displayType: "normal"
    }))
    .sort((a, b) => b.postId - a.postId);
}

function buildViewTabs(options = {}) {
  const {
    currentMode = "chat",
    onSelectMode = null
  } = options;

  return [
    {
      key: "chat",
      label: "CHAT",
      isActive: currentMode === "chat",
      isCurrent: currentMode === "chat",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("chat");
        }
      }
    },
    {
      key: "here",
      label: "HERE",
      isActive: currentMode === "here",
      isCurrent: currentMode === "here",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("here");
        }
      }
    },
    {
      key: "reply",
      label: "REPLY",
      isActive: currentMode === "reply",
      isCurrent: currentMode === "reply",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("reply");
        }
      }
    },
    {
      key: "message",
      label: "MESSAGE",
      isActive: false,
      isDisabled: true
    },
    {
      key: "favorite",
      label: "FAVORITE",
      isActive: false,
      isDisabled: true
    },
    {
      key: "self",
      label: "SELF",
      isActive: currentMode === "self",
      isCurrent: currentMode === "self",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("self");
        }
      }
    }
  ];
}

function setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
  allPosts,
  getPlaceLabel,
  onMoveToPlace,
  postActions,
  getQuotePreviewPostById,
  threadRootPostId = null,
  currentEno
}) {
  if (!postListRefs?.list || !composerRefs?.textarea) {
    return;
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

const rawDisplayPosts = threadRootPostId
  ? getThreadPosts(allPosts, threadRootPostId).map(post => ({
      ...post,
      displayType: "normal"
    }))
  : currentViewMode === "reply"
    ? getReplyPostsForEno(allPosts, currentEno)
    : currentViewMode === "self"
      ? getSelfPostsForEno(allPosts, currentEno)
      : currentViewMode === "here"
        ? getHerePosts(place, allPosts)
        : getDisplayPosts({
            currentPlace: place,
            allPosts,
            places
          });

    const displayPosts = rawDisplayPosts.filter(post =>
      !hiddenPostIds.has(post.postId)
    );

    const draftPreviewPost = buildDraftPreviewPost({
      place,
      character,
      draft: currentDraft,
      replySourcePost: findReplySourcePost(allPosts, currentDraft)
    });

    const postsForRender = draftPreviewPost
      ? [draftPreviewPost, ...displayPosts]
      : displayPosts;

    renderPostListContent(postListRefs.list, {
      posts: postsForRender,
      getPlaceLabel,
      onMoveToPlace,
      postActions,
      currentEno,
      getReplyTargetLabels,
      getQuotePreviewPostById
    });
  }

  composerRefs.textarea.addEventListener("input", refreshDraftPreview);
  composerRefs.nameInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.replyTargetInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.iconButton?.addEventListener("iconchange", refreshDraftPreview);
  composerRefs.useCurrentPlaceCheckbox?.addEventListener("change", refreshDraftPreview);
  composerRefs.additionalTargetSection?.addEventListener("toggle", refreshDraftPreview);

  refreshDraftPreview();
}

function setupComposerSubmit({
  place,
  character,
  composerRefs
}) {
  if (!composerRefs?.submitButton) {
    return;
  }

  composerRefs.submitButton.addEventListener("click", () => {
    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    const postInput = buildComposerPostInput({
      place,
      character,
      draft: currentDraft,
      replySourcePost: findReplySourcePost(getAllPosts(), currentDraft)
    });

    if (!postInput) {
      alert("本文を入力してください");
      return;
    }

    createPost(postInput);

    const clearedDraft = clearReplyState({
      ...currentDraft,
      body: "",
      additionalTargetEnoText: ""
    });

    saveComposerDraft(clearedDraft);
    isShopOpen = false;
    renderChatPlaceInfo();
    showToast("発言を投稿しました", { type: "success" });
  });
}

function getInitialComposerSpeakerName(character, initialIcon) {
  const defaultName =
    typeof character?.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  const commIcons = normalizeCommIcons(character?.commIcons);

  if (initialIcon?.iconId) {
    const matchedIcon = commIcons.find(item => item.id === initialIcon.iconId) || null;
    const iconName =
      typeof matchedIcon?.name === "string"
        ? matchedIcon.name.trim()
        : "";

    if (iconName !== "") {
      return iconName;
    }
  }

  return defaultName;
}


function renderShopPlaceholderSection(container) {
  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "chatShopSection";

  const inner = document.createElement("div");
  inner.className = "chatShopInner";

  const card = document.createElement("div");
  card.className = "chatShopCard";

  const text = document.createElement("p");
  text.className = "chatShopPlaceholderText";
  text.textContent = "ショップです";

  card.appendChild(text);
  inner.appendChild(card);
  section.appendChild(inner);
  container.appendChild(section);

  return {
    section
  };
}

function renderRightPanel() {
  if (!rightPanel) {
    return;
  }

  rightPanel.innerHTML = "";

  renderFavoritePlacesPanel(rightPanel, {
    favoritePlaces: getFavoritePlaces(),
    onMoveToPlace: moveToPlace
  });
}

function renderChatPlaceInfo() {
  if (!centerPanel || !chatMainArea) return;

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId =
    getPlaceIdFromQuery() ||
    character?.currentPlaceId ||
    "F1-1";

const place = getPlaceById(placeId);
const aroundBasePlace = getAroundBasePlace(place);
const threadRootPostId = getThreadRootPostIdFromQuery();

chatMainArea.innerHTML = "";

  const pendingToast = sessionStorage.getItem("chatToastMessage");

  if (pendingToast) {
    sessionStorage.removeItem("chatToastMessage");

    try {
      const parsed = JSON.parse(pendingToast);
      if (parsed?.message) {
        showToast(parsed.message, {
          type: parsed.type || "info"
        });
      }
    } catch {
      // 何もしない
    }
  }

if (threadRootPostId) {
  renderThreadHeaderSection(chatMainArea, {
    memoText: "この欄は非公開メモ用です。"
  });
} else {
  renderPlaceInfoSection(chatMainArea, {
    place,
    aroundBasePlace,
    places,
    onMoveToPlace: moveToPlace,
    isFavorite: isFavoritePlace(place?.placeId ?? ""),
    onToggleFavorite: (targetPlace) => {
      const result = toggleFavoritePlace(targetPlace?.placeId ?? "");

      renderChatPlaceInfo();

      showToast(
        result.isFavorite
          ? "現在地をお気に入り登録しました"
          : "現在地のお気に入りを解除しました",
        {
          type: result.isFavorite ? "success" : "info"
        }
      );
    }
  });
}

if (!place) {
  return;
}

const allPosts = getAllPosts();
const threadPosts = getThreadPosts(allPosts, threadRootPostId);
const threadRootPost =
  threadRootPostId
    ? allPosts.find(post => post.postId === threadRootPostId) || null
    : null;
const composerDraft = loadComposerDraft();
const replySourcePost = findReplySourcePost(allPosts, composerDraft);

const replyTargetCharacter =
  replySourcePost?.authorEno
    ? loadCharacter(replySourcePost.authorEno)
    : null;

const fixedReplyTargetName =
  typeof replyTargetCharacter?.defaultName === "string" &&
  replyTargetCharacter.defaultName.trim() !== ""
    ? replyTargetCharacter.defaultName.trim()
    : (typeof replySourcePost?.speakerName === "string"
        ? replySourcePost.speakerName
        : "");

const placeTabs = buildPlaceTabs(place, {
  isShopOpen,
  onToggleShop: () => {
    isShopOpen = !isShopOpen;
    renderChatPlaceInfo();
  }
});

const viewTabs = buildViewTabs({
  currentMode: currentViewMode,
  onSelectMode: (mode) => {
    currentViewMode = mode;
    renderChatPlaceInfo();
  }
});

if (placeTabs.length > 0) {
  renderPlaceTabsSection(chatMainArea, {
    tabs: placeTabs
  });
}

let composerRefs = null;

if (isShopOpen) {
  renderShopPlaceholderSection(centerPanel);
} else {
  composerRefs = renderChatComposerSection(chatMainArea, {
    composerDraft,
    replySourcePost,
    getPlaceLabel,
    currentPlaceLabel: getPlaceLabel(place.placeId),
    useCurrentPlaceForReply: composerDraft.useCurrentPlaceForReply,
    fixedReplyTargetEno: composerDraft.fixedReplyTargetEno,
    fixedReplyTargetName,
    isAdditionalTargetOpen: composerDraft.isAdditionalTargetOpen,
    onClearReply: () => {
      const currentDraft = saveComposerDraft(
        readComposerDraftFromRefs(composerRefs)
      );

      const nextDraft = clearReplyState(currentDraft);
      saveComposerDraft(nextDraft);
      renderChatPlaceInfo();
    }
  });

setupComposerIconPicker({
  composerRefs,
  character,
  chatIconPicker
});
  setupComposerDraftPersistence(composerRefs);
  applyComposerDraftToRefs(composerRefs, composerDraft);

  if (composerDraft.iconId || composerDraft.iconUrl) {
    setButtonPreview(
      composerRefs.iconButton,
      composerDraft.iconId,
      composerDraft.iconUrl || getNoImageUrl()
    );
  }
}

const handleReply = (post) => {
  const currentDraft = saveComposerDraft(
    readComposerDraftFromRefs(composerRefs)
  );

  const replyState = createReplyStateFromPost(post);
  const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

  saveComposerDraft(nextDraft);
  renderChatPlaceInfo();
};

const handleDelete = (post) => {
  if (!post || typeof post.postId !== "number") {
    return;
  }

  const ok = window.confirm("この発言を削除しますか？");
  if (!ok) {
    return;
  }

  deletePost(post.postId, eno);
  renderChatPlaceInfo();
  showToast("発言を削除しました", { type: "success" });
};

const handleHide = (post) => {
  if (!post || typeof post.postId !== "number") {
    return;
  }

  hiddenPostIds.add(post.postId);
  renderChatPlaceInfo();
  showToast("発言を非表示にしました", { type: "info" });
};

const getQuotePreviewPostById = (postId) => {
  const allPostsIncludingDeleted = getAllPostsIncludingDeleted();
  return allPostsIncludingDeleted.find(post => post.postId === postId) || null;
};

const handleQuote = (post) => {
  if (!post || !composerRefs?.textarea) {
    return;
  }

  const quoteText = `>>${post.postId}`;

  const textarea = composerRefs.textarea;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);

  const needsLeadingSpace =
    before.length > 0 &&
    !before.endsWith("\n") &&
    !before.endsWith(" ");

  const needsTrailingSpace =
    after.length > 0 &&
    !after.startsWith("\n") &&
    !after.startsWith(" ");

  const insertText =
    `${needsLeadingSpace ? " " : ""}${quoteText}${needsTrailingSpace ? " " : ""}`;

  textarea.value = `${before}${insertText}${after}`;

  const nextCaretPosition = before.length + insertText.length;
  textarea.focus();
  textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
};

const postActions = createPostActions({
  onReply: handleReply,
  onDelete: handleDelete,
  onOpenThread: openThread,
  onQuote: handleQuote,
  onHide: handleHide
});

renderViewTabsSection(chatMainArea, {
  tabs: viewTabs
});


const rawDisplayPosts = threadRootPostId
  ? threadPosts.map(post => ({
      ...post,
      displayType: "normal"
    }))
  : currentViewMode === "reply"
    ? getReplyPostsForEno(allPosts, eno)
    : currentViewMode === "self"
      ? getSelfPostsForEno(allPosts, eno)
      : currentViewMode === "here"
        ? getHerePosts(place, allPosts)
        : getDisplayPosts({
            currentPlace: place,
            allPosts,
            places
          });

const displayPosts = rawDisplayPosts.filter(post =>
  !hiddenPostIds.has(post.postId)
);

const postListRefs = renderPostListSection(chatMainArea, {
  posts: displayPosts,
  getPlaceLabel,
  onMoveToPlace: moveToPlace,
  postActions,
  currentEno: eno,
  getReplyTargetLabels,
  getQuotePreviewPostById
});

if (composerRefs) {
  setupDraftPreview({
    postListRefs,
    place,
    character,
    composerRefs,
    allPosts,
    getPlaceLabel,
    onMoveToPlace: moveToPlace,
    postActions,
    getQuotePreviewPostById,
    threadRootPostId,
    currentEno: eno
  });

  setupComposerSubmit({
    place,
    character,
    composerRefs
  });
}

renderRightPanel();
}

renderChatPlaceInfo();
