import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
} from "lexical";
import { useEffect, useState } from "react";

interface Snapshot {
  kind: string;
  anchor: string;
  focus: string;
  collapsed: string;
  nodeType: string;
  mode: string;
  format: string;
  text: string;
}

const EMPTY: Snapshot = {
  kind: "none",
  anchor: "–",
  focus: "–",
  collapsed: "–",
  nodeType: "–",
  mode: "–",
  format: "–",
  text: "–",
};

const describeFormat = (format: number): string => {
  if (format === 0) return "0 (none)";
  const flags = [
    [1, "bold"],
    [2, "italic"],
    [4, "strikethrough"],
    [8, "underline"],
    [16, "code"],
  ] as const;
  const on = flags.filter(([bit]) => format & bit).map(([, name]) => name);
  return `${format} (${on.join(", ")})`;
};

/**
 * Answers the review's "this might cause problems with selection, keyboard nav".
 *
 * Put the caret before a chip and hold the right-arrow key, then watch the
 * offsets. Clicking a chip produces a NodeSelection rather than a RangeSelection,
 * because a decorator cannot be a range endpoint at all. That limitation is real
 * and this pane is where you can see it rather than take it on trust.
 */
export const SelectionInspector = () => {
  const [editor] = useLexicalComposerContext();
  const [snap, setSnap] = useState<Snapshot>(EMPTY);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();

          if ($isNodeSelection(selection)) {
            const keys = selection.getNodes().map((n) => n.getKey());
            const first = keys[0] ? $getNodeByKey(keys[0]) : null;
            setSnap({
              ...EMPTY,
              kind: "NodeSelection – the whole node is selected as an object",
              anchor: keys.join(", ") || "–",
              focus: keys.join(", ") || "–",
              nodeType: first?.getType() ?? "–",
              text: first?.getTextContent() ?? "–",
            });
            return;
          }

          if (!$isRangeSelection(selection)) {
            setSnap(EMPTY);
            return;
          }

          const { anchor, focus } = selection;
          const node = anchor.getNode();

          setSnap({
            kind: "RangeSelection – a caret or a text range",
            anchor: `${anchor.key} @ ${anchor.offset} (${anchor.type})`,
            focus: `${focus.key} @ ${focus.offset} (${focus.type})`,
            collapsed: selection.isCollapsed() ? "yes – caret" : "no – range",
            nodeType: node.getType(),
            mode: $isTextNode(node)
              ? `${node.getMode()}${node.isToken() ? "  ← atomic" : ""}`
              : "n/a (not a text node)",
            format: $isTextNode(node)
              ? describeFormat(node.getFormat())
              : "n/a – formatText never reaches this node",
            text: JSON.stringify(node.getTextContent()).slice(0, 60),
          });
        });
      }),
    [editor],
  );

  return (
    <div className="panel">
      <div className="panel__hd">
        Selection · arrow through a chip and watch these change
      </div>
      <dl className="kv">
        <dt>selection kind</dt>
        <dd>{snap.kind}</dd>
        <dt>anchor</dt>
        <dd className="mono">{snap.anchor}</dd>
        <dt>focus</dt>
        <dd className="mono">{snap.focus}</dd>
        <dt>collapsed</dt>
        <dd>{snap.collapsed}</dd>
        <dt>node at anchor</dt>
        <dd className="mono">{snap.nodeType}</dd>
        <dt>mode</dt>
        <dd className="mono">{snap.mode}</dd>
        <dt>format bitmask</dt>
        <dd className="mono">{snap.format}</dd>
        <dt>text</dt>
        <dd className="mono">{snap.text}</dd>
      </dl>
    </div>
  );
};
