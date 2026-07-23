//chat-controller.js

import { places } from "../data/places-data.js";

import { createPost,getReplySourcePostForDraft } from "../services/post-service.js";
import { getChatPostsForViewMode, normalizeEno } from "../services/chat-post-query-service.js";
import { getFavoriteCharacters, loadFavoriteCharacterEnos } from "../services/character-favorite-service.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { addUnreadCountsToPlaces, markPlaceReadAtLatestPost } from "../services/place-unread-service.js";

import { createIconPicker } from "../common/icon-picker.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { showToast } from "../common/toast.js";

import { getPlaceById,getPlaceLabel,getFavoritePlaces,isFavoritePlace,toggleFavoritePlace } from "./chat-place-utils.js";
import { buildChatUrl,getChatAuthorEnoFromQuery,getChatMessageFilterEnoFromQuery,getChatPageFromQuery,getChatViewFromQuery,getPlaceIdFromQuery, moveToChatPlace } from "./chat-navigation.js";

import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,clearComposerDraft } from "./chat-composer-state.js";
import { addEnoToTargetText } from "./chat-target-utils.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft } from "./chat-reply-state.js";
import { buildComposerMessageInput,buildComposerPostInput,buildDraftPreviewPost,validateComposerDraftForMessage,validateComposerDraftForPost } from "./chat-composer-post.js";
import { setupRenderedComposer, getFixedReplyTargetName } from "./chat-composer-ui.js";
import { bindComposerDraftPreviewEvents } from "./chat-composer-events.js";

import { filterHiddenPosts } from "./chat-post-filter.js";
import { createPostActions,openThreadFromPost,getReplyTargetLabels,createDeleteHandler,createHideHandler,createQuoteHandler,getQuotePreviewPostById } from "./chat-post-action-helpers.js";

import { getAvailableChatActions } from "./chat-action-resolver.js";
import { buildActionLogPostInput } from "./chat-action-post.js";

import { renderPlaceInfoSection } from "./chat-header-view.js";
import { renderChatComposerSection } from "./chat-composer-view.js";
import { renderPlaceTabsSection,renderViewTabsSection } from "./chat-tabs-view.js";
import { renderPostListSection,renderPostListContent } from "./chat-post-view.js";
import { loadChatPageSize,saveChatPageSize } from "./chat-pagination-state.js";
import { renderChatPaginationSection } from "./chat-pagination-view.js";
import { renderChatActionSection } from "./chat-action-view.js";

import { hasShopForPlace } from "../services/shop-service.js";
import { canAccessRoom, isInviteRoom, isInviteRoomPost } from "../services/room-service.js";
import { purchaseItems as purchaseInventoryItems,getInventoryLogs,markInventoryLogPosted } from "../services/inventory-service.js";
import { renderShopSection,renderShopPurchaseConfirmModalIfNeeded } from "./chat-shop-view.js";

const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenPostIds = new Set();
let currentViewMode = getChatViewFromQuery();
let openedAuthorEno = getChatAuthorEnoFromQuery();
let messageFilterEno = getChatMessageFilterEnoFromQuery();
if (currentViewMode === "eno" && !openedAuthorEno) {
  currentViewMode = "chat";
}
let currentChatPage = getChatPageFromQuery();
let currentFavoritesTab = "place";
let isShopOpen = false;
let isActionOpen = false;
let selectedActionId = "";
let selectedLogId = "";
let pendingShopPurchaseItems = [];

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

function openShopPurchaseConfirm(purchaseItems) {
  pendingShopPurchaseItems = purchaseItems;
  renderChatPlaceInfo();
}

function closeShopPurchaseConfirm() {
  pendingShopPurchaseItems = [];
  renderChatPlaceInfo();
}

function resetUtilityStateBeforeMove() {
  isShopOpen = false;
  isActionOpen = false;
  selectedActionId = "";
  selectedLogId = "";
}

function moveToPlace(placeId) {
  const account = getCurrentAccount();

  if (!account?.eno) {
    resetUtilityStateBeforeMove();
    window.location.href = buildChatUrl({
      placeId,
      view: "chat",
      page: 1
    });
    return;
  }

  moveToChatPlace(placeId, {
    onBeforeMove: resetUtilityStateBeforeMove
  });
}

function navigateChatPageWithToast({ placeId, view = "chat", page = 1, message, type = "success", filterEno = null }) {
  sessionStorage.setItem(
    "chatToastMessage",
    JSON.stringify({
      message,
      type
    })
  );

  window.location.href = buildChatUrl({
    placeId,
    view,
    page,
    filterEno
  });
}

function replaceChatUrl({ placeId, view = currentViewMode, page = 1, eno = openedAuthorEno, filterEno = messageFilterEno }) {
  const nextUrl = buildChatUrl({
    placeId,
    view,
    page,
    eno,
    filterEno: view === "message" ? filterEno : null
  });

  const currentUrl = `${window.location.pathname}${window.location.search}`;
  const normalizedNextUrl = nextUrl.replace(/^\./, "");

  if (currentUrl !== normalizedNextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}


function getPaginationState(posts = [], requestedPage = 1, pageSize = 30) {
  const totalItems = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex: startIndex + pageSize
  };
}

function getPagedPosts(posts = [], pagination = {}) {
  return posts.slice(pagination.startIndex, pagination.endIndex);
}

let activeChatTimelineContext = null;

function saveActiveComposerDraft() {
  const composerRefs = activeChatTimelineContext?.composerRefs;

  if (!composerRefs) {
    return loadComposerDraft();
  }

  return saveComposerDraft(
    readComposerDraftFromRefs(composerRefs)
  );
}

function selectChatViewMode(mode, selectOptions = {}) {
  const context = activeChatTimelineContext;

  if (!context?.place) {
    return;
  }

  saveActiveComposerDraft();

  if (selectOptions.closeAuthorEno) {
    openedAuthorEno = null;
  } else if (selectOptions.eno) {
    openedAuthorEno = selectOptions.eno;
  }

  currentViewMode = mode;
  if (mode !== "message") {
    messageFilterEno = null;
  }
  currentChatPage = 1;
  replaceChatUrl({
    placeId: context.place.placeId,
    view: currentViewMode,
    page: currentChatPage,
    eno: openedAuthorEno,
    filterEno: messageFilterEno
  });

  renderChatPlaceInfo();
}

function renderActiveChatViewTabs() {
  const context = activeChatTimelineContext;

  if (!context?.viewTabsContainer) {
    return;
  }

  context.viewTabsContainer.innerHTML = "";

  renderViewTabsSection(context.viewTabsContainer, {
    tabs: buildViewTabs({
      currentMode: currentViewMode,
      authorEno: openedAuthorEno,
      onSelectMode: selectChatViewMode
    })
  });
}

function renderMessageFilterSection(container, options = {}) {
  const {
    filterEno = null,
    onApplyFilter = null
  } = options;

  if (!container) {
    return;
  }

  const form = document.createElement("form");
  form.className = "chatMessageFilterForm";

  const label = document.createElement("label");
  label.className = "chatMessageFilterLabel";
  label.textContent = "送受信Eno:";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.className = "chatMessageFilterInput";
  input.value = filterEno ? String(filterEno) : "";
  input.placeholder = "Eno";

  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button-box chatMessageFilterButton";
  button.textContent = "絞り込み";

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(button);

  if (filterEno) {
    const status = document.createElement("span");
    status.className = "chatMessageFilterStatus";
    status.textContent = `Eno.${filterEno} とのメッセージを表示中`;
    form.appendChild(status);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextFilterEno = normalizeEno(input.value);

    if (typeof onApplyFilter === "function") {
      onApplyFilter(nextFilterEno || null);
    }
  });

  container.appendChild(form);
}

function renderActiveChatTimeline() {
  const context = activeChatTimelineContext;

  if (!context?.timelineContainer || !context.place) {
    return;
  }

  const {
    timelineContainer,
    place,
    eno,
    composerRefs,
    postActions,
    handleAuthorIconClick
  } = context;

  const rawDisplayPosts = getChatPostsForViewMode({
    viewMode: currentViewMode,
    currentPlace: place,
    places,
    viewerEno: eno,
    favoriteEnos: loadFavoriteCharacterEnos({ currentEno: eno }),
    targetEno: openedAuthorEno,
    messageFilterEno
  });

  const displayPosts = filterHiddenPosts(rawDisplayPosts, hiddenPostIds);
  const pageSize = loadChatPageSize();
  const pagination = getPaginationState(displayPosts, currentChatPage, pageSize);
  currentChatPage = pagination.currentPage;

  replaceChatUrl({
    placeId: place.placeId,
    view: currentViewMode,
    page: pagination.currentPage,
    eno: openedAuthorEno
  });

  timelineContainer.innerHTML = "";

  if (currentViewMode === "message") {
    renderMessageFilterSection(timelineContainer, {
      filterEno: messageFilterEno,
      onApplyFilter: (nextFilterEno) => {
        messageFilterEno = nextFilterEno;
        currentChatPage = 1;
        renderActiveChatTimeline();
      }
    });
  }

  const pagedDisplayPosts = getPagedPosts(displayPosts, pagination);
  const postListRefs = renderPostListSection(timelineContainer, {
    posts: pagedDisplayPosts,
    getPlaceLabel,
    onMoveToPlace: moveToPlace,
    isPlaceLinkDisabled: post => isInviteRoom(getPlaceById(post?.placeId)),
    postActions,
    currentEno: eno,
    getReplyTargetLabels,
    getQuotePreviewPostById,
    onAuthorIconClick: handleAuthorIconClick
  });

  renderChatPaginationSection(timelineContainer, {
    pagination,
    pageSize,
    onSelectPage: (page) => {
      currentChatPage = page;
      renderActiveChatTimeline();
    },
    onChangePageSize: (nextPageSize) => {
      saveChatPageSize(nextPageSize);
      currentChatPage = 1;
      renderActiveChatTimeline();
    }
  });

  if (composerRefs && currentViewMode !== "message") {
    setupDraftPreview({
      postListRefs,
      place,
      character: context.character,
      composerRefs,
      getPlaceLabel,
      postActions,
      getQuotePreviewPostById,
      currentEno: eno,
      pagination,
      onAuthorIconClick: handleAuthorIconClick
    });
  }
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
    onToggleAction = null,
    onSelectCurrentPlace = null
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

  const tabs = sameGroupPlaces.map(item => {
    const isCurrentPlace = item.placeId === place.placeId;

    return {
      key: `layer-${item.layer}`,
      label: String(item.layer ?? "").toUpperCase(),
      isActive: isCurrentPlace,
      isCurrent: isCurrentPlace,
      isDisabled: false,
      onClick: () => {
        if (isCurrentPlace) {
          if (typeof onSelectCurrentPlace === "function") {
            onSelectCurrentPlace();
          }
          return;
        }

        moveToPlace(item.placeId);
      }
    };
  });

if (hasShopForPlace(place)) {
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
    authorEno = null,
    onSelectMode = null
  } = options;

  const tabs = [
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
      isActive: currentMode === "message",
      isCurrent: currentMode === "message",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("message");
        }
      }
    },
    {
      key: "favorite",
      label: "FAVORITE",
      isActive: currentMode === "favorite",
      isCurrent: currentMode === "favorite",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("favorite");
        }
      }
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

  const normalizedAuthorEno = Number(authorEno || 0);

  if (Number.isInteger(normalizedAuthorEno) && normalizedAuthorEno > 0) {
    tabs.push({
      key: `eno-${normalizedAuthorEno}`,
      label: `Eno.${normalizedAuthorEno}`,
      isActive: currentMode === "eno",
      isCurrent: currentMode === "eno",
      isDisabled: typeof onSelectMode !== "function",
      onClick: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("eno", {
            eno: normalizedAuthorEno
          });
        }
      },
      onClose: () => {
        if (typeof onSelectMode === "function") {
          onSelectMode("chat", {
            closeAuthorEno: true
          });
        }
      }
    });
  }

  return tabs;
}
function setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
  getPlaceLabel,
  postActions,
  getQuotePreviewPostById,
  currentEno,
  pagination,
  onAuthorIconClick = null
}) {
  if (!postListRefs?.list || !composerRefs?.textarea) {
    return;
  }

  composerRefs.draftPreviewState = {
    postListRefs,
    place,
    character,
    getPlaceLabel,
    postActions,
    getQuotePreviewPostById,
    currentEno,
    pagination,
    onAuthorIconClick,
    isPlaceLinkDisabled: isInviteRoomPost
  };

  function refreshDraftPreview() {
    const state = composerRefs.draftPreviewState;

    if (!state?.postListRefs?.list) {
      return;
    }
    
    const currentDraft = readComposerDraftFromRefs(composerRefs);

    const rawDisplayPosts = getChatPostsForViewMode({
      viewMode: currentViewMode,
      currentPlace: state.place,
      places,
      viewerEno: state.currentEno,
      favoriteEnos: loadFavoriteCharacterEnos({ currentEno: state.currentEno }),
      targetEno: openedAuthorEno,
      messageFilterEno
    });

    const displayPosts = filterHiddenPosts(rawDisplayPosts, hiddenPostIds);

    const draftPreviewPost = buildDraftPreviewPost({
      place: state.place,
      character: state.character,
      draft: currentDraft,
      replySourcePost: getReplySourcePostForDraft(currentDraft)
    });

    const pagedPosts = getPagedPosts(displayPosts, state.pagination);

    const postsForRender = draftPreviewPost
      ? [draftPreviewPost, ...pagedPosts]
      : pagedPosts;

    renderPostListContent(state.postListRefs.list, {
      posts: postsForRender,
      getPlaceLabel: state.getPlaceLabel,
      postActions: state.postActions,
      currentEno: state.currentEno,
      getReplyTargetLabels,
      getQuotePreviewPostById: state.getQuotePreviewPostById,
      onAuthorIconClick: state.onAuthorIconClick,
      isPlaceLinkDisabled: state.isPlaceLinkDisabled
    });
  }

  if (!composerRefs.isDraftPreviewBound) {
    bindComposerDraftPreviewEvents(composerRefs, refreshDraftPreview);
    composerRefs.isDraftPreviewBound = true;
  }
  
  refreshDraftPreview();
}

function setupComposerSubmit({
  place,
  character,
  composerRefs,
  isMessageMode = false
}) {
  if (!composerRefs?.submitButton) {
    return;
  }

  composerRefs.submitButton.addEventListener("click", () => {
    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    const validationError = isMessageMode
      ? validateComposerDraftForMessage(currentDraft, character)
      : validateComposerDraftForPost(currentDraft, character);

    if (validationError) {
      alert(validationError);
      return;
    }

    const postInput = isMessageMode
      ? buildComposerMessageInput({
          character,
          draft: currentDraft
        })
      : buildComposerPostInput({
          place,
          character,
          draft: currentDraft,
          replySourcePost: getReplySourcePostForDraft(currentDraft)
        });

    if (!postInput) {
  alert("本文を入力してください");
  return;
}

if (
  !isMessageMode &&
  postInput.visibility === "private" &&
  Array.isArray(postInput.visibleToEnoList) &&
  postInput.visibleToEnoList.length <= 1
) {
  const ok = window.confirm(
    "返信先が設定されていません。\nこの発言は自分にしか見えませんが投稿しますか？"
  );

  if (!ok) {
    return;
  }
}

createPost(postInput);

    clearComposerDraft();
    isShopOpen = false;
    isActionOpen = false;
    selectedActionId = "";
    selectedLogId = "";

    if (isMessageMode) {
      navigateChatPageWithToast({
        placeId: place.placeId,
        view: "message",
        page: 1,
        message: "メッセージを送信しました",
        type: "success"
      });
      return;
    }
    
    navigateChatPageWithToast({
      placeId: place.placeId,
      view: "chat",
      page: 1,
      message: "発言を投稿しました",
      type: "success"
    });
      });
    }

function renderInteractionPanel(container, options = {}) {
  const {
    title = ""
  } = options;

  if (!container) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "chatInteractionSection";

  const inner = document.createElement("div");
  inner.className = "chatInteractionInner";

  const panel = document.createElement("div");
  panel.className = "common-card-framed common-card-rounded-lg common-card-panel chatInteractionPanel";

  if (title) {
    const heading = document.createElement("div");
    heading.className = "common-gradientHeading commonSectionHeading commonSectionHeading-small chatInteractionHeading";
    heading.textContent = title;
    panel.appendChild(heading);
  }

  const body = document.createElement("div");
  body.className = "chatInteractionBody";

  panel.appendChild(body);
  inner.appendChild(panel);
  section.appendChild(inner);
  container.appendChild(section);

  return {
    section,
    inner,
    panel,
    body
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
  const roomAccess = canAccessRoom(place, account);

  if (!roomAccess.ok && roomAccess.reason === "login-required") {
    window.location.href = "./index.html";
    return;
  }

  if (!roomAccess.ok && roomAccess.reason === "private") {
    sessionStorage.setItem(
      "chatToastMessage",
      JSON.stringify({
        message: "現在このルームは非公開です",
        type: "info"
      })
    );
    window.location.href = "./map.html";
    return;
  }

  const aroundBasePlace = getAroundBasePlace(place);
  openedAuthorEno = getChatAuthorEnoFromQuery();
  messageFilterEno = currentViewMode === "message"
    ? getChatMessageFilterEnoFromQuery()
    : null;

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
  onToggleFavorite: account ? (targetPlace) => {
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
  } : null
});

if (!place) {
  return;
}

markPlaceReadAtLatestPost(place.placeId, {
  viewerEno: eno
});

if (isShopOpen && !hasShopForPlace(place)) {
  isShopOpen = false;
}

const composerDraft = loadComposerDraft();
const replySourcePost = getReplySourcePostForDraft(composerDraft);

const fixedReplyTargetName = getFixedReplyTargetName(replySourcePost);

const placeTabs = buildPlaceTabs(place, {
  isShopOpen,
  isActionOpen,
  onToggleShop: () => {
    isShopOpen = !isShopOpen;
    isActionOpen = false;
    selectedActionId = "";
    selectedLogId = "";
    renderChatPlaceInfo();
  },
  onToggleAction: () => {
    isActionOpen = !isActionOpen;
    isShopOpen = false;

    if (!isActionOpen) {
      selectedActionId = "";
      selectedLogId = "";
    }

    renderChatPlaceInfo();
  },
  onSelectCurrentPlace: () => {
    isShopOpen = false;
    isActionOpen = false;
    selectedActionId = "";
    renderChatPlaceInfo();
    selectedLogId = "";
  }
});

if (placeTabs.length > 0) {
  renderPlaceTabsSection(chatMainArea, {
    tabs: placeTabs
  });
}

let composerRefs = null;

const isMessageMode = currentViewMode === "message";

const interactionTitle =
  isShopOpen
    ? "SHOP"
    : isActionOpen
      ? "ACTION"
      : isMessageMode
        ? "MESSAGE"
        : replySourcePost
          ? "REPLY"
          : "POST";

const interactionPanelRefs = renderInteractionPanel(chatMainArea, {
  title: interactionTitle
});

if (isShopOpen || isActionOpen) {
  interactionPanelRefs?.panel?.classList.add("chatInteractionPanelUtility");
} else if (isMessageMode) {
  interactionPanelRefs?.panel?.classList.add("chatInteractionPanelMessage");
} else if (replySourcePost) {
  interactionPanelRefs?.panel?.classList.add("chatInteractionPanelReply");
}

const interactionPanel = interactionPanelRefs?.body ?? chatMainArea;

if (isShopOpen) {
  renderShopSection(interactionPanel, {
    place,
    onPurchaseRequest: openShopPurchaseConfirm
  });
} else if (isActionOpen) {
  const availableActions = getAvailableChatActions({
    place,
    character
  });

  const actionChoices = [
    ...availableActions,
    {
      actionId: "post-log",
      label: "ログを流す",
      type: "log",
      description: "保存済みの購入ログなどを選んで、現在地のログへ流します。"
    }
  ];

if (
  selectedActionId &&
  !actionChoices.some(action => action.actionId === selectedActionId)
) {
  selectedActionId = "";
  selectedLogId = "";
}

const logOptions = getInventoryLogs(eno).map(log => ({
  ...log,
  label: `${log.logType === "purchase" ? "購入ログ" : "ログ"}：${log.message ?? ""}${log.isPosted ? "（投稿済み）" : ""}`
}));

renderChatActionSection(interactionPanel, {
  actions: actionChoices,
  selectedActionId,
  selectedLogId,
  logOptions,
  onSelectAction: (action) => {
    const actionId = action.actionId ?? "";

    selectedActionId =
      selectedActionId === actionId
        ? ""
        : actionId;

    selectedLogId = "";
    renderChatPlaceInfo();
  },
  onSelectLog: (logId) => {
    selectedLogId = logId;
    renderChatPlaceInfo();
  },
  onExecuteAction: (action) => {
    if (action.actionId === "post-log") {
      const selectedLog = logOptions.find(log => log.logId === selectedLogId);

      if (!selectedLog) {
        alert("流すログを選択してください");
        return;
      }

      if (selectedLog.isPosted) {
        alert("このログはすでに流されています");
        return;
      }

      createPost({
        type: "actionLog",
        placeId: place.placeId,
        authorEno: character.eno,
        speakerName: character.fullName || character.defaultName || "誰か",
        body: selectedLog.message
      });

      markInventoryLogPosted(eno, selectedLog.logId);
      isShopOpen = false;
      isActionOpen = false;
      selectedActionId = "";
      selectedLogId = "";

      navigateChatPageWithToast({
        placeId: place.placeId,
        view: "chat",
        page: 1,
        message: "ログを流しました",
        type: "success"
      });
      return;
    }

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
    isShopOpen = false;
    isActionOpen = false;
    selectedActionId = "";
    selectedLogId = "";

    navigateChatPageWithToast({
      placeId: place.placeId,
      view: "chat",
      page: 1,
      message: "アクションを実行しました",
      type: "success"
    });
      }
    });
    } else {
  composerRefs = renderChatComposerSection(interactionPanel, {
    composerDraft,
    replySourcePost: isMessageMode ? null : replySourcePost,
    getPlaceLabel,
    currentPlaceLabel: getPlaceLabel(place.placeId),
    useCurrentPlaceForReply: composerDraft.useCurrentPlaceForReply,
    fixedReplyTargetEno: isMessageMode ? null : composerDraft.fixedReplyTargetEno,
    fixedReplyTargetName: isMessageMode ? "" : fixedReplyTargetName,
    isAdditionalTargetOpen: isMessageMode ? true : composerDraft.isAdditionalTargetOpen,
    composerMode: isMessageMode ? "message" : "chat",
    targetLabelText: isMessageMode ? "送信先" : "追加返信先",
    targetInputPlaceholder: isMessageMode ? "送信先Enoを入力" : "返信先Enoを入力　,区切りで複数指定可能",
    isTargetAlwaysOpen: isMessageMode,
    hidePlaceInfo: isMessageMode,
    hidePrivateToggle: isMessageMode,
    submitButtonText: isMessageMode ? "送信" : "投稿",
    onClearReply: () => {
      const currentDraft = saveComposerDraft(
        readComposerDraftFromRefs(composerRefs)
      );

      const nextDraft = clearReplyState(currentDraft);
      saveComposerDraft(nextDraft);
      renderChatPlaceInfo();
    }
  });

  composerRefs.interactionPanel = interactionPanelRefs?.panel ?? null;

  setupRenderedComposer({
    composerRefs,
    composerDraft,
    character,
    chatIconPicker
  });
}

if (!account) {
  interactionPanelRefs?.section?.remove();
  composerRefs = null;
}

const handleReply = (post) => {
  const currentDraft = composerRefs
    ? saveComposerDraft(
        readComposerDraftFromRefs(composerRefs)
      )
    : loadComposerDraft();

  const replyState = createReplyStateFromPost(post, {
    currentEno: eno
  });
  const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

  saveComposerDraft(nextDraft);

  isShopOpen = false;
  isActionOpen = false;
  selectedActionId = "";
  selectedLogId = "";

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

const handleQuote = (post) => {
  if (!post || typeof post.postId !== "number") {
    return;
  }

  if (composerRefs?.textarea) {
    createQuoteHandler({
      composerRefs
    })(post);

    return;
  }

  const currentDraft = loadComposerDraft();
  const quoteText = `>>${post.postId}`;

  const currentBody =
    typeof currentDraft.body === "string"
      ? currentDraft.body
      : "";

  const nextBody =
    currentBody.trim() === ""
      ? quoteText
      : `${currentBody}\n${quoteText}`;

  saveComposerDraft({
    ...currentDraft,
    body: nextBody
  });

  isShopOpen = false;
  isActionOpen = false;
  selectedActionId = "";
  selectedLogId = "";

  renderChatPlaceInfo();
};

const handleAuthorIconClick = ({ authorEno: selectedAuthorEno } = {}) => {
  const normalizedAuthorEno = Number(selectedAuthorEno || 0);

  if (!Number.isInteger(normalizedAuthorEno) || normalizedAuthorEno <= 0) {
    return;
  }
  
  saveActiveComposerDraft();

  openedAuthorEno = normalizedAuthorEno;
  currentViewMode = "eno";
  currentChatPage = 1;
  replaceChatUrl({
    placeId: place.placeId,
    view: currentViewMode,
    page: currentChatPage,
    eno: openedAuthorEno
  });

  renderChatPlaceInfo();
};

const readCurrentComposerDraft = () => composerRefs
  ? saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    )
  : loadComposerDraft();

const handleFavoriteCharacterReply = (favoriteCharacter) => {
  const currentDraft = readCurrentComposerDraft();

  saveComposerDraft({
    ...currentDraft,
    additionalTargetEnoText: addEnoToTargetText(
      currentDraft.additionalTargetEnoText,
      favoriteCharacter?.eno
    ),
    isAdditionalTargetOpen: true
  });

  currentViewMode = "chat";
  isShopOpen = false;
  isActionOpen = false;
  selectedActionId = "";
  selectedLogId = "";

  renderChatPlaceInfo();
};

const handleFavoriteCharacterMessage = (favoriteCharacter) => {
  const targetEno = Number(favoriteCharacter?.eno || 0);

  if (!Number.isInteger(targetEno) || targetEno <= 0) {
    return;
  }

  const currentDraft = readCurrentComposerDraft();

  saveComposerDraft({
    ...currentDraft,
    additionalTargetEnoText: String(targetEno),
    isAdditionalTargetOpen: true
  });

  currentViewMode = "message";
  messageFilterEno = null;
  isShopOpen = false;
  isActionOpen = false;
  selectedActionId = "";
  selectedLogId = "";

  renderChatPlaceInfo();
};

const postActions = createPostActions({
  onReply: handleReply,
  onDelete: handleDelete,
  onOpenThread: (post) => {
    openThreadFromPost(post, getPlaceIdFromQuery() || "F1-1");
  },
  onQuote: handleQuote,
  onHide: handleHide
});

const viewTabsContainer = document.createElement("div");
viewTabsContainer.className = "chatViewTabsMount";
chatMainArea.appendChild(viewTabsContainer);
  
const timelineContainer = document.createElement("div");
timelineContainer.className = "chatTimelineMount";
chatMainArea.appendChild(timelineContainer);

activeChatTimelineContext = {
  viewTabsContainer,
  timelineContainer,
  place,
  eno,
  character,
  composerRefs,
  postActions,
  handleAuthorIconClick
};

currentChatPage = getChatPageFromQuery();
renderActiveChatViewTabs();
renderActiveChatTimeline();
  
if (composerRefs) {
  setupComposerSubmit({
    place,
    character,
    composerRefs,
    isMessageMode
  });
}

renderShopPurchaseConfirmModalIfNeeded(chatMainArea, {
  purchaseItems: pendingShopPurchaseItems,
  onConfirm: () => {
    const result = purchaseInventoryItems({
      eno,
      character,
      purchaseItems: pendingShopPurchaseItems
    });

    closeShopPurchaseConfirm();

    if (!result.ok) {
      showToast(result.message, {
        type: "error"
      });
      return;
    }

    isShopOpen = false;
    renderChatPlaceInfo();
    showToast(`購入しました（${result.totalPrice} C）`, {
      type: "success"
    });
  },
  onCancel: closeShopPurchaseConfirm
});
  
  renderFavoritesSidePanel(rightPanel, {
    isLoggedIn: Boolean(account),
    defaultTab: currentFavoritesTab,
    favoritePlaces: addUnreadCountsToPlaces(getFavoritePlaces(), { viewerEno: eno }),
    favoriteCharacters: getFavoriteCharacters({ currentEno: eno }),
    onMoveToPlace: moveToPlace,
    showCharacterReplyAction: true,
    showCharacterMessageAction: true,
    showCharacterMemo: true,
    onReplyToCharacter: handleFavoriteCharacterReply,
    onMessageToCharacter: handleFavoriteCharacterMessage,
    onTabChange: (tab) => {
      currentFavoritesTab = tab;
    }
  });
}


renderChatPlaceInfo();
