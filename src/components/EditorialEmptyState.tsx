import Link from "next/link";

export type EditorialEmptyStateProps = {
  testId?: string;
  eyebrow?: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  className?: string;
};

export default function EditorialEmptyState({
  testId,
  eyebrow,
  title,
  description,
  action,
  className = "",
}: EditorialEmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={`rounded-2xl border border-border/80 bg-surface px-6 py-10 text-center shadow-[var(--shadow-card)] sm:py-12 ${className}`}
    >
      {eyebrow && <p className="editorial-label">{eyebrow}</p>}
      <p className={`text-base font-semibold text-foreground ${eyebrow ? "mt-2" : ""}`}>
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm font-semibold"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
