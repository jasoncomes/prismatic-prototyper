import { useState, useMemo } from "react"
import UilSetting from "@iconscout/react-unicons/icons/uil-setting"
import UilInfoCircle from "@iconscout/react-unicons/icons/uil-info-circle"
import UilEye from "@iconscout/react-unicons/icons/uil-eye"
import UilEyeSlash from "@iconscout/react-unicons/icons/uil-eye-slash"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ComponentIcon } from "@/components/component-icon"
import { useStore } from "@/data/store"
import { MOCK_CONNECTION_INPUTS, MOCK_TEMPLATE_PREFILLED_VALUES, INITIAL_CONNECTION_CONFIG_VARS } from "@/data/components"
import type {
  Component,
  ConnectionConfigVar,
  ConnectionInputField,
  InputPermission,
  InputSettings,
  ManagedBy,
} from "@/data/types"
import { CONNECTION_TYPE_LABELS } from "@/data/constants"
import { cn } from "@/lib/utils"

const PERMISSION_OPTIONS: { value: InputPermission; label: string; description: string }[] = [
  { value: "customer", label: "Customer", description: "Customers can view and edit this connection value" },
  { value: "embedded", label: "Embedded", description: "Value is set through the embedded marketplace" },
  { value: "organization", label: "Organization", description: "Only organization users can view and edit this value" },
]

const PERMISSION_TO_MANAGED_BY: Record<InputPermission, ManagedBy> = {
  customer: "customer",
  embedded: "org-customer",
  organization: "org-global",
}

const MANAGED_BY_TO_PERMISSION: Record<ManagedBy, InputPermission> = {
  customer: "customer",
  "org-customer": "embedded",
  "org-global": "organization",
  "build-only": "organization",
}

const DEFAULT_INPUT_SETTINGS: InputSettings = {
  permission: "customer",
  visibleToOrg: true,
  writeOnly: false,
}

// --- Internal Components ---

interface InputFieldRowProps {
  field: ConnectionInputField
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onOpenSettings: () => void
}

const InputFieldRow = ({
  field,
  value,
  onChange,
  readOnly,
  showPassword,
  onTogglePassword,
  onOpenSettings,
}: InputFieldRowProps) => {
  const isPassword = field.fieldType === "password"
  const inputType = isPassword && !showPassword ? "password" : "text"

  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold text-foreground/85">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {field.fieldType === "textarea" ? (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.description}
              disabled={readOnly}
              className={cn(
                "min-h-[80px] text-sm",
                readOnly && "bg-gray-02 text-foreground/55"
              )}
            />
          ) : (
            <Input
              type={inputType}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.description}
              disabled={readOnly}
              className={cn(
                "h-[42px] pr-16 text-sm",
                readOnly && "bg-gray-02 text-foreground/55"
              )}
            />
          )}
          {field.fieldType !== "textarea" && (
            <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
              {isPassword && (
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="rounded p-1 text-foreground/45 hover:text-foreground/75 transition-colors"
                >
                  {showPassword ? (
                    <UilEyeSlash className="size-4" />
                  ) : (
                    <UilEye className="size-4" />
                  )}
                </button>
              )}
              {field.writeOnly && !readOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-amber-500">
                      <UilInfoCircle className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    This field is write-only. The value cannot be read back after saving.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex size-[42px] shrink-0 items-center justify-center rounded border border-ui-border-rest text-foreground/55 hover:border-ui-border-hover hover:text-foreground/75 transition-colors"
        >
          <UilSetting className="size-4" />
        </button>
      </div>
      {field.description && !readOnly && (
        <p className="text-xs text-foreground/45">{field.description}</p>
      )}
    </div>
  )
}

interface InputSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldLabel: string
  settings: InputSettings
  onSave: (settings: InputSettings) => void
}

const InputSettingsDialog = ({
  open,
  onOpenChange,
  fieldLabel,
  settings,
  onSave,
}: InputSettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState<InputSettings>(settings)

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen) setLocalSettings(settings)
    onOpenChange(nextOpen)
  }

  const handleSave = () => {
    onSave(localSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base">Input Settings</DialogTitle>
          <DialogDescription>{fieldLabel}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5 px-10 py-6">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Permission and visibility</Label>
            <Select
              value={localSettings.permission}
              onValueChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, permission: v as InputPermission }))
              }
            >
              <SelectTrigger className="w-full h-[42px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-foreground/45">
              {PERMISSION_OPTIONS.find((o) => o.value === localSettings.permission)?.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-[13px]">Visible to organization</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground/45 cursor-help">
                    <UilInfoCircle className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  When enabled, organization users can view this field value
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={localSettings.visibleToOrg}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, visibleToOrg: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-[13px]">Write Only</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground/45 cursor-help">
                    <UilInfoCircle className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  When enabled, the value can only be written and never read back
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={localSettings.writeOnly}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, writeOnly: checked }))
              }
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={handleSave} size="sm">Save</Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Shared form body (used by both inline view and dialog) ---

const buildInitialInputValues = (componentKey: string, connKey: string, templateId?: string) => {
  const fields = MOCK_CONNECTION_INPUTS[componentKey]?.[connKey] ?? []
  const prefilled = templateId ? MOCK_TEMPLATE_PREFILLED_VALUES[templateId] ?? {} : {}
  const values: Record<string, string> = {}
  for (const field of fields) {
    values[field.key] = prefilled[field.key] ?? field.defaultValue
  }
  return values
}

interface UseConnectionFormProps {
  component: Component
  existingConnection?: ConnectionConfigVar
  initialManagedBy?: ManagedBy
  initialConnectionKey?: string
  onSave: (connectionId: string) => void
}

const useConnectionForm = ({ component, existingConnection, initialManagedBy, initialConnectionKey, onSave }: UseConnectionFormProps) => {
  const { addConnectionConfigVar, connectionTemplates } = useStore()

  const componentTemplates = useMemo(
    () => connectionTemplates.filter((t) => t.componentKey === component.key),
    [connectionTemplates, component.key]
  )

  const isEditMode = !!existingConnection
  const defaultConnectionKey = existingConnection?.connectionKey ?? initialConnectionKey ?? component.connections[0]?.key ?? ""

  const matchingTemplate = initialConnectionKey
    ? componentTemplates.find((t) => t.connectionKey === initialConnectionKey)
    : null
  const [configurationId, setConfigurationId] = useState(existingConnection?.template ?? matchingTemplate?.id ?? "none")
  const [connectionName, setConnectionName] = useState(existingConnection?.name ?? `${component.label} Connection`)
  const [description, setDescription] = useState("")
  const [selectedConnectionKey, setSelectedConnectionKey] = useState(defaultConnectionKey)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() =>
    buildInitialInputValues(component.key, defaultConnectionKey, existingConnection?.template ?? matchingTemplate?.id)
  )
  const [inputSettings, setInputSettings] = useState<Record<string, InputSettings>>({})
  const [permission, setPermission] = useState<InputPermission>(
    existingConnection
      ? MANAGED_BY_TO_PERMISSION[existingConnection.managedBy]
      : initialManagedBy
        ? MANAGED_BY_TO_PERMISSION[initialManagedBy]
        : "customer"
  )
  const [visibleToOrg, setVisibleToOrg] = useState(true)
  const [customOAuthEnabled, setCustomOAuthEnabled] = useState(false)
  const [successUri, setSuccessUri] = useState("")
  const [failureUri, setFailureUri] = useState("")
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({})
  const [inputSettingsDialogKey, setInputSettingsDialogKey] = useState<string | null>(null)

  const selectedConnection = component.connections.find((c) => c.key === selectedConnectionKey)
  const isOAuth = selectedConnection?.type === "oauth2"

  const connectionInputs: ConnectionInputField[] = useMemo(
    () => MOCK_CONNECTION_INPUTS[component.key]?.[selectedConnectionKey] ?? [],
    [component.key, selectedConnectionKey]
  )

  const prefilledKeys = useMemo(() => {
    if (configurationId === "none") return new Set<string>()
    const prefilled = MOCK_TEMPLATE_PREFILLED_VALUES[configurationId]
    return prefilled ? new Set(Object.keys(prefilled)) : new Set<string>()
  }, [configurationId])

  const initializeFieldDefaults = (connKey: string) => {
    const fields = MOCK_CONNECTION_INPUTS[component.key]?.[connKey] ?? []
    const defaults: Record<string, string> = {}
    for (const field of fields) {
      if (field.defaultValue) defaults[field.key] = field.defaultValue
    }
    setInputValues(defaults)
    setInputSettings({})
    setShowPasswordFields({})
  }

  const handleConfigurationChange = (value: string) => {
    setConfigurationId(value)
    if (value === "none") {
      initializeFieldDefaults(selectedConnectionKey)
      return
    }
    const template = componentTemplates.find((t) => t.id === value)
    if (!template) return

    if (template.connectionKey !== selectedConnectionKey) {
      setSelectedConnectionKey(template.connectionKey)
    }

    const fields = MOCK_CONNECTION_INPUTS[component.key]?.[template.connectionKey] ?? []
    const prefilled = MOCK_TEMPLATE_PREFILLED_VALUES[value] ?? {}
    const values: Record<string, string> = {}
    for (const field of fields) {
      values[field.key] = prefilled[field.key] ?? field.defaultValue
    }
    setInputValues(values)
    setShowPasswordFields({})
  }

  const handleConnectionTypeChange = (connKey: string) => {
    setSelectedConnectionKey(connKey)
    setConfigurationId("none")
    initializeFieldDefaults(connKey)
  }

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const managedBy = PERMISSION_TO_MANAGED_BY[permission]
    const newId = existingConnection?.id ?? `ccv-${Date.now()}`
    if (!isEditMode) {
      // Add as configured connection for this integration
      addConnectionConfigVar({
        id: newId,
        componentKey: component.key,
        connectionKey: selectedConnectionKey,
        name: connectionName,
        type: selectedConnection?.type ?? "api_key",
        managedBy,
        status: "pending",
        isRcv: true,
        isScv: false,
        template: configurationId !== "none" ? configurationId : undefined,
      })
      // Non-build-only connections also become available for reuse across integrations
      if (managedBy !== "build-only") {
        addConnectionConfigVar({
          id: `avail-${Date.now()}`,
          componentKey: component.key,
          connectionKey: selectedConnectionKey,
          name: connectionName,
          type: selectedConnection?.type ?? "api_key",
          managedBy,
          status: "pending",
          isRcv: false,
          isScv: false,
          template: configurationId !== "none" ? configurationId : undefined,
        })
      }
    }
    onSave(newId)
  }

  const settingsDialogField = inputSettingsDialogKey
    ? connectionInputs.find((f) => f.key === inputSettingsDialogKey)
    : null

  return {
    isEditMode,
    componentTemplates,
    configurationId,
    handleConfigurationChange,
    connectionName,
    setConnectionName,
    description,
    setDescription,
    selectedConnectionKey,
    handleConnectionTypeChange,
    connectionInputs,
    inputValues,
    handleInputChange,
    prefilledKeys,
    showPasswordFields,
    setShowPasswordFields,
    inputSettingsDialogKey,
    setInputSettingsDialogKey,
    inputSettings,
    setInputSettings,
    permission,
    setPermission,
    visibleToOrg,
    setVisibleToOrg,
    isOAuth,
    customOAuthEnabled,
    setCustomOAuthEnabled,
    successUri,
    setSuccessUri,
    failureUri,
    setFailureUri,
    handleSubmit,
    settingsDialogField,
  }
}

// --- Inline View (used inside ComponentManagementModal) ---

interface ConnectionFormViewProps {
  component: Component
  existingConnection?: ConnectionConfigVar
  onBack: () => void
  onDelete?: () => void
}

export const ConnectionFormView = ({ component, existingConnection, onBack, onDelete }: ConnectionFormViewProps) => {
  const form = useConnectionForm({ component, existingConnection, onSave: () => onBack() })

  return (
    <>
      <DialogHeader>
        <DialogTitle>{form.isEditMode ? "Edit connection" : "Add connection"}</DialogTitle>
      </DialogHeader>

      <DialogBody className="space-y-6 px-10 py-6">
        <ConnectionFormBody component={component} form={form} isBuildOnly={existingConnection?.managedBy === "build-only"} />
      </DialogBody>

      <DialogFooter>
        <div className="flex items-center gap-4">
          {form.isEditMode && onDelete && (
            <Button variant="destructive" onClick={onDelete}>Delete</Button>
          )}
          <Button onClick={form.handleSubmit}>
            {form.isEditMode ? "Save" : "Create"}
          </Button>
        </div>
        <Button variant="tertiary" onClick={onBack}>Back</Button>
      </DialogFooter>

      {form.settingsDialogField && (
        <InputSettingsDialog
          open={form.inputSettingsDialogKey !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) form.setInputSettingsDialogKey(null)
          }}
          fieldLabel={form.settingsDialogField.label}
          settings={form.inputSettings[form.settingsDialogField.key] ?? DEFAULT_INPUT_SETTINGS}
          onSave={(newSettings) => {
            form.setInputSettings((prev) => ({
              ...prev,
              [form.settingsDialogField!.key]: newSettings,
            }))
          }}
        />
      )}
    </>
  )
}

// --- Type Picker Options ---

const CONNECTION_TYPE_OPTIONS: { value: ManagedBy; label: string; description: string }[] = [
  {
    value: "customer",
    label: "Customer-Activated Connection",
    description: "Predefine connection inputs for a connection that your customers will enable. Your customers will only need to provide their customer-specific credentials when they deploy an integration that uses this connection.",
  },
  {
    value: "org-customer",
    label: "Organization-Activated Customer Connection",
    description: "Set up a customer-specific connection on behalf of your customers; they will not need to provide credentials for this connection when an integration is deployed.",
  },
  {
    value: "org-global",
    label: "Organization-Activated Global Connection",
    description: "Set up a connection that is specific to your organization. Customers will not be aware of this connection when an integration is deployed.",
  },
  {
    value: "build-only",
    label: "None (manually configure)",
    description: "Manually configure the connection details. This option will make the connection unique to this integration.",
  },
]

// --- Dialog version (standalone modal with type picker step) ---

interface AddConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  component: Component
  preselectedConnectionId?: string | null
  onCreated?: (connectionId: string) => void
}

export const AddConnectionModal = ({ open, onOpenChange, component, preselectedConnectionId, onCreated }: AddConnectionModalProps) => {
  const preselectedConnection = preselectedConnectionId
    ? INITIAL_CONNECTION_CONFIG_VARS.find((v) => v.id === preselectedConnectionId)
    : null

  const [step, setStep] = useState<"type-picker" | "form">(preselectedConnection ? "form" : "type-picker")
  const [selectedManagedBy, setSelectedManagedBy] = useState<ManagedBy>(preselectedConnection?.managedBy ?? "customer")

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("type-picker")
    }
    onOpenChange(nextOpen)
  }

  const handleTypeSelect = (managedBy: ManagedBy) => {
    setSelectedManagedBy(managedBy)
    setStep("form")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        {step === "type-picker" ? (
          <ConnectionTypePicker
            component={component}
            onSelect={handleTypeSelect}
          />
        ) : (
          <ConnectionFormStep
            component={component}
            initialManagedBy={preselectedConnection?.managedBy ?? selectedManagedBy}
            initialConnectionKey={preselectedConnection?.connectionKey}
            onBack={preselectedConnection ? () => handleClose(false) : () => setStep("type-picker")}
            onClose={() => handleClose(false)}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

const ConnectionTypePicker = ({
  component,
  onSelect,
}: {
  component: Component
  onSelect: (managedBy: ManagedBy) => void
}) => (
  <>
    <DialogHeader>
      <DialogTitle>Add Connection</DialogTitle>
    </DialogHeader>

    <DialogBody className="px-10 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground/85">{component.label}</div>
          <div className="text-xs text-foreground/55 truncate">{component.description}</div>
        </div>
      </div>

      <div>
        <span className="text-[13px] font-semibold text-foreground/85">Connection Type</span>
        <div className="mt-3 space-y-2">
          {CONNECTION_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className="w-full rounded-lg border border-gray-04 bg-white p-4 text-left transition-all hover:border-gray-06 hover:shadow-sm cursor-pointer"
            >
              <div className="text-sm font-semibold text-foreground/85">{opt.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/55">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </DialogBody>
  </>
)

const ConnectionFormStep = ({
  component,
  initialManagedBy,
  initialConnectionKey,
  onBack,
  onClose,
  onCreated,
}: {
  component: Component
  initialManagedBy: ManagedBy
  initialConnectionKey?: string
  onBack: () => void
  onClose: () => void
  onCreated?: (connectionId: string) => void
}) => {
  const form = useConnectionForm({
    component,
    initialManagedBy,
    initialConnectionKey,
    onSave: (connectionId) => {
      onCreated?.(connectionId)
      onClose()
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add connection</DialogTitle>
      </DialogHeader>

      <DialogBody className="space-y-6 px-10 py-6">
        <ConnectionFormBody component={component} form={form} />
      </DialogBody>

      <DialogFooter>
        <Button onClick={form.handleSubmit}>Create</Button>
        <Button variant="tertiary" onClick={onBack}>Back</Button>
      </DialogFooter>

      {form.settingsDialogField && (
        <InputSettingsDialog
          open={form.inputSettingsDialogKey !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) form.setInputSettingsDialogKey(null)
          }}
          fieldLabel={form.settingsDialogField.label}
          settings={form.inputSettings[form.settingsDialogField.key] ?? DEFAULT_INPUT_SETTINGS}
          onSave={(newSettings) => {
            form.setInputSettings((prev) => ({
              ...prev,
              [form.settingsDialogField!.key]: newSettings,
            }))
          }}
        />
      )}
    </>
  )
}

// --- Form body (shared between inline and dialog) ---

interface ConnectionFormBodyProps {
  component: Component
  form: ReturnType<typeof useConnectionForm>
  isBuildOnly?: boolean
}

const ConnectionFormBody = ({ component, form, isBuildOnly }: ConnectionFormBodyProps) => (
  <>
    {/* Component info banner */}
    <div className="flex items-center gap-3">
      <ComponentIcon color={component.iconColor} initials={component.iconInitials} size="md" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground/85">{component.label}</div>
        <div className="text-xs text-foreground/55 truncate">{component.description}</div>
      </div>
    </div>

    {/* Connection configuration selector */}
    <div className="space-y-1.5">
      <Label className="text-[13px]">
        Select a connection configuration
        <span className="ml-0.5 text-red-500">*</span>
      </Label>
      <Select value={form.configurationId} onValueChange={form.handleConfigurationChange}>
        <SelectTrigger className="w-full h-[42px]">
          <SelectValue placeholder="None (manually configure)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None (manually configure)</SelectItem>
          {form.componentTemplates.map((tpl) => (
            <SelectItem key={tpl.id} value={tpl.id}>
              {tpl.name}{isBuildOnly ? " (Build Only)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-foreground/45">
        Select an existing connection configuration to pre-fill values, or manually configure a new one. Pre-filled values are used during deployment.
      </p>
    </div>

    {/* Name */}
    <div className="space-y-1.5">
      <Label className="text-[13px]">
        Name
        <span className="ml-0.5 text-red-500">*</span>
      </Label>
      <Input
        value={form.connectionName}
        onChange={(e) => form.setConnectionName(e.target.value)}
        placeholder="Enter a name for this connection"
        className="h-[42px] text-sm"
      />
    </div>

    {/* Description */}
    <div className="space-y-1.5">
      <Label className="text-[13px]">Description</Label>
      <Textarea
        value={form.description}
        onChange={(e) => form.setDescription(e.target.value)}
        placeholder="Optionally describe this connection"
        className="min-h-[60px] text-sm"
      />
    </div>

    {/* Connection Type */}
    {component.connections.length > 1 && (
      <div className="space-y-1.5">
        <Label className="text-[13px]">
          Connection Type
          <span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Select value={form.selectedConnectionKey} onValueChange={form.handleConnectionTypeChange}>
          <SelectTrigger className="w-full h-[42px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {component.connections.map((conn) => (
              <SelectItem key={conn.key} value={conn.key}>
                {CONNECTION_TYPE_LABELS[conn.type] ?? conn.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}

    {/* Inputs */}
    {form.connectionInputs.length > 0 && (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground/85">Inputs</span>
          <div className="h-px flex-1 bg-gray-04" />
        </div>

        <div className="space-y-4 rounded-lg border border-gray-04 bg-gray-01 p-4">
          {form.connectionInputs.map((field) => (
            <InputFieldRow
              key={field.key}
              field={field}
              value={form.inputValues[field.key] ?? ""}
              onChange={(v) => form.handleInputChange(field.key, v)}
              readOnly={form.prefilledKeys.has(field.key)}
              showPassword={form.showPasswordFields[field.key] ?? false}
              onTogglePassword={() =>
                form.setShowPasswordFields((prev) => ({
                  ...prev,
                  [field.key]: !prev[field.key],
                }))
              }
              onOpenSettings={() => form.setInputSettingsDialogKey(field.key)}
            />
          ))}
        </div>
      </div>
    )}

    {/* Permission and visibility */}
    <div className="space-y-1.5">
      <Label className="text-[13px]">Permission and visibility</Label>
      <Select
        value={form.permission}
        onValueChange={(v) => form.setPermission(v as InputPermission)}
      >
        <SelectTrigger className="w-full h-[42px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERMISSION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-foreground/45">
        {PERMISSION_OPTIONS.find((o) => o.value === form.permission)?.description}
      </p>
    </div>

    {/* Visibility to org toggle */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Label className="text-[13px]">Visible to organization</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-foreground/45 cursor-help">
              <UilInfoCircle className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            When enabled, organization users can see this connection's values
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch checked={form.visibleToOrg} onCheckedChange={form.setVisibleToOrg} />
    </div>

    {/* Custom OAuth redirects (OAuth only) */}
    {form.isOAuth && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[13px]">Custom OAuth redirects</Label>
          <Switch checked={form.customOAuthEnabled} onCheckedChange={form.setCustomOAuthEnabled} />
        </div>
        {form.customOAuthEnabled && (
          <div className="space-y-3 rounded-lg border border-gray-04 bg-gray-01 p-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Success URI</Label>
              <Input
                value={form.successUri}
                onChange={(e) => form.setSuccessUri(e.target.value)}
                placeholder="https://example.com/oauth/success"
                className="h-[42px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Failure URI</Label>
              <Input
                value={form.failureUri}
                onChange={(e) => form.setFailureUri(e.target.value)}
                placeholder="https://example.com/oauth/failure"
                className="h-[42px] text-sm"
              />
            </div>
          </div>
        )}
      </div>
    )}
  </>
)
