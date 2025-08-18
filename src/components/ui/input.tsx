import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500", className)}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
