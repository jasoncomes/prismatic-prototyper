/**
 * Class names Lexical puts on the editor's own DOM. They exist only inside the
 * editor and must never reach a stored value — which is what `serialize.ts` is
 * for. Seeing `editor-textBold` in pane 5 would mean the serializer had been
 * bypassed.
 */
export const theme = {
  text: {
    bold: "editor-textBold",
    italic: "editor-textItalic",
    underline: "editor-textUnderline",
    strikethrough: "editor-textStrikethrough",
  },
  heading: { h1: "editor-h1", h2: "editor-h2", h3: "editor-h3" },
  paragraph: "editor-paragraph",
};
