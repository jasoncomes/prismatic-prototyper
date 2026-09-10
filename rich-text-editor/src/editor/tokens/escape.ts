/**
 * Option A from the tech doc, as a function.
 *
 * WHAT THIS IS FOR
 * ----------------
 * A substituted value is DATA. The template around it is MARKUP the author
 * wrote. They are not the same thing and must not be treated the same way:
 *
 *   template   <h1>Hello {{$trigger.body.data.name}}</h1>
 *   value      Procter & Gamble
 *   result     <h1>Hello Procter &amp; Gamble</h1>   <- valid
 *              <h1>Hello Procter & Gamble</h1>       <- invalid; browsers
 *                                                       recover, strict email
 *                                                       clients may not
 *
 * Escaping the value fixes that. Escaping the template would destroy it. This
 * function is only ever handed a value, never a template, which is the whole
 * distinction the doc credits Option A with: it is the only option that can
 * tell authored markup from a reference value.
 *
 * WHY A REFERENCE IS ALWAYS ESCAPED
 * ---------------------------------
 * A reference has no design-time type. Nothing declares what it points to, so
 * there is no basis on which to treat its value as markup, and the safe reading
 * of an unknown string is "text".
 *
 * A configuration variable is different, and concretely so: it resolves by
 * DECLARED type at deploy, and `dataType: CODE` with `codeLanguage: HTML` says
 * the value is markup. Escaping that turns an intended `<em>` into visible
 * tags, which is one of the reasons the doc rejects escaping unconditionally.
 * Only that exact pairing is exempt – a CODE variable holding JSON or XML is
 * not HTML and is escaped like anything else.
 *
 * THIS RULE IS NOT IMPLEMENTABLE ON THE CURRENT PATH, AND THAT IS THE POINT
 * ------------------------------------------------------------------------
 * Neither field survives to substitution. `runner/configVariables.ts:69-74`
 * collapses every non-connection, non-schedule variable to its bare value and
 * discards `data_type`; `codeLanguage` is dropped a hop earlier still, in the
 * backend's `to_definition`, and has ZERO occurrences anywhere in the runner.
 * By the time glimmer sees it, a CODE/HTML variable and a STRING variable are
 * byte-identical.
 *
 * So this function describes what Option A WOULD need, not what the platform
 * can do today. Adopting it requires carrying the declared type through to
 * substitution, or moving the decision to a hop that still has it. The harness
 * says so rather than implying the capability exists.
 *
 * WHAT THIS DELIBERATELY DOES NOT SOLVE
 * -------------------------------------
 * Position. Inside a `<pre>` the author wants the value shown as literal text;
 * in the heading above it they want it rendered. Substitution works on a
 * string and has no idea where in the document it is, so no single rule covers
 * both. The doc reaches the same conclusion and leaves it open.
 */

export type TokenKind = "reference" | "configVar";

/**
 * A configuration variable's declared type, named as the platform names it.
 *
 * `RequiredConfigVariableDataType` and `RequiredConfigVariableCodeLanguage` in
 * `graphql-global-types.ts` – CODE is a real data type and HTML is a real code
 * language, so `dataType: CODE, codeLanguage: HTML` is an existing, design-time
 * statement that a value IS markup. That declaration is the entire basis for
 * not escaping it, and it is why a reference cannot get the same treatment: a
 * reference has no such field to read.
 */
export type ConfigVarDataType = "STRING" | "CODE" | "NUMBER" | "DATE";
export type ConfigVarCodeLanguage = "HTML" | "JSON" | "XML";

const HTML_ENTITIES: Array<[RegExp, string]> = [
  // Ampersand first, or the entities written by the later rules get re-escaped.
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
];

export const escapeHtml = (value: string): string =>
  HTML_ENTITIES.reduce(
    (acc, [pattern, entity]) => acc.replace(pattern, entity),
    value,
  );

export const isDeclaredHtml = (spec: {
  dataType?: ConfigVarDataType;
  codeLanguage?: ConfigVarCodeLanguage;
}): boolean => spec.dataType === "CODE" && spec.codeLanguage === "HTML";

export const escapeTokenValue = (
  value: string,
  {
    kind,
    dataType,
    codeLanguage,
  }: {
    kind: TokenKind;
    dataType?: ConfigVarDataType;
    codeLanguage?: ConfigVarCodeLanguage;
  },
): string => {
  // No declared type, so no grounds for treating it as anything but data.
  if (kind === "reference") return escapeHtml(value);

  if (isDeclaredHtml({ dataType, codeLanguage })) return value;

  return escapeHtml(value);
};
