import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-coral/15 text-coral-light border-coral/25",
        teal:        "border-transparent bg-teal/15 text-teal-light border-teal/25",
        amber:       "border-transparent bg-amber/15 text-amber-light border-amber/25",
        purple:      "border-transparent bg-purple/15 text-purple-light border-purple/25",
        blue:        "border-transparent bg-blue/15 text-blue-light border-blue/25",
        green:       "border-transparent bg-green/15 text-green-light border-green/25",
        muted:       "border-border bg-surface-2 text-muted-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive border-destructive/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
