import {
  IconClock,
  IconCommunity,
  IconEye,
  IconUsers,
} from "@/components/icons/HomeIcons";

const BENEFITS = [
  {
    icon: IconClock,
    title: "Vende fácil",
    description: "Publica tu vinilo en minutos y llega a más compradores.",
  },
  {
    icon: IconEye,
    title: "Más visibilidad",
    description: "Tu publicación aparece en nuevos ingresos y radar.",
  },
  {
    icon: IconUsers,
    title: "Comunidad activa",
    description: "DJs, sellos y coleccionistas buscando música real.",
  },
  {
    icon: IconCommunity,
    title: "Hecho para melómanos",
    description: "Curaduría, cultura y pasión por diggers de verdad.",
  },
] as const;

export default function HomeBenefitsStrip() {
  return (
    <section
      id="guia-digger"
      data-testid="home-benefits-strip"
      className="py-2"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border/70">
        {BENEFITS.map((item, i) => (
          <div
            key={item.title}
            className={`lg:px-5 ${i === 0 ? "lg:pl-0" : ""} ${i === BENEFITS.length - 1 ? "lg:pr-0" : ""}`}
          >
            <item.icon className="mb-2.5 h-[18px] w-[18px] text-foreground" />
            <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
