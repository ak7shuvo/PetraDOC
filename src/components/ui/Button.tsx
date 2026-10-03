import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
const V: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "border border-border bg-surface text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-primary hover:bg-surface-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className = "", type = "button", ...p }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-50 ${V[variant]} ${className}`}
      {...p}
    />
  );
});

export const linkButtonClass = (variant: Variant = "primary") =>
  `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium ${V[variant]}`;
