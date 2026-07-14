//rich-text-toolbar-ui.js

export function createRichTextToolbarButtons(options = {}) {
  const {
    includeLineBreak = false
  } = options;

  const fragment = document.createDocumentFragment();

  const buttonDefs = [
    {
      textContent: "B",
      label: "太字",
      className: "richTextToolButtonIconLike richTextToolButtonBold",
      insertOpenTag: "<b>",
      insertCloseTag: "</b>"
    },
    {
      textContent: "I",
      label: "斜体",
      className: "richTextToolButtonIconLike richTextToolButtonItalic",
      insertOpenTag: "<i>",
      insertCloseTag: "</i>"
    },
    {
      textContent: "U",
      label: "下線",
      className: "richTextToolButtonIconLike richTextToolButtonUnderline",
      insertOpenTag: "<u>",
      insertCloseTag: "</u>"
    },
    {
      textContent: "S",
      label: "打消",
      className: "richTextToolButtonIconLike richTextToolButtonStrike",
      insertOpenTag: "<s>",
      insertCloseTag: "</s>"
    },
    {
      textContent: "rb",
      label: "ルビ",
      className: "richTextToolButtonIconLike richTextToolButtonRuby",
      rubyTemplate: "true"
    },
    {
      textContent: "F1",
      label: "文字サイズ 最小",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f1>",
      insertCloseTag: "</f1>"
    },
    {
      textContent: "F2",
      label: "文字サイズ 小",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f2>",
      insertCloseTag: "</f2>"
    },
    {
      textContent: "F3",
      label: "文字サイズ やや小",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f3>",
      insertCloseTag: "</f3>"
    },
    {
      textContent: "F4",
      label: "文字サイズ 通常",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f4>",
      insertCloseTag: "</f4>"
    },
    {
      textContent: "F5",
      label: "文字サイズ やや大",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f5>",
      insertCloseTag: "</f5>"
    },
    {
      textContent: "F6",
      label: "文字サイズ 大",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f6>",
      insertCloseTag: "</f6>"
    },
    {
      textContent: "F7",
      label: "文字サイズ 最大",
      className: "richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f7>",
      insertCloseTag: "</f7>"
    }
  ];

  if (includeLineBreak) {
    buttonDefs.push({
      textContent: "改行",
      label: "改行",
      className: "richTextToolButtonIconLike richTextToolButtonLineBreak",
      insertText: "<br>"
    });
  }

  buttonDefs.forEach(def => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chatComposerToolButton button-tool ${def.className}`;
    button.textContent = def.textContent;
    button.title = def.label;
    button.setAttribute("aria-label", def.label);

    if (def.insertOpenTag) {
      button.dataset.insertOpenTag = def.insertOpenTag;
    }

    if (def.insertCloseTag) {
      button.dataset.insertCloseTag = def.insertCloseTag;
    }

    if (def.insertText) {
      button.dataset.insertText = def.insertText;
    }

    if (def.caretOffset) {
      button.dataset.caretOffset = def.caretOffset;
    }

    if (def.rubyTemplate) {
      button.dataset.rubyTemplate = def.rubyTemplate;
    }

    fragment.appendChild(button);
  });

  return fragment;
}
