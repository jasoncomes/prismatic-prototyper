import type { ComponentType } from "react"
import UilFlask from "@iconscout/react-unicons/icons/uil-flask"
import UilBolt from "@iconscout/react-unicons/icons/uil-bolt"
import UilBracketsCurly from "@iconscout/react-unicons/icons/uil-brackets-curly"
import UilFileAlt from "@iconscout/react-unicons/icons/uil-file-alt"
import UilDatabase from "@iconscout/react-unicons/icons/uil-database"
import UilText from "@iconscout/react-unicons/icons/uil-text"
import UilCalendarAlt from "@iconscout/react-unicons/icons/uil-calendar-alt"
import UilToggleOn from "@iconscout/react-unicons/icons/uil-toggle-on"
import UilListUl from "@iconscout/react-unicons/icons/uil-list-ul"

import type { PayloadType, SourceKind } from "./types"

type IconType = ComponentType<{ className?: string }>

export const SOURCE_ICON: Record<SourceKind, IconType> = {
  test: UilFlask,
  inline: UilBolt,
  schema: UilBracketsCurly,
  example: UilFileAlt,
  live: UilDatabase,
}

export const TYPE_ICON: Record<PayloadType, IconType> = {
  object: UilBracketsCurly,
  array: UilListUl,
  string: UilText,
  number: UilBolt,
  boolean: UilToggleOn,
  date: UilCalendarAlt,
}

export const STATUS_VARIANT: Record<
  string,
  "success" | "error" | "warning" | "default"
> = {
  success: "success",
  error: "error",
  running: "warning",
}
