//rich-text-toolbar-ui.js

export function createRichTextToolbarButtons() {
  const fragment = document.createDocumentFragment();

  const buttonDefs = [
    {
      textContent: "B",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonBold",
      insertOpenTag: "<b>",
      insertCloseTag: "</b>"
    },
    {
      textContent: "I",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonItalic",
      insertOpenTag: "<i>",
      insertCloseTag: "</i>"
    },
    {
      textContent: "U",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonUnderline",
      insertOpenTag: "<u>",
      insertCloseTag: "</u>"
    },
    {
      textContent: "S",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonStrike",
      insertOpenTag: "<s>",
      insertCloseTag: "</s>"
    },
    {
      textContent: "rb",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonRuby",
      insertText: "<rb></rb><rt></rt>",
      caretOffset: "4"
    },
    {
      textContent: "F1",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f1>",
      insertCloseTag: "</f1>"
    },
    {
      textContent: "F2",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f2>",
      insertCloseTag: "</f2>"
    },
    {
      textContent: "F3",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f3>",
      insertCloseTag: "</f3>"
    },
    {
      textContent: "F4",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f4>",
      insertCloseTag: "</f4>"
    },
    {
      textContent: "F5",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f5>",
      insertCloseTag: "</f5>"
    },
    {
      textContent: "F6",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f6>",
      insertCloseTag: "</f6>"
    },
    {
      textContent: "F7",
      className: "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont",
      insertOpenTag: "<f7>",
      insertCloseTag: "</f7>"
    }
  ];

  buttonDefs.forEach(def => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = def.className;
    button.textContent = def.textContent;

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

    fragment.appendChild(button);
  });

  return fragment;
}
