import { prisma } from "@/lib/prisma";
import { AdminPricingZones } from "@/components/admin/admin-pricing-zones";
import type { PriceZoneWithCountries } from "@/lib/price-zones-shared";

async function getZones(): Promise<PriceZoneWithCountries[]> {
	const zones = await prisma.priceZone.findMany({
		include: { countries: true },
		orderBy: [{ priority: "asc" }, { name: "asc" }],
	});
	return zones.map((zone) => ({
		id: zone.id,
		name: zone.name,
		code: zone.code,
		markupNok: zone.markupNok,
		priority: zone.priority,
		countries: zone.countries.map((c) => c.country),
	}));
}

export default async function PricingZonesPage() {
	const zones = await getZones();

	return <AdminPricingZones initialZones={zones} />;
}
