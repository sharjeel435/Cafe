import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-sm",
      secondary:
        "bg-gray-800 text-white hover:bg-gray-900 focus-visible:ring-gray-700 shadow-sm",
      outline:
        "border border-orange-500 text-orange-600 hover:bg-orange-50 focus-visible:ring-orange-500",
      ghost:
        "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
      danger:
        "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm",
    };
    const sizes: Record<ButtonSize, string> = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
