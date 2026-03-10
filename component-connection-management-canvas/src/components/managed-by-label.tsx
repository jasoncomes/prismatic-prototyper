import UilGlobe from "@iconscout/react-unicons/icons/uil-globe"
import UilUser from "@iconscout/react-unicons/icons/uil-user"
import UilSetting from "@iconscout/react-unicons/icons/uil-setting"
import type { ManagedBy } from "@/data/types"

const CONFIG: Record<ManagedBy, { label: string; Icon: typeof UilGlobe }> = {
  "build-only": { label: "Build Only", Icon: UilSetting },
  "org-global": { label: "Organization (Global)", Icon: UilGlobe },
  "org-customer": { label: "Organization (Customer)", Icon: UilGlobe },
  customer: { label: "Customer", Icon: UilUser },
}

export const ManagedByLabel = ({ managedBy }: { managedBy: ManagedBy }) => {
  const { label, Icon } = CONFIG[managedBy]
  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground/55">
      <Icon className="size-3.5" />
      <span>{label}</span>
    </div>
  )
}
