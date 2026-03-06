"use client"

import * as React from "react"
import { ReactNode } from "react"
import { LoaderCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogHelperProps {
  className?: string
  classNameContent?: string
  title?: string
  description?: string
  trigger?: ReactNode
  children?: ReactNode
  func?: () => void | Promise<void>
  isConfirmHidden?: boolean
  isDescriptionHidden?: boolean
  open?: boolean
  setOpen?: (open: boolean) => void
  disabled?: boolean
  isLoading?: boolean
}

export function AlertDialogHelper({
  className,
  classNameContent,
  title,
  description,
  trigger,
  children,
  func,
  isConfirmHidden,
  isDescriptionHidden,
  disabled,
  open,
  setOpen,
  isLoading,
}: AlertDialogHelperProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled =
    typeof open === "boolean" && typeof setOpen === "function"
  const resolvedOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        setOpen(nextOpen)
        return
      }
      setInternalOpen(nextOpen)
    },
    [isControlled, setOpen]
  )

  const handleConfirm = React.useCallback(async () => {
    try {
      await func?.()
    } finally {
      handleOpenChange(false)
    }
  }, [func, handleOpenChange])

  return (
    <div className={cn("relative", className)}>
      <AlertDialog open={resolvedOpen} onOpenChange={handleOpenChange}>
        {trigger && (
          <AlertDialogTrigger asChild disabled={disabled}>
            {trigger}
          </AlertDialogTrigger>
        )}
        <AlertDialogContent className={cn("max-w-xl", classNameContent)}>
          {isConfirmHidden && (
            <AlertDialogCancel className="absolute top-0 right-0 border-0 opacity-70 hover:bg-transparent">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </AlertDialogCancel>
          )}
          <AlertDialogHeader>
            <AlertDialogTitle>
              {title ? <span>{title}</span> : "Are you absolutely sure?"}
            </AlertDialogTitle>
            {!isDescriptionHidden && (
              <AlertDialogDescription>
                {description ??
                  "This action cannot be undone. This will permanently perform the action. Please proceed with caution."}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <div>{children}</div>
          {!isConfirmHidden && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={disabled}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleConfirm}
                disabled={disabled || isLoading}
                className={cn(disabled ? "flex items-center gap-2" : "")}
              >
                {isLoading ? "Processing..." : "Continue"}
                {isLoading && (
                  <LoaderCircle size={15} className="animate-spin" />
                )}
              </Button>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
