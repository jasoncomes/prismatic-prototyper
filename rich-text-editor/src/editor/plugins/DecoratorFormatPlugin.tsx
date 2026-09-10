import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  IS_BOLD,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
  type TextFormatType,
} from "lexical";
import { useEffect } from "react";
import { $isFormatDecoratorNode } from "../nodes/FormatDecoratorNode";

const FLAG: Partial<Record<TextFormatType, number>> = {
  bold: IS_BOLD,
  italic: IS_ITALIC,
  strikethrough: IS_STRIKETHROUGH,
  underline: IS_UNDERLINE,
};

/**
 * The formatting path a DecoratorNode does not get for free.
 *
 * `RangeSelection.formatText` walks the selection and calls setFormat only on
 * TextNodes – a decorator is filtered out before it is ever reached. So a chip
 * inside a bolded sentence stays unbolded, and worse, severs the run: the text
 * either side of it each gets its own <b>.
 *
 * This listener runs at LOW priority, which is ABOVE the EDITOR priority the
 * rich-text plugin uses, so it sees the selection's formats before Lexical
 * changes them. It works out which way the toggle is going, applies that to
 * every decorator in the selection, then returns false so Lexical still does
 * the text nodes itself.
 *
 * THE COST THIS REPRESENTS
 * ------------------------
 * This is a second formatting implementation living beside Lexical's. Every
 * format type, and every rule about how a toggle decides its direction, now
 * has to be mirrored here and kept in step as Lexical changes. That is the
 * price of keeping React inside the pill.
 */
export const DecoratorFormatPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerCommand<TextFormatType>(
        FORMAT_TEXT_COMMAND,
        (format) => {
          const flag = FLAG[format];
          if (flag === undefined) return false;

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const nodes = selection.getNodes();
          const chips = nodes.filter($isFormatDecoratorNode);
          if (chips.length === 0) return false;

          // Match Lexical's own rule: a toggle turns OFF only when everything
          // already carries the format. Text nodes decide it when there are
          // any, so the chip agrees with the words around it.
          const texts = nodes.filter($isTextNode);
          const turnOn =
            texts.length > 0
              ? !texts.every((node) => (node.getFormat() & flag) !== 0)
              : !chips.every((chip) => chip.hasFormat(flag));

          for (const chip of chips) {
            const current = chip.getFormat();
            chip.setFormat(turnOn ? current | flag : current & ~flag);
          }

          // false, so Lexical still formats the text nodes.
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor],
  );

  return null;
};
