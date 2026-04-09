//chat-controller.js

import { places } from "../data/places-data.js";
import { posts } from "../data/posts-data.js";
import { renderRichText } from "../common/rich-text.js";
import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";

const centerPanel = document.querySelector(".center-panel");

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

function getPostsByPlaceId(placeId) {
  return posts.filter(post => post.placeId === placeId);
}

function getPlaceLabel(placeId) {
  const place = getPlaceById(placeId);
  return place?.name || placeId;
}

function stripRichTextTags(text) {
  return String(text ?? "").replace(/<\/?(b|i|u|s|br|rb|rt|f1|f2|f3|f4|f5|f6|f7)>/g, "");
}

function getPreviewText(text) {
  const plainText = stripRichTextTags(text);
  const length = plainText.length;

  if (length <= 5) {
    return plainText;
  }

  if (length <= 24) {
    return plainText.slice(0, length - 5) + "……";
  }

  return plainText.slice(0, 20) + "……";
}

function getMainFieldPreviewPosts(currentPlace) {
  if (!currentPlace) return [];

  if (currentPlace.kind !== "field") return [];
  if (currentPlace.layer !== "main") return [];

  const childMainAreas = places.filter(place =>
    place.kind === "area" &&
    place.layer === "main" &&
    place.parentId === currentPlace.placeId
  );

  const previewPosts = [];

  childMainAreas.forEach(areaPlace => {
    previewPosts.push(...getPostsByPlaceId(areaPlace.placeId));
  });

  return previewPosts;
}

function getSideFieldPreviewPosts(currentPlace) {
  if (!currentPlace) return [];

  if (currentPlace.kind !== "field") return [];
  if (currentPlace.layer !== "side") return [];

  const mainField = places.find(place =>
    place.kind === "field" &&
    place.groupId === currentPlace.groupId &&
    place.layer === "main"
  );

  if (!mainField) return [];

  return getPostsByPlaceId(mainField.placeId);
}

function getMainAreaPreviewPosts(currentPlace) {
  if (!currentPlace) return [];

  if (currentPlace.kind !== "area") return [];
  if (currentPlace.layer !== "main") return [];

  const previewPosts = [];

  const parentMainField = places.find(place =>
    place.kind === "field" &&
    place.layer === "main" &&
    place.placeId === currentPlace.parentId
  );

  if (parentMainField) {
    previewPosts.push(...getPostsByPlaceId(parentMainField.placeId));
  }

  return previewPosts;
}

function getSideAreaPreviewPosts(currentPlace) {
  if (!currentPlace) return [];

  if (currentPlace.kind !== "area") return [];
  if (currentPlace.layer !== "side") return [];

  const mainArea = places.find(place =>
    place.kind === "area" &&
    place.groupId === currentPlace.groupId &&
    place.layer === "main"
  );

  if (!mainArea) {
    return [];
  }

  return getPostsByPlaceId(mainArea.placeId);
}

function getRoomPreviewPosts(currentPlace) {
  if (!currentPlace) return [];

  if (currentPlace.kind !== "room") return [];

  if (!currentPlace.showParentMainAreaPreview) {
    return [];
  }

  const parentMainArea = places.find(place =>
    place.kind === "area" &&
    place.layer === "main" &&
    place.placeId === currentPlace.parentId
  );

  if (!parentMainArea) {
    return [];
  }

  return getPostsByPlaceId(parentMainArea.placeId);
}

function getDisplayPosts(currentPlace) {
  const normalPosts =
    getPostsByPlaceId(currentPlace.placeId)
      .map(post => ({
        ...post,
        displayType: "normal"
      }));

  const sideFieldPreviewPosts =
    getSideFieldPreviewPosts(currentPlace)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const mainFieldPreviewPosts =
    getMainFieldPreviewPosts(currentPlace)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const mainAreaPreviewPosts =
    getMainAreaPreviewPosts(currentPlace)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const sideAreaPreviewPosts =
    getSideAreaPreviewPosts(currentPlace)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const roomPreviewPosts =
    getRoomPreviewPosts(currentPlace)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  return [
    ...normalPosts,
    ...sideFieldPreviewPosts,
    ...mainFieldPreviewPosts,
    ...mainAreaPreviewPosts,
    ...sideAreaPreviewPosts,
    ...roomPreviewPosts
  ].sort((a, b) => b.postId - a.postId);
}

function createPostCard(post, options = {}) {
  const {
    isPreview = false
  } = options;

  const postBox = document.createElement("div");
  postBox.className = isPreview
    ? "chatPostCard chatPostCardPreview"
    : "chatPostCard";

  const left = document.createElement("div");
  left.className = "chatPostCardLeft";

  const right = document.createElement("div");
  right.className = "chatPostCardRight";

  if (!isPreview) {
    const iconBox = document.createElement("div");
    iconBox.className = "chatPostIcon";
    iconBox.textContent = "□";
    left.appendChild(iconBox);
  }

  const header = document.createElement("div");
  header.className = "chatPostHeader";

  const headerLeft = document.createElement("div");
  headerLeft.className = "chatPostHeaderLeft";

  const headerRight = document.createElement("div");
  headerRight.className = "chatPostHeaderRight";

  if (!isPreview) {
    const name = document.createElement("div");
    name.className = "chatPostName";
    name.textContent = `${post.speakerName} / Eno:${post.authorEno}`;
    headerLeft.appendChild(name);
  }

  const postNo = document.createElement("div");
  postNo.className = "chatPostNo";
  postNo.textContent = `No.${post.postId}`;

  headerRight.appendChild(postNo);
  header.appendChild(headerLeft);
  header.appendChild(headerRight);

  const divider = document.createElement("div");
  divider.className = "chatPostDivider";

  const body = document.createElement("div");
  body.className = "chatPostBody";

  if (isPreview) {
    body.textContent = getPreviewText(post.body);
  } else {
    renderRichText(body, post.body, { preset: "message" });
  }

  const actions = document.createElement("div");
  actions.className = "chatPostActions";

  if (!isPreview) {
    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "chatPostActionButton";
    replyButton.textContent = "返信";

    const quoteButton = document.createElement("button");
    quoteButton.type = "button";
    quoteButton.className = "chatPostActionButton";
    quoteButton.textContent = "引用";

    actions.appendChild(replyButton);
    actions.appendChild(quoteButton);
  }

  const footer = document.createElement("div");
  footer.className = "chatPostFooter";
  footer.textContent = `${post.createdAt} / ${getPlaceLabel(post.placeId)}`;

  right.appendChild(header);
  right.appendChild(divider);
  right.appendChild(body);
  right.appendChild(actions);
  right.appendChild(footer);

  postBox.appendChild(left);
  postBox.appendChild(right);

  return postBox;
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

  centerPanel.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = "チャット";
  centerPanel.appendChild(heading);

  if (!place) {
    const error = document.createElement("p");
    error.textContent = "場所が見つかりません";
    centerPanel.appendChild(error);
    return;
  }

  const placeIdRow = document.createElement("p");
  placeIdRow.textContent = `場所ID: ${place.placeId}`;
  centerPanel.appendChild(placeIdRow);

  const nameRow = document.createElement("p");
  nameRow.textContent = `場所名: ${place.name}`;
  centerPanel.appendChild(nameRow);

  const kindRow = document.createElement("p");
  kindRow.textContent = `種別: ${getKindLabel(place.kind)}`;
  centerPanel.appendChild(kindRow);

  const layerRow = document.createElement("p");
  layerRow.textContent = `区分: ${getLayerLabel(place.layer)}`;
  centerPanel.appendChild(layerRow);

  const parentRow = document.createElement("p");
  parentRow.textContent = `親ID: ${place.parentId ?? "なし"}`;
  centerPanel.appendChild(parentRow);

  const groupRow = document.createElement("p");
  groupRow.textContent = `グループID: ${place.groupId}`;
  centerPanel.appendChild(groupRow);

  const currentPlaceRow = document.createElement("p");
  currentPlaceRow.textContent =
    `保存中の現在地: ${character?.currentPlaceId ?? "なし"}`;
  centerPanel.appendChild(currentPlaceRow);

    if (place.kind !== "room") {
    const switchHeading = document.createElement("h2");
    switchHeading.textContent = "場所切替";
    centerPanel.appendChild(switchHeading);

    const sameGroupPlaces =
      getPlacesInSameGroup(place)
        .slice()
        .sort((a, b) =>
          getLayerSortValue(a.layer) - getLayerSortValue(b.layer)
        );

    sameGroupPlaces.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";

      const label =
        `${getLayerLabel(item.layer)} : ${item.name}`;

      button.textContent = label;

      if (item.placeId === place.placeId) {
        button.disabled = true;
      } else {
        button.addEventListener("click", () => {
          moveToPlace(item.placeId);
        });
      }

      centerPanel.appendChild(button);
    });
  }

   const postsHeading = document.createElement("h2");
  postsHeading.textContent = "発言一覧";
  centerPanel.appendChild(postsHeading);

  const displayPosts = getDisplayPosts(place);

  if (displayPosts.length === 0) {
    const emptyPosts = document.createElement("p");
    emptyPosts.textContent = "発言はありません";
    centerPanel.appendChild(emptyPosts);
  } else {
    displayPosts.forEach(post => {
      centerPanel.appendChild(
        createPostCard(post, {
          isPreview: post.displayType === "preview"
        })
      );
    });
  }
}

renderChatPlaceInfo();
