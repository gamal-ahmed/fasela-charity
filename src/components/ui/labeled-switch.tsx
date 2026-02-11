import * as React from "react"
import { Switch } from "./switch"
import { Label } from "./label"
import { cn } from "@/lib/utils"

interface LabeledSwitchProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

const LabeledSwitch = React.forwardRef<HTMLButtonElement, LabeledSwitchProps>(
  ({ id, checked, onCheckedChange, label, description, disabled, className }, ref) => (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <Switch
          id={id}
          ref={ref}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        <Label htmlFor={id} className="text-sm text-muted-foreground cursor-pointer">
          {description ?? (checked ? "مفعّل" : "معطّل")}
        </Label>
      </div>
    </div>
  )
)
LabeledSwitch.displayName = "LabeledSwitch"

export { LabeledSwitch }
