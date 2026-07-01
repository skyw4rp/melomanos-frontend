import Marketplace from "@/components/Marketplace";

export default function HomePage() {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8">
        <Marketplace />
      </div>
    </div>
  );
}
