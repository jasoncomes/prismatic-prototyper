import { useEffect, useRef, useState } from "react";

/**
 * The raw pane's caret, and which surface a toolbar button acts on.
 *
 * TWO RULES, BOTH LEARNED THE HARD WAY
 * ------------------------------------
 * **The caret is parked, not set.** After inserting a token it cannot be
 * restored inline, because two things happen after the call returns: React
 * rewrites the textarea's value on the next commit and the selection goes with
 * it, and Lexical takes focus while reconciling the import. So the position is
 * stored here and applied from an effect, after both have settled. Setting it
 * directly left the caret at 0 every time.
 *
 * **The target is whichever surface was touched LAST, not whichever has focus.**
 * Clicking a toolbar button blurs the textarea before the click lands, so
 * "currently focused" is always the toolbar itself and would never name the
 * pane the author was working in.
 */
export const useRawPane = () => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isTarget, setIsTarget] = useState(false);
  const pendingCaret = useRef<number | null>(null);

  useEffect(() => {
    const caret = pendingCaret.current;
    if (caret === null) return;
    pendingCaret.current = null;

    const el = ref.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });

    return () => cancelAnimationFrame(frame);
  });

  /**
   * Splice text in at the caret and hand back the new value, having parked
   * where the caret should land once it has been committed and re-rendered.
   */
  const spliceAtCaret = (draft: string, text: string): string | null => {
    const el = ref.current;
    if (!el) return null;

    const { selectionStart, selectionEnd } = el;
    pendingCaret.current = selectionStart + text.length;

    return draft.slice(0, selectionStart) + text + draft.slice(selectionEnd);
  };

  return {
    ref,
    isTarget,
    onFocus: () => setIsTarget(true),
    releaseTarget: () => setIsTarget(false),
    spliceAtCaret,
  };
};
