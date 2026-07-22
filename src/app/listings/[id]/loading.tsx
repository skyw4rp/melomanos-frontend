export default function ListingDetailLoading() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10"
      aria-busy="true"
      aria-label="Cargando detalle del vinilo"
    >
      <div className="h-5 w-32 rounded bg-surface-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-12">
        <div className="aspect-square w-full rounded-2xl bg-surface-muted" />
        <div className="space-y-5">
          <div className="h-4 w-28 rounded bg-surface-muted" />
          <div className="h-9 w-3/4 rounded bg-surface-muted" />
          <div className="h-10 w-40 rounded bg-surface-muted" />
          <div className="h-40 rounded-2xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
