// story-pages.js

export const STORY_PAGES = {
  story_test: {
    id: "story_test",
    title: "ストーリー表示テスト",
    mode: "click",
    archive: {
      visible: false
    },
    accessCondition: {
      type: "always"
    },
    nextLabel: "TOPへ",
    nextUrl: "top.html",
    lines: [
      {
        speakerName: "テスト",
        text: "テスト"
      },
      {
        speakerName: "テスト",
        text: "テスト2"
      }
    ]
  },
  first_setup_guide: {
    id: "first_setup_guide",
    title: "はじめに",
    mode: "all",
    archive: {
      visible: true,
      category: "guide",
      categoryLabel: "GUIDE",
      order: 1
    },
    accessCondition: {
      type: "always"
    },
    nextLabel: "TOPへ",
    nextUrl: "top.html",
    lines: [
      {
        speakerName: "SYSTEM",
        text: "ようこそ！"
      },
      {
        speakerName: "SYSTEM",
        text: "あなたの名前と、最初のユニット名を教えてください。"
      },
      {
        speakerName: "SYSTEM",
        text: "登録後も、プロフィールや設定画面から内容を調整できます。"
      }
    ]
  },
  boss_01_intro: {
    id: "boss_01_intro",
    title: "ボス1 戦闘前",
    mode: "click",
    archive: {
      visible: true,
      category: "boss",
      categoryLabel: "BOSS STORY",
      order: 101
    },
    accessCondition: {
      type: "stageUnlocked",
      stageId: "boss_01"
    },
    nextLabel: "戦闘ページへ",
    nextUrl: "battle.html",
    lines: [
      {
        speakerName: "テスト",
        text: "ボス1だ！"
      },
      {
        speakerName: "テスト",
        text: "強敵だけど、準備ができたら挑戦してみよう。"
      }
    ]
  },
  boss_01_clear: {
    id: "boss_01_clear",
    title: "ボス1 戦闘後",
    mode: "all",
    archive: {
      visible: true,
      category: "boss",
      categoryLabel: "BOSS STORY",
      order: 102
    },
    accessCondition: {
      type: "stageCleared",
      stageId: "boss_01"
    },
    nextLabel: "戦闘ログへ",
    nextUrl: "battle-history.html",
    lines: [
      {
        speakerName: "SYSTEM",
        text: "クリアおめでとうございます。"
      },
      {
        speakerName: "SYSTEM",
        text: "でもまだまだゲームは続きますよ！"
      }
    ]
  },
  boss_02_intro: {
    id: "boss_02_intro",
    title: "ボス2 戦闘前",
    mode: "click",
    archive: {
      visible: true,
      category: "boss",
      categoryLabel: "BOSS STORY",
      order: 201
    },
    accessCondition: {
      type: "stageUnlocked",
      stageId: "boss_02"
    },
    nextLabel: "戦闘ページへ",
    nextUrl: "battle.html",
    lines: [
      {
        speakerName: "SYSTEM",
        text: "次の大型目標を確認しました。"
      },
      {
        speakerName: "SYSTEM",
        text: "前よりも手強い相手です。準備を整えてください。"
      }
    ]
  },
  first_clear_sample: {
    id: "first_clear_sample",
    title: "ステージクリア",
    mode: "all",
    accessCondition: {
      type: "always"
    },
    nextLabel: "TOPへ",
    nextUrl: "top.html",
    lines: [
      {
        speakerName: "SYSTEM",
        text: "クリアおめでとうございます。"
      },
      {
        speakerName: "SYSTEM",
        text: "でもまだまだゲームは続きますよ！"
      }
    ]
  }
};

export function getStoryPage(storyId) {
  return STORY_PAGES[storyId] || null;
}

export function getArchivedStoryPages() {
  return Object.values(STORY_PAGES)
    .filter(story => story.archive?.visible)
    .sort((a, b) => (a.archive?.order ?? 0) - (b.archive?.order ?? 0));
}
