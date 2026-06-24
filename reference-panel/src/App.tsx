import { useState } from "react"

import { ReferencePanel } from "./reference/ReferencePanel"
import { VariantSwitcher } from "./reference/VariantSwitcher"
import { VARIATIONS } from "./reference/mockData"
import type { Availability, Presentation, Variant } from "./reference/types"

function App() {
  const [presentation, setPresentation] = useState<Presentation>("one")
  const [variant, setVariant] = useState<Variant>(VARIATIONS.one[0].id)
  const [availability, setAvailability] = useState<Availability>({
    real: true,
    inline: true,
    schema: true,
    example: false,
  })

  const onPresentation = (p: Presentation) => {
    setPresentation(p)
    setVariant(VARIATIONS[p][0].id)
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <VariantSwitcher
        presentation={presentation}
        onPresentation={onPresentation}
        variant={variant}
        onVariant={setVariant}
        availability={availability}
        onAvailability={setAvailability}
      />

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <p className="mb-5 max-w-2xl text-[13px] text-foreground/55">
          Pick a top-level option, then browse the variation examples that fit
          it. Try the inline “Run action” flow and toggle per-step availability.
        </p>
        <ReferencePanel
          presentation={presentation}
          variant={variant}
          availability={availability}
        />
      </div>
    </div>
  )
}

export default App
