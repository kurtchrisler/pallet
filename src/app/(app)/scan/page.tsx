import { getAppContext } from "@/lib/app-context";
import type { Pallet } from "@/lib/types";
import { EmptyState } from "@/components/ui";
import { ScanIntake } from "@/components/ScanIntake";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ pallet?: string }>;
}) {
  const { supabase } = await getAppContext();
  const { pallet } = await searchParams;

  const { data: pallets } = await supabase
    .from("pallets")
    .select("*")
    .order("purchase_date", { ascending: false });

  const palletRows = (pallets ?? []) as Pallet[];

  if (!palletRows.length) {
    return (
      <section>
        <h2 className="text-[1.05rem] font-display font-semibold">Scan intake</h2>
        <p className="text-sm text-ink-soft mb-4">Scan a UPC while you unload a lot and FlipTrackr fills in what it knows.</p>
        <EmptyState>Add a lot on the Lots tab first, then come back here to scan items into it.</EmptyState>
      </section>
    );
  }

  const initialPalletId = pallet && palletRows.some((p) => p.id === pallet) ? pallet : palletRows[0].id;

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Scan intake</h2>
      <p className="text-sm text-ink-soft mb-4">Scan a UPC while you unload a lot and FlipTrackr fills in what it knows.</p>
      <ScanIntake
        pallets={palletRows.map((p) => ({ id: p.id, source: p.source, purchase_date: p.purchase_date }))}
        initialPalletId={initialPalletId}
      />
    </section>
  );
}
