import type { ComponentType } from "react"
import UilFlask from "@iconscout/react-unicons/icons/uil-flask"
import UilBolt from "@iconscout/react-unicons/icons/uil-bolt"
import UilBracketsCurly from "@iconscout/react-unicons/icons/uil-brackets-curly"
import UilFileAlt from "@iconscout/react-unicons/icons/uil-file-alt"
import UilText from "@iconscout/react-unicons/icons/uil-text"
import UilCalendarAlt from "@iconscout/react-unicons/icons/uil-calendar-alt"
import UilToggleOn from "@iconscout/react-unicons/icons/uil-toggle-on"
import UilListUl from "@iconscout/react-unicons/icons/uil-list-ul"

import type { PayloadType, Provenance, SourceKind } from "./types"

type IconType = ComponentType<{ className?: string }>

export const SOURCE_ICON: Record<SourceKind, IconType> = {
  real: UilFlask,
  test: UilBolt,
  example: UilFileAlt,
}

export const TYPE_ICON: Record<PayloadType, IconType> = {
  object: UilBracketsCurly,
  array: UilListUl,
  string: UilText,
  number: UilBolt,
  boolean: UilToggleOn,
  date: UilCalendarAlt,
}

export const PROVENANCE_COPY: Record<Provenance, string> = {
  real: "Showing data from a captured test run",
  test: "Showing a step result — a real response from test inputs",
  example: "Showing an example of the expected shape",
}
