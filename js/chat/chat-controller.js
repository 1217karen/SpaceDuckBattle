//chat-controller.js

import { places } from "../data/places-data.js";
import { getPlaceById,getPlaceLabel,getFavoritePlaces,isFavoritePlace,toggleFavoritePlace } from "./chat-place-utils.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { createIconPicker } from "../common/icon-picker.js";
import { createPost,getAllPosts } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection } from "./chat-header-view.js";
import { renderChatComposerSection } from "./chat-composer-view.js";
import { renderPlaceTabsSection,renderViewTabsSection } from "./chat-tabs-view.js";
import { renderPostListSection,renderPostListContent } from "./chat-post-view.js";
import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs } from "./chat-composer-state.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost } from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost,validateComposerDraftForPost } from "./chat-composer-post.js";
import { showToast } from "../common/toast.js";
import { setupRenderedComposer, getFixedReplyTargetName } from "./chat-composer-ui.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { createPostActions,openThreadFromPost,getReplyTargetLabels,createDeleteHandler,createHideHandler,createQuoteHandler,getQuotePreviewPostById } from "./chat-post-action-helpers.js";
import { bindComposerDraftPreviewEvents } from "./chat-composer-events.js";
import { filterHiddenPosts,getHerePosts,getReplyPostsForEno,getSelfPostsForEno } from "./chat-post-filter.js";
import { getPlaceIdFromQuery, moveToChatPlace } from "./chat-navigation.js";
import { getAvailableChatActions } from "./chat-action-resolver.js";
import { buildActionLogPostInput } from "./chat-action-post.js";
import { renderChatActionSection } from "./chat-action-view.js";


const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenPostIds = new Set();
let currentViewMode = "chat";
let isShopOpen = false;
let isActionOpen = false;

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
  moveToChatPlace(placeId, {
    onBeforeMove: () => {
      isShopOpen = false;
      isActionOpen = false;
    }
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
    isActionOpen = false,
    onToggleShop = null,
    onToggleAction = null
  } = options;

  if (!place) {
    return [];
  }

  const sameGroupPlaces =
    place.kind === "room"
      ? []
      : getPlacesInSameGroup(place)
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

  if (place.kind !== "room") {
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
  }

  tabs.push({
    key: "action",
    label: "ACTION",
    isActive: isActionOpen,
    isDisabled: typeof onToggleAction !== "function",
    onClick: () => {
      if (typeof onToggleAction === "function") {
        onToggleAction();
      }
    }
  });

  return tabs;
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
  postActions,
  getQuotePreviewPostById,
  currentEno
}) {
  if (!postListRefs?.list || !composerRefs?.textarea) {
    return;
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

const rawDisplayPosts =
  currentViewMode === "reply"
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

    const displayPosts = filterHiddenPosts(rawDisplayPosts, hiddenPostIds);

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
      postActions,
      currentEno,
      getReplyTargetLabels,
      getQuotePreviewPostById
    });
  }

  bindComposerDraftPreviewEvents(composerRefs, refreshDraftPreview);
  
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

    const validationError = validateComposerDraftForPost(currentDraft, character);

    if (validationError) {
      alert(validationError);
      return;
    }

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

if (!place) {
  return;
}

const allPosts = getAllPosts();
const composerDraft = loadComposerDraft();
const replySourcePost = findReplySourcePost(allPosts, composerDraft);

const fixedReplyTargetName = getFixedReplyTargetName(replySourcePost);

const placeTabs = buildPlaceTabs(place, {
  isShopOpen,
  isActionOpen,
  onToggleShop: () => {
    isShopOpen = !isShopOpen;
    isActionOpen = false;
    renderChatPlaceInfo();
  },
  onToggleAction: () => {
    isActionOpen = !isActionOpen;
    isShopOpen = false;
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
  renderShopPlaceholderSection(chatMainArea);
} else if (isActionOpen) {
const availableActions = getAvailableChatActions({
  place,
  character
});

renderChatActionSection(chatMainArea, {
  actions: availableActions,
  onSelectAction: (action) => {
    const actionPostInput = buildActionLogPostInput({
      action,
      place,
      character
    });

    if (!actionPostInput) {
      alert("アクションを実行できません");
      return;
    }

    createPost(actionPostInput);
    isActionOpen = false;
    renderChatPlaceInfo();
    showToast("アクションログを送信しました", {
      type: "success"
    });
  }
});
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

  setupRenderedComposer({
    composerRefs,
    composerDraft,
    character,
    chatIconPicker
  });
}

const handleReply = (post) => {
  if (!composerRefs) {
    return;
  }

  const currentDraft = saveComposerDraft(
    readComposerDraftFromRefs(composerRefs)
  );

  const replyState = createReplyStateFromPost(post);
  const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

  saveComposerDraft(nextDraft);
  renderChatPlaceInfo();
};

const handleDelete = createDeleteHandler({
  currentEno: eno,
  rerender: renderChatPlaceInfo
});

const handleHide = createHideHandler({
  hiddenPostIds,
  rerender: renderChatPlaceInfo
});

const handleQuote = createQuoteHandler({
  composerRefs
});

const postActions = createPostActions({
  onReply: handleReply,
  onDelete: handleDelete,
  onOpenThread: (post) => {
    openThreadFromPost(post, getPlaceIdFromQuery() || "F1-1");
  },
  onQuote: handleQuote,
  onHide: handleHide
});

renderViewTabsSection(chatMainArea, {
  tabs: viewTabs
});


const rawDisplayPosts =
  currentViewMode === "reply"
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

const displayPosts = filterHiddenPosts(rawDisplayPosts, hiddenPostIds);

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
    postActions,
    getQuotePreviewPostById,
    currentEno: eno
  });

  setupComposerSubmit({
    place,
    character,
    composerRefs
  });
}

  renderFavoritesSidePanel(rightPanel, {
    defaultTab: "place",
    favoritePlaces: getFavoritePlaces(),
    onMoveToPlace: moveToPlace
  });
}


renderChatPlaceInfo();
