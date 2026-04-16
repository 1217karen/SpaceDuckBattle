//chat-controller.js

import { places } from "../data/places-data.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { createIconPicker, getNoImageUrl, normalizeCommIcons, setButtonPreview } from "../common/icon-picker.js";
import { bindSpeakerNameSync } from "../common/speaker-name-sync.js";
import { createPost, getAllPosts } from "../services/post-service.js";
import { getDisplayPosts } from "./chat-display-rules.js";
import { renderPlaceInfoSection,renderThreadHeaderSection,renderPlaceTabsSection,renderChatComposerSection,
        renderViewTabsSection,renderPostListSection,renderPostListContent} from "./chat-view.js";
import { loadComposerDraft,saveComposerDraft,readComposerDraftFromRefs,applyComposerDraftToRefs} from "./chat-composer-state.js";
import { createReplyStateFromPost,clearReplyState,applyReplyStateToDraft,findReplySourcePost} from "./chat-reply-state.js";
import { buildComposerPostInput,buildDraftPreviewPost} from "./chat-composer-post.js";
import { getThreadRootPostIdFromQuery,getThreadPosts,buildThreadViewLabel} from "./chat-thread-view.js";

const centerPanel = document.querySelector(".center-panel");
const chatIconPicker = createIconPicker();

function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}

function getPlaceById(placeId) {
  return places.find(place => place.placeId === placeId) || null;
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

  saveCharacter(eno, {
    ...character,
    currentPlaceId: placeId
  });

  window.location.href =
    `./chat.html?placeId=${encodeURIComponent(placeId)}`;
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
    `./chat.html?placeId=${encodeURIComponent(placeId)}&threadRootPostId=${encodeURIComponent(threadRootPostId)}`;
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

function buildPlaceTabs(place) {
  if (!place) {
    return [];
  }

  if (place.kind === "room") {
    const tabs = [];

    if (place.accessType === "public" || place.accessType === "password" || place.accessType === "private") {
      tabs.push({
        key: "shop",
        label: "SHOP",
        isActive: false,
        isDisabled: true
      });
    }

    return tabs;
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
    isActive: false,
    isDisabled: true
  });

  return tabs;
}

function buildViewTabs() {
  return [
    {
      key: "chat",
      label: "CHAT",
      isActive: true,
      isDisabled: true
    },
    {
      key: "reply",
      label: "REPLY",
      isActive: false,
      isDisabled: true
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
      isActive: false,
      isDisabled: true
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
  onReply,
  onOpenThread,
  threadRootPostId = null,
  currentEno
}) {
  if (!postListRefs?.list || !composerRefs?.textarea) {
    return;
  }

  function refreshDraftPreview() {
    const currentDraft = readComposerDraftFromRefs(composerRefs);

    const displayPosts = threadRootPostId
      ? getThreadPosts(allPosts, threadRootPostId).map(post => ({
          ...post,
          displayType: "normal"
        }))
      : getDisplayPosts({
          currentPlace: place,
          allPosts,
          places
        });

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
      onReply,
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
    renderChatPlaceInfo();
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

function renderChatPlaceInfo() {
  if (!centerPanel) return;

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

centerPanel.innerHTML = "";

renderPlaceInfoSection(centerPanel, {
  place,
  aroundBasePlace,
  places,
  onMoveToPlace: moveToPlace
});

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

const placeTabs = buildPlaceTabs(place);
const viewTabs = buildViewTabs();

renderPlaceTabsSection(centerPanel, {
  tabs: placeTabs
});

  if (threadRootPostId && threadRootPost) {
  const threadHeading = document.createElement("h2");
  threadHeading.textContent = buildThreadViewLabel(threadRootPost);
  centerPanel.appendChild(threadHeading);
}

const composerRefs = renderChatComposerSection(centerPanel, {
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

setupComposerIconPicker(composerRefs, character);

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
  renderChatPlaceInfo();
};

renderViewTabsSection(centerPanel, {
  tabs: viewTabs
});


const displayPosts = threadRootPostId
  ? threadPosts.map(post => ({
      ...post,
      displayType: "normal"
    }))
  : getDisplayPosts({
      currentPlace: place,
      allPosts,
      places
    });

const postListRefs = renderPostListSection(centerPanel, {
  posts: displayPosts,
  getPlaceLabel,
  onMoveToPlace: moveToPlace,
  onReply: handleReply,
  currentEno: eno,
  getReplyTargetLabels,
  onOpenThread: openThread
});

setupDraftPreview({
  postListRefs,
  place,
  character,
  composerRefs,
  allPosts,
  getPlaceLabel,
  onMoveToPlace: moveToPlace,
  onReply: handleReply,
  onOpenThread: openThread,
  threadRootPostId,
  currentEno: eno
});

setupComposerSubmit({
  place,
  character,
  composerRefs
});
}

renderChatPlaceInfo();
