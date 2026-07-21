// story-list-controller.js

import { renderGuideDialogue } from "../common/guide-dialogue-view.js";
import { getArchivedStoryPages } from "../data/story-pages.js";
import { canAccessStory } from "../services/story-access-service.js";
import { requireLogin } from "../services/storage-service.js";
import { markStoryRead } from "../services/story-progress-service.js";

const account = requireLogin();
const list = document.getElementById("storyArchiveList");
const title = document.getElementById("storyArchiveTitle");
const status = document.getElementById("storyArchiveStatus");
const dialogue = document.getElementById("storyArchiveDialogue");
const restartButton = document.getElementById("storyArchiveRestart");

let selectedStory = null;
const storyButtons = new Map();

const accessibleStories = account?.eno
  ? getArchivedStoryPages().filter(story => canAccessStory(story, account.eno))
  : [];

function setStatus(message) {
  if (status) {
    status.textContent = message || "";
  }
}

function finishArchiveStory(story) {
  if (!account?.eno || !story?.id) return;

  markStoryRead(account.eno, story.id);
  setStatus("");

  if (restartButton) {
    restartButton.hidden = false;
  }
}

function renderSelectedStory(story) {
  if (!story || !dialogue) return;

  selectedStory = story;
  storyButtons.forEach((button, storyId) => {
    button.classList.toggle("is-active", storyId === story.id);
  });

  if (title) {
    title.textContent = story.title || story.id;
  }

  setStatus("");

  if (restartButton) {
    restartButton.hidden = true;
  }

  if (story.mode === "all") {
    markStoryRead(account.eno, story.id);
  }

  renderGuideDialogue(dialogue, {
    mode: story.mode,
    lines: story.lines,
    clickHint: "クリックで次のセリフを表示",
    completeHint: "クリックで読了",
    onComplete: story.mode === "click"
      ? () => finishArchiveStory(story)
      : undefined
  });

  const url = new URL(window.location.href);
  url.searchParams.set("id", story.id);
  window.history.replaceState(null, "", url);
}

function createStoryButton(story) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-box storyArchiveItem";
  button.textContent = story.title || story.id;

  button.addEventListener("click", () => renderSelectedStory(story));
  storyButtons.set(story.id, button);

  return button;
}

function renderStoryList() {
  if (!list) return;

  list.innerHTML = "";

  if (accessibleStories.length === 0) {
    const empty = document.createElement("p");
    empty.className = "storyArchiveEmpty text-muted";
    empty.textContent = "現在閲覧できるストーリーはありません。";
    list.appendChild(empty);
    return;
  }

  const categories = new Map();
  accessibleStories.forEach(story => {
    const category = story.archive?.category || "other";
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(story);
  });

  categories.forEach(stories => {
    const group = document.createElement("details");
    group.className = "storyArchiveCategory common-card-subtle";

    const summary = document.createElement("summary");
    summary.className = "storyArchiveCategoryTitle";
    summary.textContent = stories[0]?.archive?.categoryLabel || "STORY";

    const items = document.createElement("div");
    items.className = "storyArchiveCategoryItems";
    stories.forEach(story => items.appendChild(createStoryButton(story)));

    group.appendChild(summary);
    group.appendChild(items);
    list.appendChild(group);
  });
}

restartButton?.addEventListener("click", () => {
  if (selectedStory) {
    renderSelectedStory(selectedStory);
  }
});

renderStoryList();

const requestedStoryId = new URLSearchParams(window.location.search).get("id") || "";
const initialStory = accessibleStories.find(story => story.id === requestedStoryId);

if (initialStory) {
  renderSelectedStory(initialStory);
} else if (accessibleStories.length > 0 && dialogue) {
  setStatus("右メニューから閲覧したいストーリーを選んでください。");
  dialogue.textContent = "";
  restartButton.hidden = true;
} else if (dialogue) {
  dialogue.textContent = "表示できるストーリーがありません。";
  restartButton.hidden = true;
}
