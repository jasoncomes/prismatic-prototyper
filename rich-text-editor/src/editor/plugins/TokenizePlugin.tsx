import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, type LexicalNode, TextNode } from "lexical";
import { useEffect } from "react";
import type { ChipKind } from "../chip/chipLabel";
import { $createFormatDecoratorNode } from "../nodes/FormatDecoratorNode";

/** {{$reference}} or {{#CONFIG_VAR}} */
const SPLIT = /(\{\{[$#][^}]+\}\})/;
const ONE = /^\{\{([$#])([^}]+)\}\}$/;

/**
 * Turns literal tokens in the text into chips.
 *
 * This is what makes an imported stored value show pills rather than raw
 * braces. It runs as a node transform, so it also catches tokens typed by hand
 * into the WYSIWYG.
 *
 * The chip inherits the surrounding text's format. That is the whole mechanism
 * behind "bold survives across a reference": import `<b>hi {{$ref}}</b>`, the
 * text node arrives bold, and the chip is created carrying the same bitmask.
 */
export const TokenizePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerNodeTransform(TextNode, (node) => {
        // Chips are TextNode subclasses too; only plain text is a candidate.
        if (node.getType() !== "text") return;
        const text = node.getTextContent();
        if (!SPLIT.test(text)) return;

        const format = node.getFormat();
        const parts = text.split(SPLIT).filter(Boolean);

        let previous: LexicalNode = node;
        for (const part of parts) {
          const match = part.match(ONE);
          let created: LexicalNode;
          if (match) {
            const kind: ChipKind = match[1] === "#" ? "configVar" : "reference";
            const name = match[2];
            created = $createFormatDecoratorNode(name, kind, format);
          } else {
            created = $createTextNode(part).setFormat(format);
          }
          previous.insertAfter(created);
          previous = created;
        }
        node.remove();
      }),
    [editor],
  );

  return null;
};
