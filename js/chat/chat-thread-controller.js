//chat-thread-controller.js

import { getPlaceById, getPlaceLabel, getFavoritePlaces } from "./chat-place-utils.js";
import { getPlaceIdFromQuery, navigateToChatPlace } from "./chat-navigation.js";

import { createPost,getReplySourcePostForDraft,getThreadPostsByRootId } from "../services/post-service.js";
import { getFavoriteCharacters } from "../services/character-favorite-service.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { addUnreadCountsToPlaces } from "../services/place-unread-service.js";
import { isInviteRoom, isInviteRoomPost, isInviteRoomReplyBlocked, isPrivateRoom } from "../services/room-service.js";

import { createIconPicker } from "../common/icon-picker.js";
import { renderFavoritesSidePanel } from "../common/favorites-panel.js";
import { showToast } from "../common/toast.js";

import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,clearComposerDraft } from "./chat-composer-state.js";
import { addEnoToTargetText } from "./chat-target-utils.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost } from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost,validateComposerDraftForPost } from "./chat-composer-post.js";
import { setupRenderedComposer, getFixedReplyTargetName } from "./chat-composer-ui.js";
import { bindComposerDraftPreviewEvents } from "./chat-composer-events.js";

import { loadThreadPrivateNote,saveThreadPrivateNote } from "./chat-thread-private-note.js";
import { getThreadRootPostIdFromQuery } from "./chat-thread-utils.js";

import { getThreadDisplayPosts } from "./chat-post-filter.js";
import { createPostActions,openThreadFromPost,getReplyTargetLabels,createDeleteHandler,createHideHandler,createQuoteHandler,getQuotePreviewPostById } from "./chat-post-action-helpers.js";

import { renderThreadHeaderSection } from "./chat-header-view.js";
import { renderChatComposerSection } from "./chat-composer-view.js";
import { createPostCard,renderPostListSection,renderPostListContent } from "./chat-post-view.js";



const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenThreadPostIds = new Set();
let currentFavoritesTab = "place";

function closeThread() {
  const account = getCurrentAccount();
  const character = account?.eno ? loadCharacter(account.eno) : null;
  const placeId =
    typeof character?.currentPlaceId === "string" &&
    character.currentPlaceId.trim() !== ""
      ? character.currentPlaceId
      : getPlaceIdFromQuery() || "F1-1";

  navigateToChatPlace(placeId, {
    withToast: false
  });
}


function setupDraftPreview({
  postListRefs,
  currentPlace,
  character,
  composerRefs,
  threadPosts,
  currentEno,
  postActions,
  getQuotePreviewPostById,
  isReplyDisabled,
  onReplyDisabled
}) {
  if (!postListRefs?.section || !postListRefs?.list || !composerRefs?.textarea || !composerRefs?.section) {
    return;
  }

  let draftPreviewContainer =
    postListRefs.section.querySelector(".chatThreadDraftPreviewSection");

  if (!draftPreviewContainer) {
    draftPreviewContainer = document.createElement("section");
    draftPreviewContainer.className = "chatThreadDraftPreviewSection";
    postListRefs.section.appendChild(draftPreviewContainer);
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

    renderPostListContent(postListRefs.list, {
      posts: getThreadDisplayPosts(threadPosts, hiddenThreadPostIds, currentEno),
      getPlaceLabel,
      postActions,
      currentEno,
      getReplyTargetLabels,
      getQuotePreviewPostById,
      isPlaceLinkDisabled: isInviteRoomPost,
      isReplyDisabled,
      onReplyDisabled
    });

    draftPreviewContainer.innerHTML = "";

    const draftPreviewPost = buildDraftPreviewPost({
      place: currentPlace,
      character,
      draft: currentDraft,
      replySourcePost: findReplySourcePost(threadPosts, currentDraft)
    });

    if (!draftPreviewPost) {
      return;
    }

    const previewCard = createPostCard(draftPreviewPost, {
      isPreview: false,
      getPlaceLabel,
      currentEno,
      hideActions: true,
      getReplyTargetLabels,
      isPlaceLinkDisabled: isInviteRoomPost,
      isReplyDisabled,
      onReplyDisabled
    });

    previewCard.classList.add("chatComposerReplyPreviewCard");

    draftPreviewContainer.appendChild(previewCard);
  }
  
  bindComposerDraftPreviewEvents(composerRefs, refreshDraftPreview);

  refreshDraftPreview();
}

function setupComposerSubmit({
  currentPlace,
  character,
  composerRefs,
  threadPosts,
  threadRootPostId
}) {
  if (!composerRefs?.submitButton) {
    return;
  }

  composerRefs.submitButton.addEventListener("click", () => {
    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    if (
      !currentDraft.replyParentPostId ||
      !currentDraft.replyThreadRootPostId
    ) {
      alert("返信先が設定されていません");
      return;
    }

    if (currentDraft.replyThreadRootPostId !== threadRootPostId) {
      alert(
        "現在表示中のツリーとは別の発言への返信です。\nツリーを閉じてから投稿してください。"
      );
      return;
    }

    const validationError = validateComposerDraftForPost(currentDraft, character);

    if (validationError) {
      alert(validationError);
      return;
    }

    const postInput = buildComposerPostInput({
      place: currentPlace,
      character,
      draft: currentDraft,
      replySourcePost: findReplySourcePost(threadPosts, currentDraft)
    });

    if (!postInput) {
      alert("本文を入力してください");
      return;
    }

    if (
      postInput.visibility === "private" &&
      Array.isArray(postInput.visibleToEnoList) &&
      postInput.visibleToEnoList.length <= 1
    ) {
      const ok = window.confirm(
        "返信先が設定されていません。\nこの秘話は自分にしか見えません。投稿しますか？"
      );

      if (!ok) {
        return;
      }
    }

    createPost(postInput);

    clearComposerDraft();
    renderThreadPage();
    showToast("発言を投稿しました", { type: "success" });
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

function getCharacterCurrentPlace(character, fallbackPlaceId) {
  const currentPlaceId =
    typeof character?.currentPlaceId === "string" && character.currentPlaceId.trim() !== ""
      ? character.currentPlaceId
      : fallbackPlaceId;

  return getPlaceById(currentPlaceId) || getPlaceById(fallbackPlaceId);
}

function buildThreadPlaceTrailItems(posts = []) {
  const items = [];
  let previousPlaceId = "";

  posts.forEach(post => {
    const placeId =
      typeof post?.placeId === "string"
        ? post.placeId.trim()
        : "";

    if (!placeId || placeId === previousPlaceId) {
      return;
    }

    const place = getPlaceById(placeId);

    items.push({
      placeId,
      label: getPlaceLabel(placeId),
      isLinkDisabled: isInviteRoom(place) || isPrivateRoom(place)
    });
    previousPlaceId = placeId;
  });

  return items;
}

function showInviteRoomReplyBlockedToast() {
  showToast("同じルームにいる人のみ返信できます", { type: "info" });
}

function renderThreadPage() {
  if (!centerPanel || !chatMainArea) {
    return;
  }

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId = getPlaceIdFromQuery() || "F1-1";
  const place = getPlaceById(placeId);
  const currentPlace = getCharacterCurrentPlace(character, placeId) || place;
  const threadRootPostId = getThreadRootPostIdFromQuery();

  chatMainArea.innerHTML = "";

  if (!threadRootPostId) {
    const errorText = document.createElement("p");
    errorText.textContent = "返信ツリーIDが指定されていません。";
    chatMainArea.appendChild(errorText);
    return;
  }

  const threadPosts = getThreadPostsByRootId(threadRootPostId);
  const displayThreadPosts = getThreadDisplayPosts(threadPosts, hiddenThreadPostIds, eno);

  if (threadPosts.length === 0) {
    const errorText = document.createElement("p");
    errorText.textContent = "返信ツリーが見つかりません。";
    chatMainArea.appendChild(errorText);
    return;
  }

  const initialThreadPrivateNote = loadThreadPrivateNote({
    ownerEno: eno,
    threadRootPostId
  });

  const threadHeaderRefs = renderThreadHeaderSection(chatMainArea, {
    memoText: initialThreadPrivateNote,
    isMemoOpen:
      typeof initialThreadPrivateNote === "string" &&
      initialThreadPrivateNote.trim() !== "",
    onCloseThread: closeThread,
    showPrivateMemo: Boolean(account),
    placeTrailItems: buildThreadPlaceTrailItems(displayThreadPosts),
    onMoveToPlace: navigateToChatPlace
  });

  if (threadHeaderRefs?.memoSaveButton && threadHeaderRefs?.memoTextarea) {
    threadHeaderRefs.memoSaveButton.addEventListener("click", () => {
      saveThreadPrivateNote({
        ownerEno: eno,
        threadRootPostId,
        noteText: threadHeaderRefs.memoTextarea.value
      });

      showToast("非公開メモを保存しました", {
        type: "success"
      });
    });
  }

  const composerDraft = loadComposerDraft();
  const replySourcePost = getReplySourcePostForDraft(composerDraft);
  const fixedReplyTargetName = getFixedReplyTargetName(replySourcePost);

  let composerRefs = null;

  const handleReply = (post) => {
    if (!composerRefs) {
      return;
    }

    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    const replyState = createReplyStateFromPost(post, {
      currentEno: eno
    });
    const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

    saveComposerDraft(nextDraft);
    renderThreadPage();
  };

  const handleDelete = createDeleteHandler({
    currentEno: eno,
    rerender: renderThreadPage
  });

  const handleHide = createHideHandler({
    hiddenPostIds: hiddenThreadPostIds,
    rerender: renderThreadPage
  });

  const handleQuote = (post) => {
    if (!composerRefs) {
      return;
    }

    createQuoteHandler({
      composerRefs
    })(post);
  };

  const handleFavoriteCharacterReply = (favoriteCharacter) => {
    if (!composerRefs) {
      return;
    }

    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    saveComposerDraft({
      ...currentDraft,
      additionalTargetEnoText: addEnoToTargetText(
        currentDraft.additionalTargetEnoText,
        favoriteCharacter?.eno
      ),
      isAdditionalTargetOpen: true
    });

    renderThreadPage();
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
  
  const isReplyDisabled = post => isInviteRoomReplyBlocked(post, currentPlace);

  const postListRefs = renderPostListSection(chatMainArea, {
    posts: displayThreadPosts,
    getPlaceLabel,
    postActions,
    currentEno: eno,
    getReplyTargetLabels,
    getQuotePreviewPostById,
    isPlaceLinkDisabled: isInviteRoomPost,
    isReplyDisabled,
    onReplyDisabled: showInviteRoomReplyBlockedToast
  });

  const hasReplySource = Boolean(replySourcePost);

  const interactionPanelRefs = account
    ? renderInteractionPanel(chatMainArea, { title: hasReplySource ? "REPLY" : "POST" })
    : null;

  if (hasReplySource) {
    interactionPanelRefs?.panel?.classList.add("chatInteractionPanelReply");
  }

  const interactionPanel = interactionPanelRefs?.body ?? null;

  if (interactionPanel) {
    composerRefs = renderChatComposerSection(interactionPanel, {
      composerDraft,
      replySourcePost,
      getPlaceLabel,
      currentPlaceLabel: getPlaceLabel(currentPlace?.placeId ?? placeId),
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
        renderThreadPage();
      }
    });
  
    composerRefs.interactionPanel = interactionPanelRefs?.panel ?? null;

    setupRenderedComposer({
      composerRefs,
      composerDraft,
      character,
      chatIconPicker
    });

    setupDraftPreview({
      postListRefs,
      currentPlace,
      character,
      composerRefs,
      threadPosts,
      currentEno: eno,
      postActions,
      getQuotePreviewPostById,
      isReplyDisabled,
      onReplyDisabled: showInviteRoomReplyBlockedToast
    });

    setupComposerSubmit({
      currentPlace,
      character,
      composerRefs,
      threadPosts,
      threadRootPostId
    });
  }
  renderFavoritesSidePanel(rightPanel, {
    isLoggedIn: Boolean(account),
    defaultTab: currentFavoritesTab,
    favoritePlaces: addUnreadCountsToPlaces(getFavoritePlaces(), { viewerEno: eno }),
    favoriteCharacters: getFavoriteCharacters({ currentEno: eno }),
    showCharacterReplyAction: true,
    showCharacterMessageAction: false,
    showCharacterMemo: true,
    onReplyToCharacter: handleFavoriteCharacterReply,
    onTabChange: (tab) => {
      currentFavoritesTab = tab;
    }
  });
}

renderThreadPage();
