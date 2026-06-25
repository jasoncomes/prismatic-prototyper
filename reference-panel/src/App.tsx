import { useState } from "react"

import { ReferencePanel } from "./reference/ReferencePanel"
import { VariantSwitcher } from "./reference/VariantSwitcher"
import { VARIATIONS } from "./reference/mockData"
import type { Audience, Availability, Presentation, Variant } from "./reference/types"

function App() {
  const [variant, setVariant] = useState<Variant>(VARIATIONS.easy[0].id)
  const [audience, setAudience] = useState<Audience>("lowcode")
  const [availability, setAvailability] = useState<Availability>({
    real: true,
    inline: true,
    schema: true,
    example: false,
  })

  // Layout placement is the only thing presentation drives now; derive it.
  const presentation: Presentation = variant.startsWith("easy") ? "easy" : "one"

  return (
    <div className="min-h-screen bg-neutral-100">
      <VariantSwitcher
        variant={variant}
        onVariant={setVariant}
        availability={availability}
        onAvailability={setAvailability}
        audience={audience}
        onAudience={setAudience}
      />

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <p className="mb-5 max-w-2xl text-[13px] text-foreground/55">
          The picker auto-selects the highest-fidelity data available (test run
          → step → schema/example) and shows where it came from. Toggle
          per-step availability to watch the fallback, and flip the audience to
          compare EWB (no change) vs. low-code (Change allowed).
        </p>
        <ReferencePanel
          presentation={presentation}
          variant={variant}
          availability={availability}
          audience={audience}
        />
      </div>
    </div>
  )
}

export default App
