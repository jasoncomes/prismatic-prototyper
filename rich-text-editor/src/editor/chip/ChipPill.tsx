import { useChipPanel } from "./ChipPanel";
import { type ChipKind, chipLabelFor, isChipValid, tokenFor } from "./chipLabel";

/**
 * The pill, as React. This is what `FormatDecoratorNode.decorate()` returns.
 *
 * Class names mirror the product's `Chip` primitive – `chip`, `chip__value`,
 * `chip--interactive` – so this looks like the chip the app already ships.
 *
 * Being a real React component is the point. A `DecoratorNode` can host hooks,
 * context, a popover, an icon fetched at render; a chip built by hand in
 * `createDOM` cannot. That capability is why the chip is a decorator.
 */
export const ChipPill = ({
  reference,
  kind,
  format = 0,
}: {
  reference: string;
  kind: ChipKind;
  format?: number;
}) => {
  const flags = [
    [1, "b"], [2, "i"], [4, "s"], [8, "u"],
  ]
    .filter(([bit]) => (format & (bit as number)) !== 0)
    .map(([, tag]) => tag)
    .join("");
  const valid = isChipValid(kind, reference);
  const label = chipLabelFor(kind, reference);
  const token = tokenFor(kind, reference);
  const { open } = useChipPanel();

  return (
    <span
      className={[
        "chip",
        "chip--small",
        "chip--interactive",
        kind === "configVar" ? "chip--secondary" : "chip--primary",
        valid ? "" : "chip--error",
      ]
        .filter(Boolean)
        .join(" ")}
      contentEditable={false}
      data-reference={reference}
      onClick={() => open({ reference, kind, token })}
    >
      <span className="chip__value">
        {label}
        {flags ? <span className="chip__flags">{flags}</span> : null}
      </span>
    </span>
  );
};
