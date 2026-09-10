/**
 * The envelope every stored input is wrapped in.
 *
 * The harness used to treat "the saved value" as a bare string. What the
 * platform stores is `{ type, value, meta? }`, and the `type` decides whether
 * the tokens inside `value` mean anything at all:
 *
 *     type: "template"   the tokens are substituted at run time
 *     type: "value"      the tokens are delivered as literal characters
 *
 * A code input is created as `type: "value"` and nothing infers otherwise from
 * its content, so an editor that writes tokens without also setting the type
 * produces markup that looks right in every preview and fails on the first real
 * run. That is why this file exists and why pane 5 shows the envelope rather
 * than the string inside it.
 */

/** The four the backend's YAML enum admits for a simple input. */
export type SimpleInputType = "value" | "reference" | "configVar" | "template";

export interface InputExpression {
  type: SimpleInputType;
  value: string;
  meta?: Record<string, unknown>;
}

/**
 * The two types a rich-text input can plausibly hold.
 *
 * `reference` and `configVar` store a bare path or key rather than markup, so
 * they replace the whole input instead of appearing inside it — there is no
 * rich text to edit in either case.
 */
export const RICH_TEXT_TYPES: SimpleInputType[] = ["template", "value"];

/**
 * A double-quoted YAML scalar, the way PyYAML writes one.
 *
 * `backend/utils/yaml.py` dumps with `default_style='"'`, which escapes YAML's
 * own metacharacters and nothing else — a bare `&`, an existing `&amp;` and
 * angle brackets all survive untouched. Newlines become `\n`, which is why a
 * formatted multi-line value looks the way it does in the file.
 */
const yamlScalar = (value: string): string =>
  `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}"`;

/** The input as it sits in the integration definition. */
export const toStoredYaml = (
  inputKey: string,
  expression: InputExpression,
): string => {
  const lines = [
    "inputs:",
    `  ${inputKey}:`,
    `    type: ${yamlScalar(expression.type)}`,
    `    value: ${yamlScalar(expression.value)}`,
  ];

  if (expression.meta && Object.keys(expression.meta).length > 0) {
    lines.push("    meta:");
    for (const [key, value] of Object.entries(expression.meta)) {
      lines.push(`      ${key}: ${yamlScalar(String(value))}`);
    }
  }

  return lines.join("\n");
};
