import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-indigo-100 text-indigo-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-cyan-100 text-cyan-700",
};

const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
