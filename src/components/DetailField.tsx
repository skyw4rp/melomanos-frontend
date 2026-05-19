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
    <div className="border-b border-white/5 py-3 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-zinc-100">{shown}</dd>
    </div>
  );
}
