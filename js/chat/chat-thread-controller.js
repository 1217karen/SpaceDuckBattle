//chat-thread-controller.js


import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, normalizeCommIcons, setButtonPreview } from "../common/icon-picker.js";
import { bindSpeakerNameSync } from "../common/speaker-name-sync.js";
import { createPost, getAllPosts } from "../services/post-service.js";
import {
  renderThreadHeaderSection,
  renderChatComposerSection,
  renderPostListSection,
  renderPostListContent
} from "./chat-view.js";
import {
  loadComposerDraft,
  saveComposerDraft,
  readComposerDraftFromRefs,
  applyComposerDraftToRefs
} from "./chat-composer-state.js";
import {
  createReplyStateFromPost,
  clearReplyState,
  applyReplyStateToDraft,
  findReplySourcePost
} from "./chat-reply-state.js";
import {
  buildComposerPostInput,
  buildDraftPreviewPost
} from "./chat-composer-post.js";
import { getThreadRootPostIdFromQuery, getThreadPosts } from "./chat-thread-view.js";

const centerPanel = document.querySelector(".center-panel");
const chatIconPicker = createIconPicker();

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
  currentEno
}) {
  if (!postListRefs?.list || !composerRefs?.textarea) {
    return;
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

    const draftPreviewPost = buildDraftPreviewPost({
      place,
      character,
      draft: currentDraft,
      replySourcePost: findReplySourcePost(threadPosts, currentDraft)
    });

    const postsForRender = draftPreviewPost
      ? [...threadPosts, draftPreviewPost]
      : threadPosts;

    renderPostListContent(postListRefs.list, {
      posts: postsForRender,
      getPlaceLabel,
      onMoveToPlace: null,
      onReply: handleReply,
      currentEno,
      getReplyTargetLabels,
      onOpenThread: openThread
    });
  }

  composerRefs.textarea.addEventListener("input", refreshDraftPreview);
  composerRefs.nameInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.replyTargetInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.iconButton?.addEventListener("iconchange", refreshDraftPreview);
  composerRefs.useCurrentPlaceCheckbox?.addEventListener("change", refreshDraftPreview);
  composerRefs.additionalTargetSection?.addEventListener("toggle", refreshDraftPreview);

  const handleReply = (post) => {
    const currentDraft = saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );

    const replyState = createReplyStateFromPost(post);
    const nextDraft = applyReplyStateToDraft(currentDraft, replyState);

    saveComposerDraft(nextDraft);
    renderThreadPage();
  };

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

  renderThreadHeaderSection(centerPanel, {
    memoText: "この欄は非公開メモ用です。"
  });

  const closeButtonRow = document.createElement("div");
  closeButtonRow.style.maxWidth = "800px";
  closeButtonRow.style.margin = "0 auto 12px";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "チャット画面に戻る";
  closeButton.addEventListener("click", closeThread);

  closeButtonRow.appendChild(closeButton);
  centerPanel.appendChild(closeButtonRow);

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

  const postListRefs = renderPostListSection(centerPanel, {
    posts: threadPosts.map(post => ({
      ...post,
      displayType: "normal"
    })),
    getPlaceLabel,
    onMoveToPlace: null,
    onReply: handleReply,
    currentEno: eno,
    getReplyTargetLabels,
    onOpenThread: openThread
  });

  centerPanel.appendChild(composerRefs.section);

  setupDraftPreview({
    postListRefs,
    place,
    character,
    composerRefs,
    threadPosts,
    currentEno: eno
  });

  setupComposerSubmit({
    place,
    character,
    composerRefs,
    threadPosts
  });
}

renderThreadPage();
