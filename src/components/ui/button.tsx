import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-coral text-white hover:bg-coral-dark shadow-[0_0_16px_rgba(255,107,107,0.3)] hover:shadow-[0_0_20px_rgba(255,107,107,0.5)]",
        secondary:
          "bg-surface-2 text-foreground border border-border hover:border-muted",
        ghost:
          "hover:bg-surface-2 text-muted-foreground hover:text-foreground",
        teal:
          "bg-teal text-[#0d1117] font-bold hover:bg-teal-dark shadow-[0_0_16px_rgba(0,212,170,0.3)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/80",
        outline:
          "border border-border bg-transparent hover:bg-surface-2 text-foreground",
        link:
          "text-coral underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8  px-3 text-xs",
        lg:      "h-12 px-7 text-base",
        icon:    "h-10 w-10",
        "icon-sm": "h-8 w-8",
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
