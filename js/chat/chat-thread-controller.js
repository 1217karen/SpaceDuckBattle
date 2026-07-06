//chat-thread-controller.js

import { getPlaceById, getPlaceLabel, getFavoritePlaces } from "./chat-place-utils.js";
import { getPlaceIdFromQuery, navigateToChatPlace } from "./chat-navigation.js";

import { createPost,getReplySourcePostForDraft,getThreadPostsByRootId } from "../services/post-service.js";
import { getFavoriteCharacters } from "../services/character-favorite-service.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";

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
  const placeId = getPlaceIdFromQuery() || "F1-1";

  navigateToChatPlace(placeId, {
    withToast: false
  });
}


function setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
  threadPosts,
  currentEno,
  postActions,
  getQuotePreviewPostById
}) {
  if (!postListRefs?.list || !composerRefs?.textarea || !composerRefs?.section) {
    return;
  }

  let draftPreviewContainer =
    composerRefs.section.nextElementSibling &&
    composerRefs.section.nextElementSibling.classList.contains("chatThreadDraftPreviewSection")
      ? composerRefs.section.nextElementSibling
      : null;

  if (!draftPreviewContainer) {
    draftPreviewContainer = document.createElement("section");
    draftPreviewContainer.className = "chatThreadDraftPreviewSection";
    composerRefs.section.insertAdjacentElement("afterend", draftPreviewContainer);
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

    renderPostListContent(postListRefs.list, {
      posts: getThreadDisplayPosts(threadPosts, hiddenThreadPostIds, currentEno),
      getPlaceLabel,
      postActions,
      currentEno,
      getReplyTargetLabels,
      getQuotePreviewPostById
    });

    draftPreviewContainer.innerHTML = "";

    const draftPreviewPost = buildDraftPreviewPost({
      place,
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
      getReplyTargetLabels
    });

    previewCard.classList.add("chatComposerReplyPreviewCard");

    draftPreviewContainer.appendChild(previewCard);
  }
  
  bindComposerDraftPreviewEvents(composerRefs, refreshDraftPreview);

  refreshDraftPreview();
}

function setupComposerSubmit({
  place,
  character,
  composerRefs,
  threadPosts
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

    const validationError = validateComposerDraftForPost(currentDraft, character);

    if (validationError) {
      alert(validationError);
      return;
    }

    const postInput = buildComposerPostInput({
      place,
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
  panel.className = "common-card-framed common-card-rounded-lg common-card-panel chatInteractionPanel";
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

function renderThreadPage() {
  if (!centerPanel || !chatMainArea) {
    return;
  }

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId = getPlaceIdFromQuery() || "F1-1";
  const place = getPlaceById(placeId);
  const threadRootPostId = getThreadRootPostIdFromQuery();

  chatMainArea.innerHTML = "";

  if (!threadRootPostId) {
    const errorText = document.createElement("p");
    errorText.textContent = "返信ツリーIDが指定されていません。";
    chatMainArea.appendChild(errorText);
    return;
  }

  const threadPosts = getThreadPostsByRootId(threadRootPostId);

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
    onCloseThread: closeThread
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

  const postListRefs = renderPostListSection(chatMainArea, {
    posts: getThreadDisplayPosts(threadPosts, hiddenThreadPostIds, eno),
    getPlaceLabel,
    postActions,
    currentEno: eno,
    getReplyTargetLabels,
    getQuotePreviewPostById
  });

  const interactionPanelRefs = renderInteractionPanel(chatMainArea, {
    title: "REPLY"
  });

  interactionPanelRefs?.panel?.classList.add("chatInteractionPanelReply");

  const interactionPanel = interactionPanelRefs?.body ?? chatMainArea;

  composerRefs = renderChatComposerSection(interactionPanel, {
    composerDraft,
    replySourcePost,
    getPlaceLabel,
    currentPlaceLabel: getPlaceLabel(place?.placeId ?? placeId),
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
    place,
    character,
    composerRefs,
    threadPosts,
    currentEno: eno,
    postActions,
    getQuotePreviewPostById,
  });

  setupComposerSubmit({
    place,
    character,
    composerRefs,
    threadPosts
  });
  renderFavoritesSidePanel(rightPanel, {
    defaultTab: currentFavoritesTab,
    favoritePlaces: getFavoritePlaces(),
    favoriteCharacters: getFavoriteCharacters({ currentEno: eno }),
    showCharacterReplyAction: true,
    showCharacterMessageAction: false,
    onReplyToCharacter: handleFavoriteCharacterReply,
    onTabChange: (tab) => {
      currentFavoritesTab = tab;
    }
  });
}

renderThreadPage();
