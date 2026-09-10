import { KNOWN_CONFIG_VARS, KNOWN_STEPS } from "../tokens/resolve";

/**
 * The label a chip displays, matched to what the product renders today.
 *
 * Reference chip   `stepName | path`   primary colour, optional component icon
 * Config-var chip  `NAME`              secondary colour, no icon, no separator
 *
 * Both fall back to a fixed string when invalid – "Invalid Reference" and
 * "Invalid Config Variable" – exactly as ReferenceNode.tsx and
 * ConfigVariableNode.tsx do.
 *
 * The label is display only. The token it stands for is held separately, as
 * data on the node, and is recovered by the serializer – never by reading the
 * label back out of the DOM.
 */

export type ChipKind = "reference" | "configVar";

/** utils/valuePreviews.ts */
const MAX_VALUE_LENGTH = 30;

const previewSplitEnd = (value: string, max = MAX_VALUE_LENGTH): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

const previewSplitMiddle = (
  value: string,
  max = MAX_VALUE_LENGTH,
): string => {
  const half = Math.floor(max / 2);
  return value.length > max
    ? `${value.slice(0, half)}…${value.slice(-half)}`
    : value;
};

/** What the playground pretends exists, so validity is real rather than faked. */

export const tokenFor = (kind: ChipKind, name: string): string =>
  kind === "configVar" ? `{{#${name}}}` : `{{$${name}}}`;

export const isChipValid = (kind: ChipKind, name: string): boolean =>
  kind === "configVar"
    ? KNOWN_CONFIG_VARS.includes(name)
    : KNOWN_STEPS.includes(name.split(".")[0] ?? "");

/**
 * The visible label, and therefore the node's text.
 * Reference: the "results" selector is dropped, the way the real pill drops it.
 */
export const chipLabelFor = (kind: ChipKind, name: string): string => {
  if (!isChipValid(kind, name)) {
    return kind === "configVar" ? "Invalid Config Variable" : "Invalid Reference";
  }
  if (kind === "configVar") {
    return previewSplitEnd(name);
  }
  const [step, ...rest] = name.split(".");
  const tail = rest[0] === "results" ? rest.slice(1) : rest;
  return `${previewSplitEnd(step ?? name)} | ${previewSplitMiddle(tail.join("."))}`;
};
