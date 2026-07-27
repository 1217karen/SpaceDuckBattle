// notices-data.js

export const NOTICE_CATEGORIES = {
  update: "更新情報",
  bugfix: "不具合修正",
  maintenance: "メンテナンス",
  info: "運営情報"
};

export const NOTICES = [
  {
    id: "notice_20260727_01",
    publishedAt: "2026-07-27",
    category: "update",
    title: "お知らせ画面を追加しました",
    body: "お知らせをまとめて確認できる画面を追加しました。<br><br><b>最新のお知らせは各ページ上部から直接開けます。</b><br>過去のお知らせは、右側の一覧から選択してください。<br><br>[link=./notice.html#notice_20260720_01]次のお知らせを見る[/link]<br><f3>※このお知らせはレイアウト確認用の仮データです。</f3>"
  },
  {
    id: "notice_20260720_01",
    publishedAt: "2026-07-20",
    category: "bugfix",
    title: "戦闘画面の表示に関する不具合を修正しました",
    body: "戦闘画面の一部表示が崩れる問題を修正しました。<br><b>ゲームの進行データへの影響はありません。</b><br><br>[link=./battle.html]アヒルバトル画面を確認する[/link]<br><f3>※このお知らせは表示確認用の仮データです。</f3>"
  },
  {
    id: "notice_20260713_01",
    publishedAt: "2026-07-13",
    category: "maintenance",
    title: "メンテナンス実施予定のお知らせ",
    body: "動作確認のため、短時間のメンテナンスを予定しています。<br><br><b>予定日時：2026年7月30日 12:00～13:00</b><br><f3>※予定時刻は前後する可能性があります。この予定は仮データです。</f3>"
  },
  {
    id: "notice_20260706_01",
    publishedAt: "2026-07-06",
    category: "info",
    title: "SpaceDuckBattleへようこそ",
    body: "SpaceDuckBattleをご利用いただきありがとうございます。<br>更新情報やメンテナンス予定などを、このページでお知らせします。<br><br>[link=./top.html]トップページへ戻る[/link]<br><f3>※このお知らせは表示確認用の仮データです。</f3>"
  },
  {
    id: "notice_20260629_01",
    publishedAt: "2026-06-29",
    category: "update",
    title: "長いタイトルがトップバーや右側のお知らせ一覧でどのように表示されるかを確認するための仮のお知らせです",
    body: "長いタイトルの省略表示を確認するための記事です。<br><f3>※このお知らせは表示確認用の仮データです。</f3>"
  }
];
