import type { LexicalEditor } from "lexical";
import { useEffect, useRef, useState } from "react";
import type { Dialect } from "../editor";

/**
 * The value the editor would save, and the whitespace shape it is presented in.
 *
 * THE ONE RULE THIS HOOK EXISTS TO HOLD
 * -------------------------------------
 * A shape is kept for exactly as long as it still MEANS the value the tree
 * holds:
 *
 *     dialect.canonical(shape) === dialect.save(tree)
 *
 * Lexical cannot store the newline between `</li>` and `<li>`, and it emits one
 * spelling of every markdown construct. Left alone it would therefore reformat
 * an author's file the first time they opened it. The author's own text is the
 * seed instead, and it survives until the CONTENT changes — at which point the
 * shape is no longer an honest description of the value, so it is dropped and
 * the panes show what actually survived. That is also how you see what the
 * editor discarded.
 *
 * WHY THERE IS NO DIRTY FLAG AND NO APPLY BUTTON
 * ----------------------------------------------
 * That single comparison replaces them. There is never a pending state to
 * apply, because the pane's text is either still valid or it is not. Formatting
 * implies applying, for the same reason.
 */
export const useStoredValue = ({
  editor,
  dialect,
  initial,
  loadNonce,
}: {
  editor: LexicalEditor;
  dialect: Dialect;
  initial: string;
  loadNonce: number;
}) => {
  const [saved, setSaved] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const shape = useRef("");
  const seen = useRef(-1);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        const next = dialect.save(editorState).trim();
        if (dialect.canonical(shape.current) !== next) shape.current = next;
        setSaved(shape.current);
        setRawDraft((draft) =>
          dialect.canonical(draft) === next ? draft : shape.current,
        );
      }),
    [editor, dialect],
  );

  useEffect(() => {
    if (seen.current === loadNonce) return;
    seen.current = loadNonce;
    shape.current = initial.trim();
    dialect.load(editor, initial);
  }, [editor, dialect, initial, loadNonce]);

  /** Load a string and adopt its shape as the one to present. */
  const commit = (value: string) => {
    shape.current = value.trim();
    setRawDraft(value);
    dialect.load(editor, value);
  };

  return { saved, rawDraft, setRawDraft, commit };
};
