//chat-thread-controller.js


import { places } from "../data/places-data.js";
import { getPlaceById, getPlaceLabel, getFavoritePlaces } from "./chat-place-utils.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, setButtonPreview } from "../common/icon-picker.js";
import { setupComposerIconPicker, setupComposerDraftPersistence } from "./chat-composer-ui.js";
import { createPost,deletePost,getAllPosts,getAllPostsIncludingDeleted} from "../services/post-service.js";
import { createPostCard,renderThreadHeaderSection,renderChatComposerSection,renderPostListSection,renderPostListContent} from "./chat-view.js";
import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,applyComposerDraftToRefs} from "./chat-composer-state.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost} from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost} from "./chat-composer-post.js";
import { getThreadRootPostIdFromQuery, getThreadPosts } from "./chat-thread-view.js";
import { createPostActions } from "./chat-post-actions.js";
import { showToast } from "../common/toast.js";
import { loadThreadPrivateNote,saveThreadPrivateNote} from "./chat-thread-private-note.js";
import { renderFavoritePlacesPanel } from "./chat-favorites-panel.js";
import { openThreadFromPost, getReplyTargetLabels } from "./chat-post-utils.js";

const centerPanel = document.querySelector(".center-panel");
const chatMainArea = document.querySelector("#chatMainArea");
const rightPanel = document.querySelector(".right-panel");
const chatIconPicker = createIconPicker();
const hiddenThreadPostIds = new Set();

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");

function closeThread() {
  const placeId = getPlaceIdFromQuery() || "F1-1";
  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
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
      posts: threadPosts.filter(post =>
        !hiddenThreadPostIds.has(post.postId)
      ),
      getPlaceLabel,
      onMoveToPlace: null,
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
      onMoveToPlace: null,
      onReply: null,
      currentEno,
      hideActions: true,
      getReplyTargetLabels,
      onOpenThread: null
    });

    previewCard.classList.add("chatComposerReplyPreviewCard");

    draftPreviewContainer.appendChild(previewCard);
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

    createPost(postInput);

    const allPosts = getAllPosts();
    const latestThreadPosts = getThreadPosts(allPosts, currentDraft.replyThreadRootPostId);
    const lastPost = latestThreadPosts[latestThreadPosts.length - 1] || null;

    const nextReplyState = createReplyStateFromPost(lastPost);

    const clearedDraft = applyReplyStateToDraft(
      {
        ...currentDraft,
        body: "",
        additionalTargetEnoText: ""
      },
      nextReplyState
    );

    saveComposerDraft(clearedDraft);
    renderThreadPage();
  });
}

function renderRightPanel() {
  if (!rightPanel) {
    return;
  }

  rightPanel.innerHTML = "";

  renderFavoritePlacesPanel(rightPanel, {
    favoritePlaces: getFavoritePlaces(),
    onMoveToPlace: (placeId) => {
      if (!placeId) {
        return;
      }

      window.location.href =
        `./chat.html?placeId=${encodeURIComponent(placeId)}`;
    }
  });
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

  const allPosts = getAllPosts();
  const threadPosts = getThreadPosts(allPosts, threadRootPostId);

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

  const composerRefs = renderChatComposerSection(chatMainArea, {
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

  const handleReply = (post) => {
    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    const replyState = createReplyStateFromPost(post);
    const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

    saveComposerDraft(nextDraft);
    renderThreadPage();
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
    renderThreadPage();
    showToast("発言を削除しました", { type: "success" });
  };

  const handleHide = (post) => {
    if (!post || typeof post.postId !== "number") {
      return;
    }

    hiddenThreadPostIds.add(post.postId);
    renderThreadPage();
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
    onOpenThread: (post) => {
      openThreadFromPost(post, getPlaceIdFromQuery() || "F1-1");
    },
    onQuote: handleQuote,
    onHide: handleHide
  });

  const postListRefs = renderPostListSection(chatMainArea, {
    posts: threadPosts
      .filter(post => !hiddenThreadPostIds.has(post.postId))
      .map(post => ({
        ...post,
        displayType: "normal"
      })),
    getPlaceLabel,
    onMoveToPlace: null,
    postActions,
    currentEno: eno,
    getReplyTargetLabels,
    getQuotePreviewPostById
  });

setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
  threadPosts,
  currentEno: eno,
  postActions,
  getQuotePreviewPostById
});

  setupComposerSubmit({
    place,
    character,
    composerRefs,
    threadPosts
  });
    renderRightPanel();
}

renderThreadPage();
