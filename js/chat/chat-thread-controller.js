//chat-thread-controller.js


import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, normalizeCommIcons, setButtonPreview } from "../common/icon-picker.js";
import { bindSpeakerNameSync } from "../common/speaker-name-sync.js";
import { createPost,deletePost,getAllPosts,getAllPostsIncludingDeleted} from "../services/post-service.js";
import { createPostCard,renderThreadHeaderSection,renderChatComposerSection,renderPostListSection,renderPostListContent} from "./chat-view.js";
import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,applyComposerDraftToRefs} from "./chat-composer-state.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost} from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost} from "./chat-composer-post.js";
import { getThreadRootPostIdFromQuery, getThreadPosts } from "./chat-thread-view.js";
import { createPostActions } from "./chat-post-actions.js";
import { showToast } from "../common/toast.js";
import { loadThreadPrivateNote,saveThreadPrivateNote} from "./chat-thread-private-note.js";

const centerPanel = document.querySelector(".center-panel");
const chatIconPicker = createIconPicker();
const hiddenThreadPostIds = new Set();

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}

function getPlaceById(placeId) {
  return places.find(place => place.placeId === placeId) || null;
}

function getPlaceLabel(placeId) {
  const place = getPlaceById(placeId);
  return place?.name || placeId;
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
    `./chat-thread.html?placeId=${encodeURIComponent(placeId)}&threadRootPostId=${encodeURIComponent(threadRootPostId)}`;
}

function closeThread() {
  const placeId = getPlaceIdFromQuery() || "F1-1";
  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
}

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

function getInitialComposerIcon(character) {
  const commIcons = normalizeCommIcons(character?.commIcons);
  const defaultIconUrl =
    typeof character?.defaultIcon === "string"
      ? character.defaultIcon.trim()
      : "";

  if (defaultIconUrl !== "") {
    return {
      iconId: null,
      iconUrl: defaultIconUrl
    };
  }

  if (commIcons.length > 0) {
    return {
      iconId: commIcons[0].id,
      iconUrl: commIcons[0].url
    };
  }

  return {
    iconId: null,
    iconUrl: getNoImageUrl()
  };
}

function setupComposerIconPicker(composerRefs, character) {
  if (!composerRefs?.iconButton) {
    return;
  }

  const commIcons = normalizeCommIcons(character?.commIcons);
  const initialIcon = getInitialComposerIcon(character);

  setButtonPreview(
    composerRefs.iconButton,
    initialIcon.iconId,
    initialIcon.iconUrl
  );

  bindSpeakerNameSync({
    nameInput: composerRefs.nameInput,
    button: composerRefs.iconButton,
    getIcons: () => commIcons,
    getDefaultName: () =>
      typeof character?.defaultName === "string"
        ? character.defaultName.trim()
        : "",
    mode: "value"
  });

  composerRefs.iconButton.addEventListener("click", () => {
    chatIconPicker.open(composerRefs.iconButton, commIcons);
  });
}

function setupComposerDraftPersistence(composerRefs) {
  if (!composerRefs) {
    return;
  }

  function persistDraft() {
    saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );
  }

  composerRefs.nameInput?.addEventListener("input", persistDraft);
  composerRefs.textarea?.addEventListener("input", persistDraft);
  composerRefs.replyTargetInput?.addEventListener("input", persistDraft);
  composerRefs.iconButton?.addEventListener("iconchange", persistDraft);
  composerRefs.useCurrentPlaceCheckbox?.addEventListener("change", persistDraft);
  composerRefs.additionalTargetSection?.addEventListener("toggle", persistDraft);
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
      alert("返信先を選んでから投稿してください");
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

function renderThreadPage() {
  if (!centerPanel) {
    return;
  }

  const account = getCurrentAccount();
  const eno = account?.eno ?? null;
  const character = eno ? loadCharacter(eno) : null;

  const placeId = getPlaceIdFromQuery() || "F1-1";
  const place = getPlaceById(placeId);
  const threadRootPostId = getThreadRootPostIdFromQuery();

  centerPanel.innerHTML = "";

  if (!threadRootPostId) {
    const errorText = document.createElement("p");
    errorText.textContent = "返信ツリーIDが指定されていません。";
    centerPanel.appendChild(errorText);
    return;
  }

  const allPosts = getAllPosts();
  const threadPosts = getThreadPosts(allPosts, threadRootPostId);

  if (threadPosts.length === 0) {
    const errorText = document.createElement("p");
    errorText.textContent = "返信ツリーが見つかりません。";
    centerPanel.appendChild(errorText);
    return;
  }

  const initialThreadPrivateNote = loadThreadPrivateNote({
    ownerEno: eno,
    threadRootPostId
  });

  const threadHeaderRefs = renderThreadHeaderSection(centerPanel, {
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
  const lastThreadPost = threadPosts[threadPosts.length - 1] || null;

  const effectiveReplySourcePost = replySourcePost || lastThreadPost;

  const replyTargetCharacter =
    effectiveReplySourcePost?.authorEno
      ? loadCharacter(effectiveReplySourcePost.authorEno)
      : null;

  const fixedReplyTargetName =
    typeof replyTargetCharacter?.defaultName === "string" &&
    replyTargetCharacter.defaultName.trim() !== ""
      ? replyTargetCharacter.defaultName.trim()
      : (typeof effectiveReplySourcePost?.speakerName === "string"
          ? effectiveReplySourcePost.speakerName
          : "");

  const composerRefs = renderChatComposerSection(centerPanel, {
    composerDraft: replySourcePost
      ? composerDraft
      : applyReplyStateToDraft(composerDraft, createReplyStateFromPost(lastThreadPost)),
    replySourcePost: effectiveReplySourcePost,
    getPlaceLabel,
    currentPlaceLabel: getPlaceLabel(place?.placeId ?? placeId),
    useCurrentPlaceForReply: composerDraft.useCurrentPlaceForReply,
    fixedReplyTargetEno:
      replySourcePost?.authorEno ??
      lastThreadPost?.authorEno ??
      composerDraft.fixedReplyTargetEno,
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

  setupComposerIconPicker(composerRefs, character);
  setupComposerDraftPersistence(composerRefs);

  if (replySourcePost) {
    applyComposerDraftToRefs(composerRefs, composerDraft);
  } else {
    applyComposerDraftToRefs(
      composerRefs,
      applyReplyStateToDraft(composerDraft, createReplyStateFromPost(lastThreadPost))
    );
  }

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
  };

  const handleHide = (post) => {
    if (!post || typeof post.postId !== "number") {
      return;
    }

    hiddenThreadPostIds.add(post.postId);
    renderThreadPage();
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

  const postListRefs = renderPostListSection(centerPanel, {
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

  centerPanel.appendChild(composerRefs.section);

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
}

renderThreadPage();
