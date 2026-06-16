// chat-display-rules.js

import { canViewPost } from "./chat-post-filter.js";

export function getDisplayPosts({
  currentPlace,
  allPosts,
  places,
  viewerEno = null
}) {
  if (!currentPlace) {
    return [];
  }

  const normalPosts =
    getPostsByPlaceId(allPosts, currentPlace.placeId, viewerEno)
      .map(post => ({
        ...post,
        displayType: "normal"
      }));

  const sideFieldPreviewPosts =
    getSideFieldPreviewPosts(currentPlace, allPosts, places, viewerEno)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const mainFieldPreviewPosts =
    getMainFieldPreviewPosts(currentPlace, allPosts, places, viewerEno)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const mainAreaPreviewPosts =
    getMainAreaPreviewPosts(currentPlace, allPosts, places, viewerEno)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const sideAreaPreviewPosts =
    getSideAreaPreviewPosts(currentPlace, allPosts, places, viewerEno)
      .map(post => ({
        ...post,
        displayType: "preview"
      }));

  const roomPreviewPosts =
    getRoomPreviewPosts(currentPlace, allPosts, places, viewerEno)
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

function getPostsByPlaceId(allPosts = [], placeId, viewerEno = null) {
  return allPosts.filter(post =>
    post.placeId === placeId &&
    !post.isDeleted &&
    canViewPost(post, viewerEno)
  );
}

function getMainFieldPreviewPosts(currentPlace, allPosts = [], places = [], viewerEno = null) {
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
    previewPosts.push(...getPostsByPlaceId(allPosts, areaPlace.placeId, viewerEno));
  });

  return previewPosts;
}

function getSideFieldPreviewPosts(currentPlace, allPosts = [], places = [], viewerEno = null) {
  if (!currentPlace) return [];
  if (currentPlace.kind !== "field") return [];
  if (currentPlace.layer !== "side") return [];

  const mainField = places.find(place =>
    place.kind === "field" &&
    place.groupId === currentPlace.groupId &&
    place.layer === "main"
  );

  if (!mainField) {
    return [];
  }

  return getPostsByPlaceId(allPosts, mainField.placeId, viewerEno);
}

function getMainAreaPreviewPosts(currentPlace, allPosts = [], places = [], viewerEno = null) {
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
    previewPosts.push(...getPostsByPlaceId(allPosts, parentMainField.placeId, viewerEno));
  }

  return previewPosts;
}

function getSideAreaPreviewPosts(currentPlace, allPosts = [], places = [], viewerEno = null) {
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

  return getPostsByPlaceId(allPosts, mainArea.placeId, viewerEno);
}

function getRoomPreviewPosts(currentPlace, allPosts = [], places = [], viewerEno = null) {
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

  return getPostsByPlaceId(allPosts, parentMainArea.placeId, viewerEno);
}
