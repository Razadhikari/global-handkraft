import { AdminPageHeader } from "@/components/admin/page-header";
import { prisma } from "@/lib/prisma";

async function getZones() {
	const zones = await prisma.priceZone.findMany({
		include: { countries: true },
		orderBy: { priority: "asc" },
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

const COUNTRY_NAMES: Record<string, string> = {
	NO: "Norway",
	SE: "Sweden",
	DK: "Denmark",
	FI: "Finland",
	DE: "Germany",
	NL: "Netherlands",
	BE: "Belgium",
	FR: "France",
	ES: "Spain",
	IT: "Italy",
	AT: "Austria",
	CH: "Switzerland",
	GB: "United Kingdom",
	EE: "Estonia",
	LV: "Latvia",
	LT: "Lithuania",
	PL: "Poland",
	CZ: "Czechia",
	SK: "Slovakia",
	HU: "Hungary",
	LU: "Luxembourg",
	HR: "Croatia",
	BG: "Bulgaria",
	IE: "Ireland",
	PT: "Portugal",
	SI: "Slovenia",
	CY: "Cyprus",
	MT: "Malta",
	GR: "Greece",
	RO: "Romania",
};

export default async function PricingZonesPage() {
	const zones = await getZones();

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Pricing Zones"
				description="Manage country zones and fixed markup amounts added to base prices."
			/>

			{/* Create Zone Card */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 text-base font-semibold text-slate-900">Add New Pricing Zone</h2>
				<form action="/api/admin/pricing-zones" method="post" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Zone name</label>
						<input name="name" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none" placeholder="e.g. Nordics" />
					</div>
					<div>
						<label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Zone code</label>
						<input name="code" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none" placeholder="e.g. ZONE_1" />
					</div>
					<div>
						<label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Markup (NOK)</label>
						<input name="markupNok" type="number" required min="0" step="1" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none" placeholder="e.g. 280" />
					</div>
					<div>
						<label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Priority</label>
						<input name="priority" type="number" defaultValue="0" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none" />
					</div>
					<div className="sm:col-span-2 lg:col-span-4">
						<label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Countries</label>
						<div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
							{Object.keys(COUNTRY_NAMES).map((code) => (
								<label key={code} className="flex items-center gap-2 text-sm text-slate-700">
									<input type="checkbox" name="countries" value={code} className="rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]" />
									<span>{COUNTRY_NAMES[code]}</span>
								</label>
							))}
						</div>
					</div>
					<div className="sm:col-span-2 lg:col-span-4">
						<button type="submit" className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#152a48]">
							Create zone
						</button>
					</div>
				</form>
			</div>

			{/* Existing Zones List */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 text-base font-semibold text-slate-900">Configured Zones ({zones.length})</h2>
				<div className="grid gap-4">
					{zones.map((zone) => (
						<div key={zone.id} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<p className="text-sm font-semibold text-slate-900">{zone.name}</p>
									<p className="text-xs text-slate-500">
										{zone.code} • Priority {zone.priority}
									</p>
									<p className="text-sm font-semibold text-emerald-700">+{zone.markupNok} NOK</p>
								</div>
								<div className="flex flex-wrap gap-1.5 max-w-xl">
									{zone.countries.map((code) => (
										<span key={code} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
											{COUNTRY_NAMES[code] || code}
										</span>
									))}
								</div>
								<form action="/api/admin/pricing-zones" method="post" className="flex items-center gap-2">
									<input type="hidden" name="zoneId" value={zone.id} />
									<button type="submit" name="action" value="delete" className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50">
										Delete
									</button>
								</form>
							</div>
						</div>
					))}
					{zones.length === 0 ? <p className="text-sm text-slate-500">No pricing zones configured yet.</p> : null}
				</div>
			</div>
		</div>
	);
}
