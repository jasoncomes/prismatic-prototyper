import {
  $applyNodeReplacement,
  type LexicalNode,
  ParagraphNode,
  type SerializedParagraphNode,
} from "lexical";

/**
 * A block the editor had to invent, not one the author wrote.
 *
 * WHY THIS EXISTS
 * ---------------
 * Lexical's root refuses inline content outright:
 *
 *     rootNode.splice: Only element or decorator nodes can be
 *     inserted to the root node
 *
 * So importing `<b>Hi</b> there` has to wrap it in something. If the serializer
 * cannot tell that wrapper from a `<p>` the author actually typed, the saved
 * value gains a tag it never had.
 *
 * That is not cosmetic. A stored value is a FRAGMENT – it has no idea what it
 * will be interpolated into:
 *
 *   - `<p>` nested in a `<p>` is auto-closed by the parser, splitting the
 *     surrounding block in half
 *   - `<p>` inside a `<span>` or an `<a>` is invalid nesting
 *   - `<p>` in an email carries default margins the author never asked for
 *
 * So the importer marks the wrappers it creates, and the serializer emits their
 * children with no tag of its own.
 *
 * WHY MARK THE INVENTED ONE RATHER THAN THE AUTHORED ONE
 * ------------------------------------------------------
 * Pressing Enter in the editor creates a plain `ParagraphNode`, and that one is
 * a real authored block that SHOULD export as `<p>`. Marking the invented
 * wrapper keeps both cases right; marking the authored one would silently eat
 * every paragraph the writer added while editing.
 */
export class ImplicitParagraphNode extends ParagraphNode {
  static getType(): string {
    return "implicit-paragraph";
  }

  static clone(node: ImplicitParagraphNode): ImplicitParagraphNode {
    return new ImplicitParagraphNode(node.__key);
  }

  static importJSON(
    serialized: SerializedParagraphNode,
  ): ImplicitParagraphNode {
    const node = $createImplicitParagraphNode();
    node.setFormat(serialized.format);
    node.setIndent(serialized.indent);

    return node;
  }

  exportJSON(): SerializedParagraphNode {
    return { ...super.exportJSON(), type: ImplicitParagraphNode.getType() };
  }
}

export const $createImplicitParagraphNode = (): ImplicitParagraphNode =>
  $applyNodeReplacement(new ImplicitParagraphNode());

export const $isImplicitParagraphNode = (
  node: LexicalNode | null | undefined,
): node is ImplicitParagraphNode => node instanceof ImplicitParagraphNode;
