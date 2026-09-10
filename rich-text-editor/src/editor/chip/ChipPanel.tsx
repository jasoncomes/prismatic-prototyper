import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { ChipKind } from "./chipLabel";

/**
 * The panel a chip opens, and the hook a chip opens it with.
 *
 * This mirrors how the app already does it. `ReferenceNode` is a DecoratorNode,
 * so its pill is a real React component, and it opens the reference panel by
 * calling `useDesignerReferencePanelActions().openReferencePanel` from its own
 * onClick – a context hook, not a listener on the DOM.
 *
 * That is only possible because the chip is a decorator. A pill built by hand
 * in `createDOM` has no React in scope and would need a delegated listener on
 * the editor root instead. Being able to delete that indirection is one of the
 * concrete things the decorator buys.
 */

interface ChipTarget {
  reference: string;
  kind: ChipKind;
  token: string;
}

const ChipPanelContext = createContext<{
  open: (target: ChipTarget) => void;
}>({ open: () => undefined });

export const useChipPanel = () => useContext(ChipPanelContext);

export const ChipPanelProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<ChipTarget | null>(null);
  const value = useMemo(() => ({ open: setTarget }), []);

  return (
    <ChipPanelContext.Provider value={value}>
      {children}
      {target === null ? null : (
        <div className="chip-panel">
          <div className="chip-panel__hd">
            {target.kind === "configVar"
              ? "Configuration variable"
              : "Reference"}
            <button type="button" onClick={() => setTarget(null)}>
              close
            </button>
          </div>
          <div className="chip-panel__bd">
            <div>
              <span className="chip-panel__k">token</span>
              <code>{target.token}</code>
            </div>
            <div>
              <span className="chip-panel__k">data</span>
              <code>{target.reference}</code>
            </div>
            <p>
              Opened from inside the pill, the way the product's reference panel
              is.
            </p>
          </div>
        </div>
      )}
    </ChipPanelContext.Provider>
  );
};
