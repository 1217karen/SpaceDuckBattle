// story-controller.js

import { renderGuideDialogue } from "../common/guide-dialogue-view.js";
import { getStoryPage } from "../data/story-pages.js";
import { loadCharacter, requireLogin } from "../services/storage-service.js";
import { canAccessStory } from "../services/story-access-service.js";
import { isStoryRead, loadStoryProgress, markStoryRead } from "../services/story-progress-service.js";

const account = requireLogin();

const title = document.getElementById("storyTitle");
const status = document.getElementById("storyStatus");
const dialogue = document.getElementById("storyDialogue");
const nextButton = document.getElementById("storyNextButton");
const backButton = document.getElementById("storyBackButton");

const params = new URLSearchParams(window.location.search);
const storyId = params.get("id") || "";
const nextOverride = params.get("next") || "";
const forceDisplay = params.get("force") === "1";
const story = getStoryPage(storyId);

backButton?.addEventListener("click", () => {
  window.location.href = "top.html";
});

function getNextUrl() {
  return nextOverride || story?.nextUrl || "top.html";
}

function setStatus(message) {
  if (status) {
    status.textContent = message || "";
  }
}

function showError(message) {
  setStatus(message);
  if (dialogue) {
    dialogue.innerHTML = "";
  }
  if (nextButton) {
    nextButton.textContent = "TOPへ戻る";
    nextButton.hidden = false;
    nextButton.addEventListener("click", () => {
      window.location.href = "top.html";
    }, { once: true });
  }
}

function finishStory() {
  if (!account?.eno || !story?.id) return;

  markStoryRead(account.eno, story.id);
  window.location.href = getNextUrl();
}

function shouldSkipReadStory() {
  if (forceDisplay || !account?.eno || !story?.id) return false;

  const character = loadCharacter(account.eno) || {};
  const storyProgress = loadStoryProgress(account.eno);

  return Boolean(character.storySettings?.skipReadStories) &&
    isStoryRead(storyProgress, story.id);
}

if (!account?.eno) {
  showError("ログイン情報を確認できません。");
} else if (!story) {
  showError("指定されたストーリーが見つかりません。");
} else if (!canAccessStory(story, account.eno)) {
  if (title) {
    title.textContent = story.title || story.id;
  }
  showError("このストーリーはまだ解放されていません。");
} else if (shouldSkipReadStory()) {
  window.location.href = getNextUrl();
} else {
  if (title) {
    title.textContent = story.title || story.id;
  }

  setStatus(story.mode === "click"
    ? "クリックで会話を進めます。"
    : "ストーリーを確認してください。"
  );

  if (nextButton) {
    nextButton.textContent = story.nextLabel || "次へ";
    nextButton.hidden = story.mode === "click";
    nextButton.addEventListener("click", finishStory);
  }

  renderGuideDialogue(dialogue, {
    mode: story.mode,
    lines: story.lines,
    clickHint: "クリックで次のセリフを表示",
    completeHint: "クリックで次へ進む",
    onComplete: story.mode === "click" ? finishStory : undefined
  });
}
