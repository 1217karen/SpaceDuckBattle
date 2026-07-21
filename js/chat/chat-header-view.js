//chat-header-view.js


export function renderPlaceInfoSection(container, options = {}) {
  const {
    place,
    aroundBasePlace,
    places = [],
    onMoveToPlace,
    isFavorite = false,
    onToggleFavorite = null
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

  let favoriteButton = null;

  titleGroup.appendChild(title);
  topRow.appendChild(titleGroup);

  if (place && typeof onToggleFavorite === "function") {
    favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "chatHeaderFavoriteButton button-icon";
    favoriteButton.textContent = isFavorite ? "★" : "☆";
    favoriteButton.title = isFavorite ? "お気に入り解除" : "お気に入り登録";
    favoriteButton.setAttribute(
      "aria-label",
      isFavorite ? "お気に入り解除" : "お気に入り登録"
    );

    favoriteButton.addEventListener("click", () => {
      onToggleFavorite(place);
    });

    topRow.appendChild(favoriteButton);
  }

  if (!place) {
    inner.appendChild(topRow);
    section.appendChild(inner);
    container.appendChild(section);
    return {
      section,
      favoriteButton
    };
  }

  const aroundToggle = document.createElement("button");
  aroundToggle.type = "button";
  aroundToggle.className = "chatHeaderLinkButton chatHeaderAroundToggle button-plain";
  aroundToggle.textContent = "▶周辺を表示";

  titleGroup.appendChild(aroundToggle);

  const aroundPanel = document.createElement("div");
  aroundPanel.className = "chatAroundPanel";
  aroundPanel.hidden = true;

  const divider = document.createElement("div");
  divider.className = "chatHeaderDivider";

  renderAroundTree(aroundPanel, {
    place: aroundBasePlace ?? place,
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
  detailToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle button-plain";
  detailToggle.textContent = "▶詳細を表示";

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
      ? "▶周辺を表示"
      : "▼周辺を閉じる";
  });

  detailToggle.addEventListener("click", () => {
    const isOpen = !detailContent.hidden;
    detailContent.hidden = isOpen;
    detailToggle.textContent = isOpen
      ? "▶詳細を表示"
      : "▼詳細を閉じる";
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

  return {
    section,
    favoriteButton
  };
}

export function renderThreadHeaderSection(container, options = {}) {
  const {
    memoText = "",
    isMemoOpen = false,
    onCloseThread = null,
    showPrivateMemo = true,
    placeTrailLabels = []
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
title.textContent = "返信ツリー";

titleGroup.appendChild(title);

let closeThreadButton = null;

if (typeof onCloseThread === "function") {
  closeThreadButton = document.createElement("button");
  closeThreadButton.type = "button";
  closeThreadButton.className = "chatHeaderLinkButton chatThreadCloseButton button-link";
  closeThreadButton.textContent = "×チャット画面に戻る";

  closeThreadButton.addEventListener("click", () => {
    onCloseThread();
  });

  titleGroup.appendChild(closeThreadButton);
}

topRow.appendChild(titleGroup);

  const divider = document.createElement("div");
  divider.className = "chatHeaderDivider";

  const body = document.createElement("div");
  body.className = "chatHeaderBody";

  const normalizedPlaceTrailLabels = Array.isArray(placeTrailLabels)
    ? placeTrailLabels
        .map(label => String(label ?? "").trim())
        .filter(label => label !== "")
    : [];

  if (normalizedPlaceTrailLabels.length > 0) {
    const placeTrail = document.createElement("div");
    placeTrail.className = "chatThreadPlaceTrail";
    placeTrail.textContent = normalizedPlaceTrailLabels.join(" ＞ ");
    body.appendChild(placeTrail);
  }

  const memoToggle = document.createElement("button");
  memoToggle.type = "button";
  memoToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle chatThreadPrivateNoteToggle button-plain";
  memoToggle.textContent = isMemoOpen
    ? "▶非公開メモを閉じる"
    : "▼非公開メモを表示";

  const memoContent = document.createElement("div");
  memoContent.className = "chatHeaderDetailContent";
  memoContent.hidden = !isMemoOpen;

  const memoTextarea = document.createElement("textarea");
  memoTextarea.className = "chatThreadPrivateNoteTextarea";
  memoTextarea.rows = 6;
  memoTextarea.placeholder = "この返信ツリー用の非公開メモ";
  memoTextarea.value =
    typeof memoText === "string"
      ? memoText
      : "";

  const memoSaveButton = document.createElement("button");
  memoSaveButton.type = "button";
  memoSaveButton.className = "chatThreadPrivateNoteSaveButton button-box";
  memoSaveButton.textContent = "保存";

  memoToggle.addEventListener("click", () => {
    const isOpen = !memoContent.hidden;
    memoContent.hidden = isOpen;
    memoToggle.textContent = isOpen
      ? "▶非公開メモを表示"
      : "▼非公開メモを閉じる";
  });

  memoContent.appendChild(memoTextarea);
  memoContent.appendChild(memoSaveButton);

  if (showPrivateMemo) {
    body.appendChild(memoToggle);
    body.appendChild(memoContent);
  }

  inner.appendChild(topRow);
  inner.appendChild(divider);
  inner.appendChild(body);

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section,
    closeThreadButton,
    memoToggle,
    memoContent,
    memoTextarea,
    memoSaveButton
  };
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
      linkButton.className = "chatAroundLinkButton button-plain";
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

    const siblingAreas = parentMainField
      ? places.filter(item =>
          item.kind === "area" &&
          item.layer === "main" &&
          item.parentId === parentMainField.placeId
        )
      : [];

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

    siblingAreas.forEach((sibling, index) => {
      const isCurrentArea = sibling.placeId === place.placeId;

      lines.push({
        depth: 1,
        prefix: getTreeBranch(index, siblingAreas.length),
        label: isCurrentArea
          ? `${sibling.name}（現在地）`
          : sibling.name,
        placeId: sibling.placeId,
        isCurrentPlace: isCurrentArea
      });

      if (!isCurrentArea) {
        return;
      }

      childRooms.forEach((child, childIndex) => {
        lines.push({
          depth: 2,
          prefix: getTreeBranch(childIndex, childRooms.length),
          label: child.name,
          placeId: child.placeId,
          isCurrentPlace: false
        });
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

    const siblingRooms = parentMainArea
      ? places.filter(item =>
          item.kind === "room" &&
          item.parentId === parentMainArea.placeId
        )
      : [];

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

    siblingRooms.forEach((sibling, index) => {
      const isCurrentRoom = sibling.placeId === place.placeId;

      lines.push({
        depth: 2,
        prefix: getTreeBranch(index, siblingRooms.length),
        label: isCurrentRoom
          ? `${sibling.name}（現在地）`
          : sibling.name,
        placeId: sibling.placeId,
        isCurrentPlace: isCurrentRoom
      });
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
