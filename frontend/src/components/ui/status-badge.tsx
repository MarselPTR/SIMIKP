import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export type IconType = React.ComponentType<{
  className?: string
  size?: number | string
  color?: string
  "aria-hidden"?: boolean | "true" | "false"
  [key: string]: any
}>

const statusBadgeVariants = cva(
  "inline-flex items-center gap-x-2 rounded-tremor-full bg-background px-3 py-1 text-xs border transition-colors",
  {
    variants: {
      status: {
        success: "bg-emerald-50 text-emerald-800 border-emerald-200",
        error: "bg-rose-50 text-rose-800 border-rose-200",
        default: "bg-background text-foreground border-border",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  leftIcon?: IconType
  rightIcon?: IconType
  leftLabel: string
  rightLabel?: string
}

export function StatusBadge({
  className,
  status,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftLabel,
  rightLabel,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className="inline-flex items-center gap-1.5 font-semibold">
        {LeftIcon && (
          <LeftIcon 
            className={cn(
              "-ml-0.5 size-3.5 shrink-0",
              status === "success" && "text-emerald-600 dark:text-emerald-500",
              status === "error" && "text-rose-600 dark:text-rose-500"
            )} 
            aria-hidden={true}
          />
        )}
        {leftLabel}
      </span>
      {rightLabel && (
        <>
          <span className="h-3.5 w-px bg-current opacity-20" />
          <span className="inline-flex items-center gap-1.5 opacity-80">
            {RightIcon && (
              <RightIcon 
                className="-ml-0.5 size-3.5 shrink-0" 
                aria-hidden={true}
              />
            )}
            {rightLabel}
          </span>
        </>
      )}
    </span>
  )
}
