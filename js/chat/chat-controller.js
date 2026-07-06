//chat-controller.js

import { places } from "../data/places-data.js";

import { createPost,getReplySourcePostForDraft } from "../services/post-service.js";
import { getChatPostsForViewMode } from "../services/chat-post-query-service.js";
import { getFavoriteCharacters, loadFavoriteCharacterEnos } from "../services/character-favorite-service.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";

import { createIconPicker } from "../common/icon-picker.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { showToast } from "../common/toast.js";

import { getPlaceById,getPlaceLabel,getFavoritePlaces,isFavoritePlace,toggleFavoritePlace } from "./chat-place-utils.js";
import { getPlaceIdFromQuery, moveToChatPlace } from "./chat-navigation.js";

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
import { renderChatActionSection } from "./chat-action-view.js";

import { hasShopForPlace } from "../services/shop-service.js";
import { purchaseItems as purchaseInventoryItems,getInventoryLogs,markInventoryLogPosted } from "../services/inventory-service.js";
import { renderShopSection,renderShopPurchaseConfirmModalIfNeeded } from "./chat-shop-view.js";

const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenPostIds = new Set();
let currentViewMode = "chat";
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

function moveToPlace(placeId) {
  moveToChatPlace(placeId, {
    onBeforeMove: () => {
      isShopOpen = false;
      isActionOpen = false;
      selectedActionId = "";
      selectedLogId = "";
    }
  });
}

function reloadChatPageWithToast(message, type = "success") {
  sessionStorage.setItem(
    "chatToastMessage",
    JSON.stringify({
      message,
      type
    })
  );

  window.location.reload();
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
}

function setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
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

    const rawDisplayPosts = getChatPostsForViewMode({
      viewMode: currentViewMode,
      currentPlace: place,
      places,
      viewerEno: currentEno,
      favoriteEnos: loadFavoriteCharacterEnos({ currentEno })
    });

    const displayPosts = filterHiddenPosts(rawDisplayPosts, hiddenPostIds);

    const draftPreviewPost = buildDraftPreviewPost({
      place,
      character,
      draft: currentDraft,
      replySourcePost: getReplySourcePostForDraft(currentDraft)
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
      currentViewMode = "message";
      renderChatPlaceInfo();
      showToast("メッセージを送信しました", { type: "success" });
      return;
    }
    
    reloadChatPageWithToast("発言を投稿しました", "success");
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

const viewTabs = buildViewTabs({
  currentMode: currentViewMode,
  onSelectMode: (mode) => {
    currentViewMode = mode;
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

if (isMessageMode) {
  interactionPanelRefs?.panel?.classList.add("chatInteractionPanelMessage");
} else if (!isShopOpen && !isActionOpen && replySourcePost) {
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

      reloadChatPageWithToast("ログを流しました", "success");
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

    reloadChatPageWithToast("アクションを実行しました", "success");
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

renderViewTabsSection(chatMainArea, {
  tabs: viewTabs
});


const rawDisplayPosts = getChatPostsForViewMode({
  viewMode: currentViewMode,
  currentPlace: place,
  places,
  viewerEno: eno,
  favoriteEnos: loadFavoriteCharacterEnos({ currentEno: eno })
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
  if (!isMessageMode) {
    setupDraftPreview({
      postListRefs,
      place,
      character,
      composerRefs,
      getPlaceLabel,
      postActions,
      getQuotePreviewPostById,
      currentEno: eno
    });
  }

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
    defaultTab: currentFavoritesTab,
    favoritePlaces: getFavoritePlaces(),
    favoriteCharacters: getFavoriteCharacters({ currentEno: eno }),
    onMoveToPlace: moveToPlace,
    showCharacterReplyAction: true,
    showCharacterMessageAction: true,
    onReplyToCharacter: handleFavoriteCharacterReply,
    onMessageToCharacter: handleFavoriteCharacterMessage,
    onTabChange: (tab) => {
      currentFavoritesTab = tab;
    }
  });
}


renderChatPlaceInfo();
