"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  toastVariants,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(({ id, title, description, variant, open, onOpenChange, ...props }) => (
        <Toast key={id} variant={variant} open={open} onOpenChange={onOpenChange} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}
