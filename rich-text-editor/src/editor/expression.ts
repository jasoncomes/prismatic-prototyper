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
  /**
   * The new editor always writes `template`, and does not offer the choice.
   *
   * `value` hands the string to the component verbatim, so a reference
   * inserted into one ships as literal braces. `reference` and `configVar`
   * hold a bare path or key rather than markup, so there is no rich text to
   * edit in either. That leaves exactly one type this editor can correctly
   * produce.
   *
   * The union keeps its other members because they describe what the PLATFORM
   * stores — a value authored elsewhere still arrives as one of them.
   */
  type: SimpleInputType;
  value: string;
  meta?: Record<string, unknown>;
}

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
