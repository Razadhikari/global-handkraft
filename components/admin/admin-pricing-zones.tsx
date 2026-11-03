"use client";

import { useState, useMemo } from "react";
import {
	Plus,
	Pencil,
	Trash2,
	Search,
	Globe,
	Check,
	X,
	ArrowRightLeft,
	Percent,
	Sliders,
	Layers,
	ChevronDown,
	Loader2,
	RefreshCw,
	HelpCircle,
	AlertCircle,
} from "lucide-react";
import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import type { PriceZoneWithCountries } from "@/lib/price-zones-shared";

const COUNTRY_MAP: Record<string, string> = Object.fromEntries(
	SHIPPING_COUNTRIES.map((c) => [c.code, c.name])
);

type Feedback = {
	type: "success" | "error";
	message: string;
};

type BulkMarkupMode = "fixed" | "percentage" | "set";

export function AdminPricingZones({ initialZones }: { initialZones: PriceZoneWithCountries[] }) {
	const [zones, setZones] = useState<PriceZoneWithCountries[]>(initialZones);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<Feedback | null>(null);

	// Inline quick markup edit state
	const [quickEditId, setQuickEditId] = useState<string | null>(null);
	const [quickMarkupInput, setQuickMarkupInput] = useState<string>("");

	// Single country add popover on a card
	const [activeAddCountryZoneId, setActiveAddCountryZoneId] = useState<string | null>(null);
	const [addCountrySearch, setAddCountrySearch] = useState("");

	// Create / Edit modal state
	const [zoneModalOpen, setZoneModalOpen] = useState(false);
	const [editingZone, setEditingZone] = useState<PriceZoneWithCountries | null>(null);
	const [formName, setFormName] = useState("");
	const [formCode, setFormCode] = useState("");
	const [formMarkup, setFormMarkup] = useState<number | string>(0);
	const [formPriority, setFormPriority] = useState<number | string>(0);
	const [formSelectedCountries, setFormSelectedCountries] = useState<string[]>([]);
	const [formCountrySearch, setFormCountrySearch] = useState("");

	// Quick Single Country Zone modal state
	const [singleCountryModalOpen, setSingleCountryModalOpen] = useState(false);
	const [singleCountryCode, setSingleCountryCode] = useState("");
	const [singleCountryMarkup, setSingleCountryMarkup] = useState<number | string>(250);

	// Bulk Markup Modal state
	const [bulkMarkupModalOpen, setBulkMarkupModalOpen] = useState(false);
	const [bulkMode, setBulkMode] = useState<BulkMarkupMode>("fixed");
	const [bulkAmount, setBulkAmount] = useState<number | string>(50);

	// Merge Zones Modal state
	const [mergeModalOpen, setMergeModalOpen] = useState(false);
	const [mergeSourceZoneIds, setMergeSourceZoneIds] = useState<string[]>([]);
	const [mergeTargetZoneId, setMergeTargetZoneId] = useState<string>("");
	const [mergeDeleteSource, setMergeDeleteSource] = useState(true);

	// Delete Confirmation Modal state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [zonesToDelete, setZonesToDelete] = useState<PriceZoneWithCountries[]>([]);

	// Move single country modal
	const [moveCountryModalOpen, setMoveCountryModalOpen] = useState(false);
	const [countryToMove, setCountryToMove] = useState<string>("");
	const [moveTargetZoneId, setMoveTargetZoneId] = useState<string>("");

	// Unassigned countries tray
	const [showUnassignedTray, setShowUnassignedTray] = useState(false);

	// Computed: map of country -> zone
	const countryToZoneMap = useMemo(() => {
		const map: Record<string, PriceZoneWithCountries> = {};
		for (const zone of zones) {
			for (const c of zone.countries) {
				map[c] = zone;
			}
		}
		return map;
	}, [zones]);

	// Computed: unassigned countries from SHIPPING_COUNTRIES
	const unassignedCountries = useMemo(() => {
		return SHIPPING_COUNTRIES.filter((c) => !countryToZoneMap[c.code]);
	}, [countryToZoneMap]);

	// Filtered zones based on search query
	const filteredZones = useMemo(() => {
		if (!searchQuery.trim()) return zones;
		const query = searchQuery.toLowerCase().trim();
		return zones.filter((zone) => {
			if (zone.name.toLowerCase().includes(query)) return true;
			if (zone.code.toLowerCase().includes(query)) return true;
			if (zone.countries.some((c) => c.toLowerCase().includes(query) || (COUNTRY_MAP[c] && COUNTRY_MAP[c].toLowerCase().includes(query)))) {
				return true;
			}
			return false;
		});
	}, [zones, searchQuery]);

	// Refresh data from server
	const refreshData = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", { cache: "no-store" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load pricing zones.");
			setZones(data.zones);
			setFeedback({ type: "success", message: "Pricing zones refreshed." });
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error refreshing data." });
		} finally {
			setIsLoading(false);
		}
	};

	// Helper for bulk selection
	const toggleSelectZone = (id: string) => {
		setSelectedZoneIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
	};

	const toggleSelectAll = () => {
		if (selectedZoneIds.length === filteredZones.length) {
			setSelectedZoneIds([]);
		} else {
			setSelectedZoneIds(filteredZones.map((z) => z.id));
		}
	};

	// OPEN CREATE MODAL
	const openCreateModal = () => {
		setEditingZone(null);
		setFormName("");
		// Auto-suggest next zone code
		const maxZoneNum = zones
			.map((z) => {
				const match = z.code.match(/ZONE_(\d+)/i);
				return match ? parseInt(match[1], 10) : 0;
			})
			.reduce((max, n) => Math.max(max, n), 0);
		setFormCode(`ZONE_${maxZoneNum + 1}`);
		setFormMarkup(300);
		setFormPriority(zones.length);
		setFormSelectedCountries([]);
		setFormCountrySearch("");
		setZoneModalOpen(true);
	};

	// OPEN EDIT MODAL FOR A ZONE
	const openEditModal = (zone: PriceZoneWithCountries) => {
		setEditingZone(zone);
		setFormName(zone.name);
		setFormCode(zone.code);
		setFormMarkup(zone.markupNok);
		setFormPriority(zone.priority);
		setFormSelectedCountries([...zone.countries]);
		setFormCountrySearch("");
		setZoneModalOpen(true);
	};

	// SAVE ZONE (CREATE OR UPDATE)
	const handleSaveZone = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName.trim() || !formCode.trim()) {
			setFeedback({ type: "error", message: "Please provide both a zone name and code." });
			return;
		}

		setIsSaving(true);
		try {
			const action = editingZone ? "update" : "create";
			const payload = {
				action,
				id: editingZone?.id,
				name: formName.trim(),
				code: formCode.trim().toUpperCase(),
				markupNok: Number(formMarkup),
				priority: Number(formPriority),
				countries: formSelectedCountries,
			};

			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to save zone.");

			setFeedback({ type: "success", message: editingZone ? `Updated zone "${formName}".` : `Created zone "${formName}".` });
			setZoneModalOpen(false);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error saving zone." });
		} finally {
			setIsSaving(false);
		}
	};

	// QUICK INLINE MARKUP UPDATE
	const handleQuickMarkupSubmit = async (zone: PriceZoneWithCountries) => {
		const val = Number(quickMarkupInput);
		if (Number.isNaN(val) || val < 0) {
			setFeedback({ type: "error", message: "Please enter a valid positive markup." });
			return;
		}

		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update-markup",
					id: zone.id,
					markupNok: val,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to update markup.");

			setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, markupNok: val } : z)));
			setQuickEditId(null);
			setFeedback({ type: "success", message: `Updated markup for ${zone.name} to ${val} NOK.` });
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating markup." });
		} finally {
			setIsSaving(false);
		}
	};

	// ADD SINGLE COUNTRY TO A ZONE
	const handleAddCountryToZone = async (zoneId: string, countryCode: string) => {
		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "add-country",
					zoneId,
					country: countryCode,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to add country.");

			const countryName = COUNTRY_MAP[countryCode] || countryCode;
			const targetZone = zones.find((z) => z.id === zoneId);
			setFeedback({ type: "success", message: `Added ${countryName} (${countryCode}) to "${targetZone?.name || 'zone'}".` });
			setActiveAddCountryZoneId(null);
			setAddCountrySearch("");
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error adding country." });
		} finally {
			setIsSaving(false);
		}
	};

	// REMOVE COUNTRY FROM A ZONE
	const handleRemoveCountry = async (zoneId: string, countryCode: string) => {
		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "remove-country",
					zoneId,
					country: countryCode,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to remove country.");

			const countryName = COUNTRY_MAP[countryCode] || countryCode;
			setFeedback({ type: "success", message: `Removed ${countryName} (${countryCode}) from zone.` });
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error removing country." });
		} finally {
			setIsSaving(false);
		}
	};

	// MOVE COUNTRY TO TARGET ZONE
	const handleMoveCountrySubmit = async () => {
		if (!countryToMove || !moveTargetZoneId) return;
		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "move-country",
					country: countryToMove,
					targetZoneId: moveTargetZoneId,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to move country.");

			const countryName = COUNTRY_MAP[countryToMove] || countryToMove;
			const targetZone = zones.find((z) => z.id === moveTargetZoneId);
			setFeedback({ type: "success", message: `Moved ${countryName} to "${targetZone?.name || 'group'}".` });
			setMoveCountryModalOpen(false);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error moving country." });
		} finally {
			setIsSaving(false);
		}
	};

	// CREATE QUICK SINGLE-COUNTRY ZONE
	const handleCreateSingleCountryZone = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!singleCountryCode) {
			setFeedback({ type: "error", message: "Please select a country." });
			return;
		}

		const countryName = COUNTRY_MAP[singleCountryCode] || singleCountryCode;
		const code = `ZONE_${singleCountryCode.toUpperCase()}`;
		const markup = Number(singleCountryMarkup);

		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create",
					name: countryName,
					code,
					markupNok: markup,
					priority: zones.length,
					countries: [singleCountryCode],
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create dedicated zone.");

			setFeedback({ type: "success", message: `Created single-country zone for ${countryName} with +${markup} NOK markup.` });
			setSingleCountryModalOpen(false);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error creating zone." });
		} finally {
			setIsSaving(false);
		}
	};

	// BULK UPDATE MARKUP SUBMIT
	const handleBulkMarkupSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const amount = Number(bulkAmount);
		if (Number.isNaN(amount)) {
			setFeedback({ type: "error", message: "Please enter a valid amount." });
			return;
		}

		setIsSaving(true);
		try {
			const res = await fetch("/api/admin/pricing-zones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "bulk-update-markup",
					zoneIds: selectedZoneIds,
					mode: bulkMode,
					amount,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to update markups.");

			setFeedback({ type: "success", message: `Updated markups for ${selectedZoneIds.length} zone(s).` });
			setBulkMarkupModalOpen(false);
			setSelectedZoneIds([]);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating markups." });
		} finally {
			setIsSaving(false);
		}
	};

	// MERGE ZONES SUBMIT
	const handleMergeSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!mergeTargetZoneId || mergeSourceZoneIds.length === 0) {
			setFeedback({ type: "error", message: "Please select target group to merge into." });
			return;
		}

		setIsSaving(true);
		try {
			for (const sourceId of mergeSourceZoneIds) {
				if (sourceId === mergeTargetZoneId) continue;
				const res = await fetch("/api/admin/pricing-zones", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "merge-zones",
						sourceZoneId: sourceId,
						targetZoneId: mergeTargetZoneId,
						deleteSource: mergeDeleteSource,
					}),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed during zone merge.");
			}

			const targetZone = zones.find((z) => z.id === mergeTargetZoneId);
			setFeedback({ type: "success", message: `Merged ${mergeSourceZoneIds.length} zone(s) into "${targetZone?.name || 'group'}".` });
			setMergeModalOpen(false);
			setSelectedZoneIds([]);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error merging zones." });
		} finally {
			setIsSaving(false);
		}
	};

	// DELETE ZONE(S) SUBMIT
	const handleDeleteSubmit = async () => {
		if (zonesToDelete.length === 0) return;
		setIsSaving(true);
		try {
			if (zonesToDelete.length === 1) {
				const res = await fetch("/api/admin/pricing-zones", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "delete",
						zoneId: zonesToDelete[0].id,
					}),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to delete zone.");
				setFeedback({ type: "success", message: `Deleted zone "${zonesToDelete[0].name}".` });
			} else {
				const res = await fetch("/api/admin/pricing-zones", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						action: "bulk-delete",
						zoneIds: zonesToDelete.map((z) => z.id),
					}),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to delete zones.");
				setFeedback({ type: "success", message: `Deleted ${zonesToDelete.length} zones.` });
			}

			setDeleteModalOpen(false);
			setSelectedZoneIds((prev) => prev.filter((id) => !zonesToDelete.some((z) => z.id === id)));
			setZonesToDelete([]);
			await refreshData();
		} catch (err) {
			setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error deleting zones." });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<AdminPageHeader
				title="Pricing Zones"
				description="Configure country pricing zones and fixed markup amounts added to base product prices for international shoppers."
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={openCreateModal}
							className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48]"
						>
							<Plus className="h-4 w-4" />
							New Pricing Zone
						</button>
						<button
							type="button"
							onClick={() => {
								setSingleCountryCode(unassignedCountries[0]?.code || SHIPPING_COUNTRIES[0].code);
								setSingleCountryMarkup(250);
								setSingleCountryModalOpen(true);
							}}
							className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
						>
							<Globe className="h-4 w-4 text-slate-500" />
							+ Single Country Zone
						</button>
						<button
							type="button"
							onClick={refreshData}
							disabled={isLoading}
							title="Refresh data"
							className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
						>
							<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-slate-900" : ""}`} />
						</button>
					</div>
				}
			/>

			{/* Feedback Notification */}
			{feedback ? (
				<div className={`flex items-center justify-between rounded-xl p-4 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
					<InlineAlert tone={feedback.type === "success" ? "success" : "error"} icon={true}>
						{feedback.message}
					</InlineAlert>
					<button
						type="button"
						onClick={() => setFeedback(null)}
						className="text-xs font-semibold underline hover:opacity-75 ml-3"
					>
						Dismiss
					</button>
				</div>
			) : null}

			{/* Metric summary strip */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pricing Zones</p>
					<p className="mt-1 text-2xl font-bold text-slate-900">{zones.length}</p>
					<p className="text-xs text-slate-400 mt-0.5">Configured groups</p>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Countries</p>
					<p className="mt-1 text-2xl font-bold text-emerald-700">
						{SHIPPING_COUNTRIES.length - unassignedCountries.length}{" "}
						<span className="text-sm font-normal text-slate-400">/ {SHIPPING_COUNTRIES.length}</span>
					</p>
					<p className="text-xs text-slate-400 mt-0.5">Covered with markup</p>
				</div>
				<div
					onClick={() => setShowUnassignedTray(!showUnassignedTray)}
					className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
				>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unassigned</p>
						<span className="text-xs font-medium text-slate-400">View</span>
					</div>
					<p className={`mt-1 text-2xl font-bold ${unassignedCountries.length > 0 ? "text-amber-600" : "text-slate-400"}`}>
						{unassignedCountries.length}
					</p>
					<p className="text-xs text-slate-400 mt-0.5">Uses fallback base price</p>
				</div>
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Markup Range</p>
					<p className="mt-1 text-2xl font-bold text-slate-900">
						{zones.length > 0
							? `${Math.min(...zones.map((z) => z.markupNok))} – ${Math.max(...zones.map((z) => z.markupNok))} NOK`
							: "0 NOK"}
					</p>
					<p className="text-xs text-slate-400 mt-0.5">Added per product</p>
				</div>
			</div>

			{/* Unassigned Countries Tray (Collapsible) */}
			{showUnassignedTray || unassignedCountries.length > 0 ? (
				<div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<div className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
							<div>
								<h3 className="text-sm font-semibold text-amber-900">
									{unassignedCountries.length} Unassigned Shipping {unassignedCountries.length === 1 ? "Country" : "Countries"}
								</h3>
								<p className="text-xs text-amber-700">
									These countries are available for checkout but have no markup zone assigned (they purchase at default base price).
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowUnassignedTray(!showUnassignedTray)}
								className="text-xs font-semibold text-amber-900 underline hover:text-amber-700"
							>
								{showUnassignedTray ? "Hide list" : "Show list"}
							</button>
						</div>
					</div>

					{showUnassignedTray ? (
						<div className="mt-4 pt-3 border-t border-amber-200/80">
							<p className="text-xs font-medium text-amber-900 mb-2">Quickly assign into an existing group:</p>
							<div className="flex flex-wrap gap-2">
								{unassignedCountries.map((c) => (
									<div
										key={c.code}
										className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs"
									>
										<span className="font-semibold text-slate-900">{c.code}</span>
										<span className="text-slate-600">{c.name}</span>
										{zones.length > 0 ? (
											<select
												aria-label={`Assign ${c.name} to pricing zone`}
												defaultValue=""
												onChange={(e) => {
													if (e.target.value) {
														handleAddCountryToZone(e.target.value, c.code);
													}
												}}
												className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:bg-white focus:outline-none"
											>
												<option value="" disabled>
													+ Add to group...
												</option>
												{zones.map((z) => (
													<option key={z.id} value={z.id}>
														{z.name} (+{z.markupNok} NOK)
													</option>
												))}
											</select>
										) : null}
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>
			) : null}

			{/* Search, Filter & Bulk Selection Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by zone, code, or country (e.g. Germany, NO, ZONE_1)..."
						className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
					/>
					{searchQuery ? (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
						>
							Clear
						</button>
					) : null}
				</div>

				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
						<input
							type="checkbox"
							checked={filteredZones.length > 0 && selectedZoneIds.length === filteredZones.length}
							onChange={toggleSelectAll}
							className="rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
						/>
						<span>Select all ({filteredZones.length})</span>
					</label>
					<span className="text-slate-300">|</span>
					<span className="text-xs text-slate-500">
						Showing {filteredZones.length} of {zones.length} zones
					</span>
				</div>
			</div>

			{/* Floating / Sticky Bulk Action Bar */}
			{selectedZoneIds.length > 0 ? (
				<div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-white shadow-xl">
					<div className="flex items-center gap-2">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
							{selectedZoneIds.length}
						</span>
						<span className="text-sm font-medium">
							{selectedZoneIds.length} {selectedZoneIds.length === 1 ? "zone" : "zones"} selected
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setBulkMode("fixed");
								setBulkAmount(50);
								setBulkMarkupModalOpen(true);
							}}
							className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
						>
							<Percent className="h-3.5 w-3.5" />
							Adjust Markups in Bulk
						</button>

						{selectedZoneIds.length >= 2 ? (
							<button
								type="button"
								onClick={() => {
									setMergeSourceZoneIds(selectedZoneIds);
									setMergeTargetZoneId(selectedZoneIds[0]);
									setMergeDeleteSource(true);
									setMergeModalOpen(true);
								}}
								className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
							>
								<Layers className="h-3.5 w-3.5" />
								Merge Selected ({selectedZoneIds.length})
							</button>
						) : null}

						<button
							type="button"
							onClick={() => {
								const targets = zones.filter((z) => selectedZoneIds.includes(z.id));
								setZonesToDelete(targets);
								setDeleteModalOpen(true);
							}}
							className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Delete Selected
						</button>

						<button
							type="button"
							onClick={() => setSelectedZoneIds([])}
							className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
						>
							Clear selection
						</button>
					</div>
				</div>
			) : null}

			{/* Zone Cards List */}
			<div className="grid gap-4">
				{filteredZones.map((zone) => {
					const isSelected = selectedZoneIds.includes(zone.id);
					const isQuickEditing = quickEditId === zone.id;
					const isAddCountryOpen = activeAddCountryZoneId === zone.id;

					return (
						<div
							key={zone.id}
							className={`rounded-2xl border transition bg-white p-5 shadow-sm ${isSelected ? "border-[#1B365D] ring-2 ring-[#1B365D]/10" : "border-slate-200 hover:border-slate-300"}`}
						>
							{/* Card Top Row: Checkbox, Name, Code, Markup & Actions */}
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
								<div className="flex items-start gap-3">
									<input
										type="checkbox"
										checked={isSelected}
										onChange={() => toggleSelectZone(zone.id)}
										className="mt-1 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
										aria-label={`Select ${zone.name}`}
									/>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-base font-semibold text-slate-900">{zone.name}</h3>
											<span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
												{zone.code}
											</span>
											<span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
												Priority {zone.priority}
											</span>
										</div>
										<p className="text-xs text-slate-500 mt-0.5">
											{zone.countries.length} {zone.countries.length === 1 ? "country" : "countries"} assigned
										</p>
									</div>
								</div>

								{/* Right Side: Markup & Action Buttons */}
								<div className="flex flex-wrap items-center gap-2">
									{/* Inline Quick Markup */}
									{isQuickEditing ? (
										<div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-300">
											<span className="text-xs font-semibold text-slate-600 pl-2">+</span>
											<input
												type="number"
												min="0"
												step="1"
												value={quickMarkupInput}
												onChange={(e) => setQuickMarkupInput(e.target.value)}
												className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
												placeholder="NOK"
												autoFocus
											/>
											<span className="text-xs font-semibold text-slate-600 pr-1">NOK</span>
											<button
												type="button"
												onClick={() => handleQuickMarkupSubmit(zone)}
												disabled={isSaving}
												className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700"
												title="Save markup"
											>
												<Check className="h-3.5 w-3.5" />
											</button>
											<button
												type="button"
												onClick={() => setQuickEditId(null)}
												className="rounded p-1 text-slate-500 hover:bg-slate-200"
												title="Cancel"
											>
												<X className="h-3.5 w-3.5" />
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => {
												setQuickEditId(zone.id);
												setQuickMarkupInput(String(zone.markupNok));
											}}
											title="Click to quickly edit markup"
											className="group flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
										>
											<span>+{zone.markupNok} NOK</span>
											<Pencil className="h-3 w-3 opacity-50 group-hover:opacity-100" />
										</button>
									)}

									{/* Edit Zone Details button */}
									<button
										type="button"
										onClick={() => openEditModal(zone)}
										className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
									>
										<Pencil className="h-3.5 w-3.5 text-slate-500" />
										Edit
									</button>

									{/* Merge single zone into existing group button */}
									{zones.length > 1 ? (
										<button
											type="button"
											onClick={() => {
												setMergeSourceZoneIds([zone.id]);
												const otherZone = zones.find((z) => z.id !== zone.id);
												setMergeTargetZoneId(otherZone?.id || "");
												setMergeDeleteSource(true);
												setMergeModalOpen(true);
											}}
											className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
											title="Merge this zone into another group"
										>
											<ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
											Merge into...
										</button>
									) : null}

									{/* Delete zone button */}
									<button
										type="button"
										onClick={() => {
											setZonesToDelete([zone]);
											setDeleteModalOpen(true);
										}}
										className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white p-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:border-red-300"
										title="Delete zone"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>

							{/* Card Bottom Row: Assigned Countries List & Quick Add */}
							<div className="pt-3">
								<div className="flex flex-wrap items-center gap-1.5">
									{zone.countries.map((countryCode) => {
										const countryName = COUNTRY_MAP[countryCode] || countryCode;
										return (
											<span
												key={countryCode}
												className="group relative inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
											>
												<span className="font-semibold">{countryCode}</span>
												<span className="text-slate-500 hidden sm:inline">{countryName}</span>

												{/* Quick move country trigger */}
												{zones.length > 1 ? (
													<button
														type="button"
														onClick={() => {
															setCountryToMove(countryCode);
															const otherZone = zones.find((z) => z.id !== zone.id);
															setMoveTargetZoneId(otherZone?.id || "");
															setMoveCountryModalOpen(true);
														}}
														title={`Move ${countryName} to another group`}
														className="text-slate-400 hover:text-slate-800 ml-0.5"
													>
														<ArrowRightLeft className="h-2.5 w-2.5" />
													</button>
												) : null}

												{/* Remove country button */}
												<button
													type="button"
													onClick={() => handleRemoveCountry(zone.id, countryCode)}
													title={`Remove ${countryName} from ${zone.name}`}
													className="text-slate-400 hover:text-red-600 ml-0.5"
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										);
									})}

									{zone.countries.length === 0 ? (
										<span className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-2.5 py-1 text-xs text-amber-800 font-medium">
											Empty group: click "+ Add Country" to assign countries
										</span>
									) : null}

									{/* "+ Add Country" button with inline dropdown picker */}
									<div className="relative inline-block">
										<button
											type="button"
											onClick={() => {
												setActiveAddCountryZoneId(isAddCountryOpen ? null : zone.id);
												setAddCountrySearch("");
											}}
											className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
										>
											<Plus className="h-3 w-3 text-slate-500" />
											Add Country
										</button>

										{/* Searchable Add Country Popover */}
										{isAddCountryOpen ? (
											<div className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl">
												<div className="flex items-center justify-between pb-2 border-b border-slate-100">
													<p className="text-xs font-semibold text-slate-800">Add to {zone.name}</p>
													<button
														type="button"
														onClick={() => setActiveAddCountryZoneId(null)}
														className="text-slate-400 hover:text-slate-600"
													>
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
												<div className="pt-2">
													<input
														type="text"
														value={addCountrySearch}
														onChange={(e) => setAddCountrySearch(e.target.value)}
														placeholder="Filter country name or code..."
														className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
														autoFocus
													/>
												</div>
												<div className="mt-2 max-h-48 overflow-y-auto space-y-1">
													{SHIPPING_COUNTRIES.filter((c) => {
														if (zone.countries.includes(c.code)) return false;
														if (!addCountrySearch.trim()) return true;
														const q = addCountrySearch.toLowerCase();
														return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
													}).map((c) => {
														const currentZone = countryToZoneMap[c.code];
														return (
															<button
																key={c.code}
																type="button"
																onClick={() => handleAddCountryToZone(zone.id, c.code)}
																className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-slate-100"
															>
																<span className="font-medium text-slate-800">
																	{c.code} — {c.name}
																</span>
																{currentZone ? (
																	<span className="text-[10px] text-amber-600 font-medium">
																		Moves from {currentZone.name}
																	</span>
																) : (
																	<span className="text-[10px] text-emerald-600 font-medium">
																		Unassigned
																	</span>
																)}
															</button>
														);
													})}
												</div>
											</div>
										) : null}
									</div>
								</div>
							</div>
						</div>
					);
				})}

				{filteredZones.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
						<Globe className="mx-auto h-10 w-10 text-slate-400" />
						<h3 className="mt-2 text-base font-semibold text-slate-900">No pricing zones found</h3>
						<p className="mt-1 text-sm text-slate-500">
							{searchQuery ? "Try searching for a different term." : "Create your first pricing zone to get started."}
						</p>
						<button
							type="button"
							onClick={openCreateModal}
							className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48]"
						>
							<Plus className="h-4 w-4" />
							Create Zone
						</button>
					</div>
				) : null}
			</div>

			{/* ========================================================================= */}
			{/* MODAL 1: CREATE / EDIT FULL ZONE MODAL                                     */}
			{/* ========================================================================= */}
			<Dialog open={zoneModalOpen} onClose={() => setZoneModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-slate-900">
							{editingZone ? `Edit Zone: ${editingZone.name}` : "Create New Pricing Zone"}
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<form onSubmit={handleSaveZone} className="mt-4 space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
									Zone Name
								</label>
								<input
									type="text"
									required
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									placeholder="e.g. Nordics & Nearby"
									className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-slate-500 focus:outline-none"
								/>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
									Zone Code (Unique)
								</label>
								<input
									type="text"
									required
									value={formCode}
									onChange={(e) => setFormCode(e.target.value.toUpperCase())}
									placeholder="e.g. ZONE_1"
									className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-slate-500 focus:outline-none"
								/>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
									Markup (NOK)
								</label>
								<input
									type="number"
									required
									min="0"
									step="1"
									value={formMarkup}
									onChange={(e) => setFormMarkup(e.target.value)}
									placeholder="e.g. 280"
									className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-slate-500 focus:outline-none"
								/>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
									Priority (Order)
								</label>
								<input
									type="number"
									value={formPriority}
									onChange={(e) => setFormPriority(e.target.value)}
									placeholder="0"
									className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-slate-500 focus:outline-none"
								/>
							</div>
						</div>

						{/* Countries checklist */}
						<div className="pt-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
									Assigned Countries ({formSelectedCountries.length})
								</label>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => {
											const unassignedCodes = unassignedCountries.map((c) => c.code);
											setFormSelectedCountries((prev) => Array.from(new Set([...prev, ...unassignedCodes])));
										}}
										className="text-xs text-[#1B365D] underline font-medium hover:opacity-80"
									>
										+ Select all unassigned
									</button>
									<span className="text-slate-300">|</span>
									<button
										type="button"
										onClick={() => setFormSelectedCountries([])}
										className="text-xs text-slate-500 underline hover:text-slate-700"
									>
										Clear all
									</button>
								</div>
							</div>

							<div className="mt-2">
								<input
									type="text"
									value={formCountrySearch}
									onChange={(e) => setFormCountrySearch(e.target.value)}
									placeholder="Filter countries..."
									className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
								/>
							</div>

							<div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
								{SHIPPING_COUNTRIES.filter((c) => {
									if (!formCountrySearch.trim()) return true;
									const q = formCountrySearch.toLowerCase();
									return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
								}).map((c) => {
									const isChecked = formSelectedCountries.includes(c.code);
									const existingZone = countryToZoneMap[c.code];
									const isOtherZone = existingZone && existingZone.id !== editingZone?.id;

									return (
										<label
											key={c.code}
											className={`flex items-start gap-2 rounded-lg p-1.5 text-xs transition cursor-pointer select-none ${isChecked ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"}`}
										>
											<input
												type="checkbox"
												checked={isChecked}
												onChange={() => {
													setFormSelectedCountries((prev) =>
														prev.includes(c.code) ? prev.filter((item) => item !== c.code) : [...prev, c.code]
													);
												}}
												className="mt-0.5 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
											/>
											<div className="min-w-0">
												<span className="truncate block text-slate-900">
													<span className="font-bold">{c.code}</span> {c.name}
												</span>
												{isOtherZone ? (
													<span className="text-[10px] text-amber-600 block leading-tight">
														In {existingZone.name}
													</span>
												) : null}
											</div>
										</label>
									);
								})}
							</div>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setZoneModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48] disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								{editingZone ? "Save Changes" : "Create Zone"}
							</button>
						</div>
					</form>
				</div>
			</Dialog>

			{/* ========================================================================= */}
			{/* MODAL 2: QUICK SINGLE-COUNTRY ZONE MODAL                                  */}
			{/* ========================================================================= */}
			<Dialog open={singleCountryModalOpen} onClose={() => setSingleCountryModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-slate-900">
							Create Single-Country Dedicated Zone
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<form onSubmit={handleCreateSingleCountryZone} className="mt-4 space-y-4">
						<p className="text-xs text-slate-500">
							Easily create a standalone zone dedicated to a specific country with its own individual markup.
						</p>

						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								Choose Country
							</label>
							<select
								value={singleCountryCode}
								onChange={(e) => setSingleCountryCode(e.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
							>
								{SHIPPING_COUNTRIES.map((c) => {
									const existing = countryToZoneMap[c.code];
									return (
										<option key={c.code} value={c.code}>
											{c.name} ({c.code}) {existing ? `— currently in ${existing.name}` : "— [Unassigned]"}
										</option>
									);
								})}
							</select>
						</div>

						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								Markup (NOK)
							</label>
							<input
								type="number"
								required
								min="0"
								step="1"
								value={singleCountryMarkup}
								onChange={(e) => setSingleCountryMarkup(e.target.value)}
								placeholder="e.g. 250"
								className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
							/>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setSingleCountryModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48] disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								Create Single-Country Zone
							</button>
						</div>
					</form>
				</div>
			</Dialog>

			{/* ========================================================================= */}
			{/* MODAL 3: BULK ADJUST MARKUPS MODAL                                       */}
			{/* ========================================================================= */}
			<Dialog open={bulkMarkupModalOpen} onClose={() => setBulkMarkupModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-slate-900">
							Bulk Adjust Markups ({selectedZoneIds.length} Zones Selected)
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<form onSubmit={handleBulkMarkupSubmit} className="mt-4 space-y-4">
						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								Adjustment Type
							</label>
							<div className="mt-2 grid grid-cols-3 gap-2">
								<button
									type="button"
									onClick={() => setBulkMode("fixed")}
									className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${bulkMode === "fixed" ? "border-[#1B365D] bg-[#1B365D]/5 text-[#1B365D]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
								>
									+/- Fixed NOK
								</button>
								<button
									type="button"
									onClick={() => setBulkMode("percentage")}
									className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${bulkMode === "percentage" ? "border-[#1B365D] bg-[#1B365D]/5 text-[#1B365D]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
								>
									+/- Percentage
								</button>
								<button
									type="button"
									onClick={() => setBulkMode("set")}
									className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${bulkMode === "set" ? "border-[#1B365D] bg-[#1B365D]/5 text-[#1B365D]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
								>
									Set Exact NOK
								</button>
							</div>
						</div>

						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								{bulkMode === "fixed" && "Amount to Add/Subtract (e.g. +50 or -30 NOK)"}
								{bulkMode === "percentage" && "Percentage Change (e.g. 10 for +10%, -5 for -5%)"}
								{bulkMode === "set" && "Exact Fixed Markup Amount (NOK)"}
							</label>
							<input
								type="number"
								required
								value={bulkAmount}
								onChange={(e) => setBulkAmount(e.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
							/>
						</div>

						{/* Live Preview of Changes */}
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs font-semibold text-slate-700 mb-2">Live Preview:</p>
							<div className="max-h-36 overflow-y-auto space-y-1 text-xs">
								{zones
									.filter((z) => selectedZoneIds.includes(z.id))
									.map((z) => {
										const amt = Number(bulkAmount) || 0;
										let next = z.markupNok;
										if (bulkMode === "fixed") next = Math.max(0, z.markupNok + amt);
										else if (bulkMode === "percentage") next = Math.max(0, Math.round(z.markupNok * (1 + amt / 100)));
										else if (bulkMode === "set") next = Math.max(0, amt);

										return (
											<div key={z.id} className="flex items-center justify-between py-0.5 border-b border-slate-200/50">
												<span className="font-medium text-slate-800">{z.name}</span>
												<span>
													<span className="text-slate-400 line-through mr-1.5">{z.markupNok} NOK</span>
													<span className="font-bold text-emerald-700">{next} NOK</span>
												</span>
											</div>
										);
									})}
							</div>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setBulkMarkupModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48] disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								Apply to {selectedZoneIds.length} Zones
							</button>
						</div>
					</form>
				</div>
			</Dialog>

			{/* ========================================================================= */}
			{/* MODAL 4: MERGE ZONES MODAL                                               */}
			{/* ========================================================================= */}
			<Dialog open={mergeModalOpen} onClose={() => setMergeModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-slate-900">
							Merge Pricing Zones
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<form onSubmit={handleMergeSubmit} className="mt-4 space-y-4">
						<p className="text-xs text-slate-600">
							Combine countries from{" "}
							<span className="font-bold text-slate-900">
								{zones
									.filter((z) => mergeSourceZoneIds.includes(z.id))
									.map((z) => z.name)
									.join(", ")}
							</span>{" "}
							into an existing target group.
						</p>

						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								Select Target Group to Merge Into
							</label>
							<select
								value={mergeTargetZoneId}
								onChange={(e) => setMergeTargetZoneId(e.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
							>
								{zones.map((z) => (
									<option key={z.id} value={z.id}>
										{z.name} ({z.code}) — +{z.markupNok} NOK
									</option>
								))}
							</select>
						</div>

						<label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-2">
							<input
								type="checkbox"
								checked={mergeDeleteSource}
								onChange={(e) => setMergeDeleteSource(e.target.checked)}
								className="rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
							/>
							<span>Delete empty source zone(s) after moving countries</span>
						</label>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setMergeModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48] disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								Confirm Merge
							</button>
						</div>
					</form>
				</div>
			</Dialog>

			{/* ========================================================================= */}
			{/* MODAL 5: MOVE SINGLE COUNTRY MODAL                                       */}
			{/* ========================================================================= */}
			<Dialog open={moveCountryModalOpen} onClose={() => setMoveCountryModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-slate-900">
							Move {COUNTRY_MAP[countryToMove] || countryToMove} ({countryToMove})
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<div className="mt-4 space-y-4">
						<p className="text-xs text-slate-600">
							Reassign this country to a different pricing zone group:
						</p>

						<div>
							<label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
								Destination Group
							</label>
							<select
								value={moveTargetZoneId}
								onChange={(e) => setMoveTargetZoneId(e.target.value)}
								className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none"
							>
								{zones.map((z) => (
									<option key={z.id} value={z.id}>
										{z.name} (+{z.markupNok} NOK)
									</option>
								))}
							</select>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setMoveCountryModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleMoveCountrySubmit}
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a48] disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								Move Country
							</button>
						</div>
					</div>
				</div>
			</Dialog>

			{/* ========================================================================= */}
			{/* MODAL 6: DELETE CONFIRMATION MODAL                                       */}
			{/* ========================================================================= */}
			<Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
				<div className="p-6">
					<div className="flex items-center justify-between pb-4 border-b border-slate-200">
						<DialogTitle className="text-lg font-semibold text-red-600">
							Delete Pricing Zone{zonesToDelete.length > 1 ? "s" : ""}
						</DialogTitle>
						<DialogClose className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" />
					</div>

					<div className="mt-4 space-y-3">
						<p className="text-sm text-slate-700">
							Are you sure you want to delete {zonesToDelete.length === 1 ? `"${zonesToDelete[0]?.name}"` : `${zonesToDelete.length} zones`}?
						</p>
						<p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl">
							Countries assigned to {zonesToDelete.length === 1 ? "this zone" : "these zones"} will become unassigned and will automatically purchase at the standard fallback base price (0 markup).
						</p>

						<div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
							<button
								type="button"
								onClick={() => setDeleteModalOpen(false)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteSubmit}
								disabled={isSaving}
								className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
								Delete Zone{zonesToDelete.length > 1 ? "s" : ""}
							</button>
						</div>
					</div>
				</div>
			</Dialog>
		</div>
	);
}

