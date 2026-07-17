diff --git a/js/services/character-favorite-service.js b/js/services/character-favorite-service.js
index 7311fb60012b9f3d0ec621fbd5c2001222ada97a..8487b17db797053137d6ef038cabd197954f038b 100644
--- a/js/services/character-favorite-service.js
+++ b/js/services/character-favorite-service.js
@@ -1,29 +1,30 @@
 // character-favorite-service.js
 
 import { getNoImageUrl } from "../common/icon-picker.js";
 import { loadCharacter } from "./storage-service.js";
+import { makeAccountStorageKey } from "./account-storage-key.js";
 
 const CHARACTER_FAVORITES_STORAGE_KEY = "chatCharacterFavorites";
 const CHARACTER_FAVORITE_MEMOS_STORAGE_KEY = "chatCharacterFavoriteMemos";
 const CHARACTER_FAVORITE_MEMO_MAX_LENGTH = 40;
 
 function safeParse(json, fallback = null) {
   if (!json) return fallback;
 
   try {
     return JSON.parse(json);
   } catch {
     return fallback;
   }
 }
 
 function normalizeEno(eno) {
   const normalized =
     typeof eno === "number"
       ? eno
       : Number(eno || 0);
 
   return Number.isInteger(normalized) && normalized > 0
     ? normalized
     : 0;
 }
@@ -66,115 +67,139 @@ function getCharacterName(character = {}, eno = 0) {
     return fullName;
   }
 
   if (defaultName) {
     return defaultName;
   }
 
   return eno ? `Eno.${eno}` : "不明なキャラ";
 }
 
 function getCharacterDefaultIcon(character = {}) {
   return typeof character?.defaultIcon === "string" && character.defaultIcon.trim() !== ""
     ? character.defaultIcon.trim()
     : getNoImageUrl();
 }
 
 function normalizeFavoriteCharacterMemo(memo) {
   return String(memo ?? "").trim().slice(0, CHARACTER_FAVORITE_MEMO_MAX_LENGTH);
 }
 
 export function getFavoriteCharacterMemoMaxLength() {
   return CHARACTER_FAVORITE_MEMO_MAX_LENGTH;
 }
 
 export function loadFavoriteCharacterMemos() {
+  const storageKey = makeAccountStorageKey(CHARACTER_FAVORITE_MEMOS_STORAGE_KEY);
+
+  if (!storageKey) {
+    return {};
+  }
+
   const parsed = safeParse(
-    localStorage.getItem(CHARACTER_FAVORITE_MEMOS_STORAGE_KEY),
+    localStorage.getItem(storageKey),
     {}
   );
 
   if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
     return {};
   }
 
   return Object.fromEntries(
     Object.entries(parsed)
       .map(([eno, memo]) => [String(normalizeEno(eno)), normalizeFavoriteCharacterMemo(memo)])
       .filter(([eno]) => eno !== "0")
   );
 }
 
 export function saveFavoriteCharacterMemo(eno, memo) {
   const targetEno = normalizeEno(eno);
+  const storageKey = makeAccountStorageKey(CHARACTER_FAVORITE_MEMOS_STORAGE_KEY);
 
-  if (!targetEno) {
+  if (!targetEno || !storageKey) {
     return "";
   }
 
   const memos = loadFavoriteCharacterMemos();
   const normalizedMemo = normalizeFavoriteCharacterMemo(memo);
   const key = String(targetEno);
 
   if (normalizedMemo) {
     memos[key] = normalizedMemo;
   } else {
     delete memos[key];
   }
 
   localStorage.setItem(
-    CHARACTER_FAVORITE_MEMOS_STORAGE_KEY,
+    storageKey,
     JSON.stringify(memos)
   );
 
   return normalizedMemo;
 }
 
 export function getFavoriteCharacterMemo(eno) {
   const targetEno = normalizeEno(eno);
 
   if (!targetEno) {
     return "";
   }
 
   return loadFavoriteCharacterMemos()[String(targetEno)] || "";
 }
 
 export function loadFavoriteCharacterEnos(options = {}) {
+  const storageKey = makeAccountStorageKey(
+    CHARACTER_FAVORITES_STORAGE_KEY,
+    options.currentEno
+  );
+
+  if (!storageKey) {
+    return [];
+  }
+
   const parsed = safeParse(
-    localStorage.getItem(CHARACTER_FAVORITES_STORAGE_KEY),
+    localStorage.getItem(storageKey),
     []
   );
 
   return normalizeFavoriteCharacterEnos(parsed, options);
 }
 
 export function saveFavoriteCharacterEnos(enos = [], options = {}) {
   const normalized = normalizeFavoriteCharacterEnos(enos, options);
+  const storageKey = makeAccountStorageKey(
+    CHARACTER_FAVORITES_STORAGE_KEY,
+    options.currentEno
+  );
+
+  if (!storageKey) {
+    return [];
+  }
 
   localStorage.setItem(
-    CHARACTER_FAVORITES_STORAGE_KEY,
+    storageKey,
     JSON.stringify(normalized)
   );
 
   return normalized;
 }
 
 export function isFavoriteCharacter(eno, options = {}) {
   const targetEno = normalizeEno(eno);
   const currentEno = normalizeEno(options.currentEno);
 
   if (!targetEno || targetEno === currentEno) {
     return false;
   }
 
   return loadFavoriteCharacterEnos(options).includes(targetEno);
 }
 
 export function toggleFavoriteCharacter(eno, options = {}) {
   const targetEno = normalizeEno(eno);
   const currentEno = normalizeEno(options.currentEno);
   const favoriteCharacterEnos = loadFavoriteCharacterEnos(options);
 
   if (!targetEno || targetEno === currentEno) {
     return {
       isFavorite: false,
