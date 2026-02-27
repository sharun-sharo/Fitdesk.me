import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-sm font-semibold ring-offset-background transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "btn-primary-gradient border-0 text-white shadow-[0_6px_16px_rgba(109,93,246,0.35)] hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(109,93,246,0.15),0_10px_24px_rgba(109,93,246,0.45)] hover:brightness-105 active:translate-y-0 active:shadow-[0_4px_12px_rgba(109,93,246,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground border-0 shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        outline:
          "bg-[#F4F5F7] border border-[#E4E7EC] text-foreground hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D5DF6]",
        secondary:
          "bg-[#F4F5F7] text-foreground border border-[#E4E7EC] shadow-sm hover:bg-[#EDE9FE] hover:border-[#C4B5FD] hover:text-[#6D5DF6] hover:shadow",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[12px] px-3",
        lg: "h-11 rounded-[12px] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
