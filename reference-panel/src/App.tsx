import { useState } from "react"

import { ReferencePanel } from "./reference/ReferencePanel"
import { VariantSwitcher } from "./reference/VariantSwitcher"
import type { Availability } from "./reference/mockData"
import type { NamingScheme, SourceModel, VariantId } from "./reference/types"

function App() {
  const [variant, setVariant] = useState<VariantId>("segmented")
  const [sourceModel, setSourceModel] = useState<SourceModel>("peers")
  const [naming, setNaming] = useState<NamingScheme>("descriptive")
  const [availability, setAvailability] = useState<Availability>({
    test: true,
    inline: true,
    schema: true,
    example: false,
  })

  return (
    <div className="min-h-screen bg-neutral-100">
      <VariantSwitcher
        variant={variant}
        onVariant={setVariant}
        sourceModel={sourceModel}
        onSourceModel={setSourceModel}
        naming={naming}
        onNaming={setNaming}
        availability={availability}
        onAvailability={setAvailability}
      />

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <p className="mb-5 max-w-2xl text-[13px] text-foreground/55">
          Pick a field in the tree to insert its reference path. Toggle data
          sources, open the run / inline-action sub-dropdowns, and flip layout
          variants above to compare.
        </p>
        <ReferencePanel
          variant={variant}
          sourceModel={sourceModel}
          availability={availability}
          naming={naming}
        />
      </div>
    </div>
  )
}

export default App
