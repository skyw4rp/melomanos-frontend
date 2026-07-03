interface DetailFieldProps {
  label: string;
  value: string | number | null | undefined;
}

export default function DetailField({ label, value }: DetailFieldProps) {
  const shown =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div className="border-b border-border py-3.5 last:border-0">
      <dt className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-[length:var(--text-nav)] font-medium text-foreground">{shown}</dd>
    </div>
  );
}
