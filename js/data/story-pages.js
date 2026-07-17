// story-pages.js

export const STORY_PAGES = {
  boss_01_intro: {
    id: "boss_01_intro",
    title: "ボス1 戦闘前",
    mode: "click",
    accessCondition: {
      type: "stageUnlocked",
      stageId: "boss_01"
    },
    nextLabel: "戦闘ページへ",
    nextUrl: "battle.html",
    lines: [
      {
        speakerName: "SYSTEM",
        text: "見ろ！"
      },
      {
        speakerName: "SYSTEM",
        text: "あそこに強敵がいるぞ。"
      },
      {
        speakerName: "SYSTEM",
        text: "くれぐれも無理はするなよ。"
      }
    ]
  },
  boss_02_intro: {
    id: "boss_02_intro",
    title: "ボス2 戦闘前",
    mode: "click",
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
