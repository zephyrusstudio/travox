import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "primary" | "neutral";
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary:
    "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]",
  neutral: "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

const StatCard: React.FC<StatCardProps> = ({ label, value, tone = "neutral" }) => {
  return (
    <div className={`rounded-xl border px-4 py-3 ${toneStyles[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
};

export default StatCard;
