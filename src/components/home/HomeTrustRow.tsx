import { IconShieldCheck, IconTruck, IconUsers } from "@/components/icons/HomeIcons";

const ITEMS = [
  {
    icon: IconShieldCheck,
    title: "Compra segura",
    description: "Pagos retenidos hasta que recibes tu vinilo.",
  },
  {
    icon: IconTruck,
    title: "Envíos a todo Chile",
    description: "Rápido, seguro y con seguimiento.",
  },
  {
    icon: IconUsers,
    title: "Comunidad real",
    description: "DJs y coleccionistas como tú.",
  },
] as const;

type HomeTrustRowProps = {
  /** When true, renders inline under hero CTAs without section chrome */
  embedded?: boolean;
};

export default function HomeTrustRow({ embedded = false }: HomeTrustRowProps) {
  const content = (
    <div className={`grid gap-5 ${embedded ? "mt-8 sm:grid-cols-3 sm:gap-6" : "sm:grid-cols-3 sm:gap-8"}`}>
      {ITEMS.map((item) => (
        <div key={item.title} className="flex gap-2.5">
          <item.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div data-testid="trust-strip" id="home-trust-row" aria-label="Confianza en la compra">
        {content}
      </div>
    );
  }

  return (
    <section
      data-testid="trust-strip"
      id="home-trust-row"
      aria-label="Confianza en la compra"
      className="mt-8 border-t border-border/60 pt-8"
    >
      {content}
    </section>
  );
}
