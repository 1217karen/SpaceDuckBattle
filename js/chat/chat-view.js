//chat-view.js

import { renderRichText } from "../common/rich-text.js";

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

export function createPostCard(post, options = {}) {
  const {
    isPreview = false,
    getPlaceLabel
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

export function renderPostListSection(container, options = {}) {
  const {
    posts = [],
    getPlaceLabel
  } = options;

  const postsHeading = document.createElement("h2");
  postsHeading.textContent = "発言一覧";
  container.appendChild(postsHeading);

  if (posts.length === 0) {
    const emptyPosts = document.createElement("p");
    emptyPosts.textContent = "発言はありません";
    container.appendChild(emptyPosts);
    return;
  }

  posts.forEach(post => {
    container.appendChild(
      createPostCard(post, {
        isPreview: post.displayType === "preview",
        getPlaceLabel
      })
    );
  });
}
export function renderPlaceSwitchSection(container, options = {}) {
  const {
    currentPlace,
    sameGroupPlaces = [],
    getLayerLabel,
    onMoveToPlace
  } = options;

  if (!currentPlace) {
    return;
  }

  if (currentPlace.kind === "room") {
    return;
  }

  const switchHeading = document.createElement("h2");
  switchHeading.textContent = "場所切替";
  container.appendChild(switchHeading);

  sameGroupPlaces.forEach(place => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${getLayerLabel(place.layer)} : ${place.name}`;

    if (place.placeId === currentPlace.placeId) {
      button.disabled = true;
    } else {
      button.addEventListener("click", () => {
        onMoveToPlace(place.placeId);
      });
    }

    container.appendChild(button);
  });
}

export function renderPlaceInfoSection(container, options = {}) {
  const {
    place,
    places = [],
    onMoveToPlace
  } = options;

  const section = document.createElement("section");
  section.className = "chatHeader";

  const inner = document.createElement("div");
  inner.className = "chatHeaderInner";

const topRow = document.createElement("div");
topRow.className = "chatHeaderTopRow";

const titleGroup = document.createElement("div");
titleGroup.className = "chatHeaderTitleGroup";

const title = document.createElement("h1");
title.className = "chatHeaderTitle";
title.textContent = place?.name ?? "場所が見つかりません";

titleGroup.appendChild(title);
topRow.appendChild(titleGroup);

if (!place) {
  inner.appendChild(topRow);
  section.appendChild(inner);
  container.appendChild(section);
  return;
}

const aroundToggle = document.createElement("button");
aroundToggle.type = "button";
aroundToggle.className = "chatHeaderLinkButton chatHeaderAroundToggle";
aroundToggle.textContent = "▼周辺を表示";

titleGroup.appendChild(aroundToggle);

const aroundPanel = document.createElement("div");
aroundPanel.className = "chatAroundPanel";
aroundPanel.hidden = true;

const divider = document.createElement("div");
divider.className = "chatHeaderDivider";

renderAroundTree(aroundPanel, {
  place,
  places,
  onMoveToPlace
});

  const body = document.createElement("div");
  body.className = "chatHeaderBody";

  const shortDescription = document.createElement("p");
  shortDescription.className = "chatHeaderShortDescription";
  shortDescription.textContent =
    place.shortDescription ?? "説明文は未設定です。";

  const detailToggle = document.createElement("button");
  detailToggle.type = "button";
  detailToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle";
  detailToggle.textContent = "▼詳細を表示";

  const detailContent = document.createElement("div");
  detailContent.className = "chatHeaderDetailContent";
  detailContent.hidden = true;

  const longDescription =
    String(place.longDescription ?? "").trim();

  if (longDescription) {
    longDescription
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .forEach(line => {
        const paragraph = document.createElement("p");
        paragraph.className = "chatHeaderLongDescription";
        paragraph.textContent = line;
        detailContent.appendChild(paragraph);
      });
  } else {
    const emptyDetail = document.createElement("p");
    emptyDetail.className = "chatHeaderLongDescription";
    emptyDetail.textContent = "詳細説明は未設定です。";
    detailContent.appendChild(emptyDetail);
  }

  aroundToggle.addEventListener("click", () => {
    const isOpen = !aroundPanel.hidden;
    aroundPanel.hidden = isOpen;
    aroundToggle.textContent = isOpen
      ? "▼周辺を表示"
      : "▲周辺を閉じる";
  });

  detailToggle.addEventListener("click", () => {
    const isOpen = !detailContent.hidden;
    detailContent.hidden = isOpen;
    detailToggle.textContent = isOpen
      ? "▼詳細を表示"
      : "▲詳細を閉じる";
  });

  body.appendChild(shortDescription);
  body.appendChild(detailToggle);
  body.appendChild(detailContent);

inner.appendChild(topRow);
inner.appendChild(aroundPanel);
inner.appendChild(divider);
inner.appendChild(body);

  section.appendChild(inner);
  container.appendChild(section);
}

export function renderChatTabsSection(container, options = {}) {
  const {
    placeTabs = [],
    viewTabs = []
  } = options;

  const section = document.createElement("section");
  section.className = "chatTabsSection";

  const inner = document.createElement("div");
  inner.className = "chatTabsInner";

  const placeTabRow = document.createElement("div");
  placeTabRow.className = "chatTabRow";

  placeTabs.forEach(tab => {
    placeTabRow.appendChild(createChatTabButton(tab));
  });

  const viewTabRow = document.createElement("div");
  viewTabRow.className = "chatTabRow";

  viewTabs.forEach(tab => {
    viewTabRow.appendChild(createChatTabButton(tab));
  });

  inner.appendChild(placeTabRow);
  inner.appendChild(viewTabRow);

  section.appendChild(inner);
  container.appendChild(section);
}

function createChatTabButton(tab = {}) {
  const button = document.createElement("button");
  button.type = "button";

  const classNames = ["chatTabButton"];

  if (tab.isActive) {
    classNames.push("chatTabButtonActive");
  }

  if (tab.isDisabled) {
    classNames.push("chatTabButtonDisabled");
    button.disabled = true;
  }

  button.className = classNames.join(" ");
  button.textContent = tab.label ?? "";

  if (!tab.isDisabled && typeof tab.onClick === "function") {
    button.addEventListener("click", tab.onClick);
  }

  return button;
}

function renderAroundTree(container, options = {}) {
  const {
    place,
    places = [],
    onMoveToPlace
  } = options;

  container.innerHTML = "";

  const lines = buildAroundTreeLines(place, places);

  lines.forEach(line => {
    const row = document.createElement("div");
    row.className = "chatAroundRow";

    if (line.depth > 0) {
      row.style.paddingLeft = `${line.depth * 1.5}em`;
    }

    const prefix = document.createElement("span");
    prefix.className = "chatAroundPrefix";
    prefix.textContent = line.prefix ?? "";

    row.appendChild(prefix);

    if (line.isCurrentPlace || !line.placeId) {
      const text = document.createElement("span");
      text.className = "chatAroundCurrent";
      text.textContent = line.label;
      row.appendChild(text);
    } else {
      const linkButton = document.createElement("button");
      linkButton.type = "button";
      linkButton.className = "chatAroundLinkButton";
      linkButton.textContent = line.label;
      linkButton.addEventListener("click", () => {
        onMoveToPlace(line.placeId);
      });
      row.appendChild(linkButton);
    }

    container.appendChild(row);
  });
}

function buildAroundTreeLines(place, places) {
  if (!place) {
    return [];
  }

  if (place.kind === "field") {
    const childMainAreas = places.filter(item =>
      item.kind === "area" &&
      item.layer === "main" &&
      item.parentId === place.placeId
    );

    return [
      {
        depth: 0,
        prefix: "",
        label: `${place.name}（現在地）`,
        placeId: place.placeId,
        isCurrentPlace: true
      },
      ...childMainAreas.map((child, index) => ({
        depth: 1,
        prefix: getTreeBranch(index, childMainAreas.length),
        label: child.name,
        placeId: child.placeId,
        isCurrentPlace: false
      }))
    ];
  }

  if (place.kind === "area") {
    const parentMainField = places.find(item =>
      item.kind === "field" &&
      item.layer === "main" &&
      item.placeId === place.parentId
    );

    const childRooms = places.filter(item =>
      item.kind === "room" &&
      item.parentId === place.placeId
    );

    const lines = [];

    if (parentMainField) {
      lines.push({
        depth: 0,
        prefix: "",
        label: parentMainField.name,
        placeId: parentMainField.placeId,
        isCurrentPlace: false
      });
    }

    lines.push({
      depth: 1,
      prefix: "└",
      label: `${place.name}（現在地）`,
      placeId: place.placeId,
      isCurrentPlace: true
    });

    childRooms.forEach((child, index) => {
      lines.push({
        depth: 2,
        prefix: getTreeBranch(index, childRooms.length),
        label: child.name,
        placeId: child.placeId,
        isCurrentPlace: false
      });
    });

    return lines;
  }

if (place.kind === "room") {
  const parentMainArea = places.find(item =>
    item.kind === "area" &&
    item.layer === "main" &&
    item.placeId === place.parentId
  );

  const parentMainField = parentMainArea
    ? places.find(item =>
        item.kind === "field" &&
        item.layer === "main" &&
        item.placeId === parentMainArea.parentId
      )
    : null;

  const lines = [];

  if (parentMainField) {
    lines.push({
      depth: 0,
      prefix: "",
      label: parentMainField.name,
      placeId: parentMainField.placeId,
      isCurrentPlace: false
    });
  }

  if (parentMainArea) {
    lines.push({
      depth: 1,
      prefix: "└",
      label: parentMainArea.name,
      placeId: parentMainArea.placeId,
      isCurrentPlace: false
    });
  }

  lines.push({
    depth: 2,
    prefix: "└",
    label: `${place.name}（現在地）`,
    placeId: place.placeId,
    isCurrentPlace: true
  });

  return lines;
}

  return [];
}

function getTreeBranch(index, length) {
  if (index === length - 1) {
    return "└";
  }

  return "├";
}
