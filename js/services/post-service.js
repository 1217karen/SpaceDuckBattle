//post-service.js
  
import { posts as seedPosts } from "../data/posts-data.js";

function clonePost(post) {
  return {
    ...post
  };
}

export function getAllPosts() {
  return seedPosts.map(clonePost);
}

export function getPostsByPlaceId(placeId) {
  return getAllPosts().filter(post => post.placeId === placeId);
}
