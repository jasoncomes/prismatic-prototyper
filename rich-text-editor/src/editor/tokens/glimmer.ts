import get from "lodash/get";
import has from "lodash/has";
import toPath from "lodash/toPath";

/**
 * A port of `@prismatic-io/glimmer` 0.2.3, transcribed from the published
 * `dist/index.js` rather than paraphrased.
 *
 * WHY A PORT AND NOT THE PACKAGE
 * ------------------------------
 * glimmer resolves from a PRIVATE GitLab registry that needs an auth token.
 * This prototype is public and Netlify builds it with no token, so depending on
 * it would break the deploy. `verify-glimmer.mjs` diffs this file against the
 * real package whenever it is resolvable locally — which it is, from the
 * frontend checkout — so the two cannot drift silently.
 *
 * WHY IT MATTERS THAT THIS IS EXACT
 * ---------------------------------
 * The harness previously substituted tokens with its own regex, which agreed
 * with glimmer on well-formed input and diverged everywhere else. Every claim
 * the preview makes about what a recipient receives is a claim about this
 * function, so an approximation of it is an approximation of the answer.
 *
 * The behaviour worth knowing before reading the code:
 *
 *   - a `value` expression is returned VERBATIM. Braces inside it are never
 *     expanded, which is the single most consequential fact in the pipeline
 *   - only `template` substitutes
 *   - `reference` and `configVar` hold a bare path or key, never braces
 *   - an invalid reference THROWS, and the runner swallows that to `undefined`
 *   - a non-string value inside a template is JSON-stringified with its outer
 *     quotes stripped
 */

export type ExpressionType =
  | "value"
  | "reference"
  | "configVar"
  | "scopedConfigVar"
  | "template"
  | "complex";

export interface Expression {
  type: ExpressionType;
  value: string;
}

/** Everything a reference can be resolved against. */
export interface EvaluationScope {
  configVars: Record<string, unknown>;
  results: Record<string, unknown>;
  currentItem?: Record<string, unknown>;
  index?: Record<string, unknown>;
  isFirst?: Record<string, unknown>;
  isLast?: Record<string, unknown>;
  stepFailed?: Record<string, unknown>;
  stepError?: Record<string, unknown>;
}

// Reference expressions are expected to start with stepName, and stepName is
// expected to be alphanumeric camelCase, so must start with a lowercase letter.
const stepNameValidatorRegex = /^[a-z][a-zA-Z0-9]*$/g;
export const templateRefsRegex = /{{\$(.+?)}}/g;
export const templateConfigVarsRegex = /{{#(.+?)}}/g;

const REFERENCE_SEGMENTS = [
  "results",
  "currentItem",
  "index",
  "isFirst",
  "isLast",
  "failed",
  "error",
];

export const isValidReference = (value: string): boolean => {
  const expressionParts = toPath(value.trim());

  return !(
    expressionParts.length < 2 ||
    !expressionParts[0].match(stepNameValidatorRegex) ||
    !REFERENCE_SEGMENTS.includes(expressionParts[1])
  );
};

export const validateExpression = (
  expression: Expression,
): [boolean, string?] => {
  switch (expression.type) {
    case "value":
    case "configVar":
    case "scopedConfigVar":
    case "complex":
      return [true];
    case "reference":
      return isValidReference(expression.value)
        ? [true]
        : [false, `Invalid expression syntax: ${expression.value}`];
    case "template": {
      for (const match of expression.value.matchAll(templateRefsRegex)) {
        if (!isValidReference(match[1])) {
          return [false, `Invalid expression syntax: ${expression.value}`];
        }
      }

      return [true];
    }
    default:
      return [false, `Invalid expression type: ${expression.type ?? "unknown"}`];
  }
};

const evaluateExpression = (
  expression: Expression,
  scope: EvaluationScope,
): unknown => {
  const [valid, message] = validateExpression(expression);
  if (!valid) throw new Error(message);

  const { type, value } = expression;
  // TODO in the original: figure out a proper way of defaulting config vars.
  if (type === "configVar" && value === "") return undefined;

  let collection: Record<string, unknown> | undefined;
  let path: string[];

  switch (expression.type) {
    case "value":
      return expression.value;

    case "configVar": {
      // 0.2.3 stopped calling toPath here, so a config var key is ONE literal
      // key: a dotted name resolves, and you can no longer drill into one.
      let key = expression.value.trim();
      const bracketMatch = key.match(/^\[['"](.+)['"]\]$/);
      if (bracketMatch) key = bracketMatch[1];
      path = [key];
      collection = scope.configVars;
      break;
    }

    case "reference": {
      path = toPath(expression.value.trim());
      switch (path[1]) {
        case "results":     collection = scope.results; break;
        case "currentItem": collection = scope.currentItem; break;
        case "index":       collection = scope.index; break;
        case "isFirst":     collection = scope.isFirst; break;
        case "isLast":      collection = scope.isLast; break;
        case "failed":      collection = scope.stepFailed; break;
        case "error":       collection = scope.stepError; break;
        default:
          throw new Error(
            `Cannot evaluate expression with value: ${expression.value}`,
          );
      }
      // Adjust path so it makes sense in the context of the collection that has
      // been selected: ['stepName', 'results', 'foo'] -> ['stepName', 'foo']
      path = [path[0], ...path.splice(2)];
      break;
    }

    default:
      // Complex expressions end up here by design. Splitting them into
      // individual expressions is expected to happen elsewhere.
      throw new Error(
        `Cannot evaluate expression with type: ${expression.type}`,
      );
  }

  if (has(collection, path)) return get(collection, path);

  throw new Error(
    `Expression did not return valid result: ${expression.value}`,
  );
};

const evaluateTemplate = (template: string, scope: EvaluationScope): string => {
  // Build a mapping of tag to reified values.
  const tagValues: Record<string, unknown> = {};

  for (const [tag, reference] of template.matchAll(templateRefsRegex)) {
    tagValues[tag] = evaluateExpression(
      { value: reference, type: "reference" },
      scope,
    );
  }
  for (const [tag, configVar] of template.matchAll(templateConfigVarsRegex)) {
    tagValues[tag] = evaluateExpression(
      { value: configVar, type: "configVar" },
      scope,
    );
  }

  // Replace tags in the string with their reified values.
  return Object.entries(tagValues).reduce(
    (prev, [tag, value]) =>
      prev
        .split(tag)
        .join(
          typeof value === "string"
            ? value
            : // Unquote objects, so the literal value ends up in the template.
              JSON.stringify(value).replace(/^"(.*)"$/, "$1"),
        ),
    template,
  );
};

export const evaluate = (
  expression: Expression,
  scope: EvaluationScope,
): unknown =>
  expression.type === "template"
    ? evaluateTemplate(expression.value, scope)
    : evaluateExpression(expression, scope);
