import UilCheckCircle from "@iconscout/react-unicons/icons/uil-check-circle"
import UilInfoCircle from "@iconscout/react-unicons/icons/uil-info-circle"
import UilSpinner from "@iconscout/react-unicons/icons/uil-spinner"
import UilTimesCircle from "@iconscout/react-unicons/icons/uil-times-circle"
import UilExclamationTriangle from "@iconscout/react-unicons/icons/uil-exclamation-triangle"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <UilCheckCircle className="size-4" />,
        info: <UilInfoCircle className="size-4" />,
        warning: <UilExclamationTriangle className="size-4" />,
        error: <UilTimesCircle className="size-4" />,
        loading: <UilSpinner className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
