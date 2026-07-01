const TRUST_ITEMS = [
  {
    icon: "🛡️",
    title: "Compra segura",
    description: "Transacciones dentro de Melómanos",
  },
  {
    icon: "🔒",
    title: "Pago protegido",
    description: "Fondos retenidos hasta la recepción",
  },
  {
    icon: "📦",
    title: "Envíos con seguimiento",
    description: "Seguimiento visible en cada pedido",
  },
  {
    icon: "👥",
    title: "Comunidad real",
    description: "Coleccionistas y DJs de Chile",
  },
] as const;

export default function TrustStrip() {
  return (
    <section
      data-testid="trust-strip"
      aria-label="Confianza Melómanos"
      className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg"
              aria-hidden
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
