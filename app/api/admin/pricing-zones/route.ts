import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { invalidatePriceZoneCache } from "@/lib/price-zones";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!hasAdminRole(user)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return null;
}

export async function GET() {
	try {
		const authError = await requireAdmin();
		if (authError) return authError;

		const zones = await prisma.priceZone.findMany({
			include: { countries: true },
			orderBy: [{ priority: "asc" }, { name: "asc" }],
		});

		const formatted = zones.map((zone) => ({
			id: zone.id,
			name: zone.name,
			code: zone.code,
			markupNok: zone.markupNok,
			priority: zone.priority,
			countries: zone.countries.map((c) => c.country),
		}));

		return NextResponse.json({ zones: formatted });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load pricing zones.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const authError = await requireAdmin();
		if (authError) return authError;

		const contentType = request.headers.get("content-type") ?? "";

		// Handle JSON API requests
		if (contentType.includes("application/json")) {
			const body = await request.json();
			const action = body.action || "create";

			// 1. CREATE ZONE
			if (action === "create") {
				const name = String(body.name ?? "").trim();
				const code = String(body.code ?? "")
					.trim()
					.toUpperCase();
				const markupNok = Number(body.markupNok);
				const priority = Number(body.priority ?? 0);
				const countries: string[] = Array.isArray(body.countries)
					? body.countries.map((c: unknown) => String(c).trim().toUpperCase()).filter(Boolean)
					: [];

				if (!name || !code || Number.isNaN(markupNok) || markupNok < 0) {
					return NextResponse.json({ error: "Invalid zone details. Name, unique code, and valid markup are required." }, { status: 400 });
				}

				const existing = await prisma.priceZone.findUnique({
					where: { code },
				});
				if (existing) {
					return NextResponse.json({ error: `Zone code "${code}" already exists.` }, { status: 400 });
				}

				const createdZone = await prisma.$transaction(async (tx) => {
					// Disassociate selected countries from any other zone so they belong exclusively here
					if (countries.length > 0) {
						await tx.priceZoneCountry.deleteMany({
							where: { country: { in: countries } },
						});
					}

					return tx.priceZone.create({
						data: {
							name,
							code,
							markupNok,
							priority,
							countries: {
								create: countries.map((country) => ({ country })),
							},
						},
						include: { countries: true },
					});
				});

				invalidatePriceZoneCache();
				return NextResponse.json({
					success: true,
					zone: {
						id: createdZone.id,
						name: createdZone.name,
						code: createdZone.code,
						markupNok: createdZone.markupNok,
						priority: createdZone.priority,
						countries: createdZone.countries.map((c) => c.country),
					},
				});
			}

			// 2. UPDATE INDIVIDUAL ZONE
			if (action === "update") {
				const id = String(body.id ?? "").trim();
				const name = String(body.name ?? "").trim();
				const code = String(body.code ?? "")
					.trim()
					.toUpperCase();
				const markupNok = Number(body.markupNok);
				const priority = Number(body.priority ?? 0);
				const countries: string[] | undefined = Array.isArray(body.countries)
					? body.countries.map((c: unknown) => String(c).trim().toUpperCase()).filter(Boolean)
					: undefined;

				if (!id || !name || !code || Number.isNaN(markupNok) || markupNok < 0) {
					return NextResponse.json({ error: "Missing required fields or invalid markup." }, { status: 400 });
				}

				const existing = await prisma.priceZone.findUnique({ where: { id } });
				if (!existing) {
					return NextResponse.json({ error: "Zone not found." }, { status: 404 });
				}

				// Check code conflict
				const codeConflict = await prisma.priceZone.findFirst({
					where: {
						code,
						id: { not: id },
					},
				});
				if (codeConflict) {
					return NextResponse.json({ error: `Zone code "${code}" is already in use by another zone.` }, { status: 400 });
				}

				const updatedZone = await prisma.$transaction(async (tx) => {
					await tx.priceZone.update({
						where: { id },
						data: {
							name,
							code,
							markupNok,
							priority,
						},
					});

					if (countries !== undefined) {
						// Remove previous country links for this zone
						await tx.priceZoneCountry.deleteMany({ where: { zoneId: id } });
						// Remove selected countries from any other zones to prevent duplicate assignments
						if (countries.length > 0) {
							await tx.priceZoneCountry.deleteMany({ where: { country: { in: countries } } });
							await tx.priceZoneCountry.createMany({
								data: countries.map((country) => ({ zoneId: id, country })),
							});
						}
					}

					return tx.priceZone.findUnique({
						where: { id },
						include: { countries: true },
					});
				});

				invalidatePriceZoneCache();
				return NextResponse.json({
					success: true,
					zone: updatedZone
						? {
								id: updatedZone.id,
								name: updatedZone.name,
								code: updatedZone.code,
								markupNok: updatedZone.markupNok,
								priority: updatedZone.priority,
								countries: updatedZone.countries.map((c) => c.country),
							}
						: null,
				});
			}

			// 3. QUICK UPDATE MARKUP (SINGLE ZONE)
			if (action === "update-markup") {
				const id = String(body.id ?? "").trim();
				const markupNok = Number(body.markupNok);

				if (!id || Number.isNaN(markupNok) || markupNok < 0) {
					return NextResponse.json({ error: "Invalid markup amount." }, { status: 400 });
				}

				await prisma.priceZone.update({
					where: { id },
					data: { markupNok },
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, markupNok });
			}

			// 4. ADD SINGLE COUNTRY TO EXISTING GROUP/ZONE
			if (action === "add-country") {
				const zoneId = String(body.zoneId ?? "").trim();
				const country = String(body.country ?? "")
					.trim()
					.toUpperCase();

				if (!zoneId || !country) {
					return NextResponse.json({ error: "Missing zoneId or country." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					// Detach from previous zone if already assigned elsewhere
					await tx.priceZoneCountry.deleteMany({ where: { country } });
					// Attach to target zone
					await tx.priceZoneCountry.create({
						data: { zoneId, country },
					});
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, country, zoneId });
			}

			// 5. REMOVE COUNTRY FROM ZONE
			if (action === "remove-country") {
				const zoneId = String(body.zoneId ?? "").trim();
				const country = String(body.country ?? "")
					.trim()
					.toUpperCase();

				if (!zoneId || !country) {
					return NextResponse.json({ error: "Missing zoneId or country." }, { status: 400 });
				}

				await prisma.priceZoneCountry.deleteMany({
					where: { zoneId, country },
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, country, zoneId });
			}

			// 6. MOVE COUNTRY BETWEEN ZONES
			if (action === "move-country") {
				const targetZoneId = String(body.targetZoneId ?? "").trim();
				const country = String(body.country ?? "")
					.trim()
					.toUpperCase();

				if (!targetZoneId || !country) {
					return NextResponse.json({ error: "Missing targetZoneId or country." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					await tx.priceZoneCountry.deleteMany({ where: { country } });
					await tx.priceZoneCountry.create({
						data: { zoneId: targetZoneId, country },
					});
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, country, targetZoneId });
			}

			// 7. MERGE ZONES (e.g. merge single zone or source zone into an existing group)
			if (action === "merge-zones") {
				const sourceZoneId = String(body.sourceZoneId ?? "").trim();
				const targetZoneId = String(body.targetZoneId ?? "").trim();
				const deleteSource = Boolean(body.deleteSource ?? true);

				if (!sourceZoneId || !targetZoneId || sourceZoneId === targetZoneId) {
					return NextResponse.json({ error: "Invalid source or target zone." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					const sourceCountries = await tx.priceZoneCountry.findMany({
						where: { zoneId: sourceZoneId },
					});
					const countryCodes = sourceCountries.map((c) => c.country);

					if (countryCodes.length > 0) {
						// Remove duplicates from target if any exist
						await tx.priceZoneCountry.deleteMany({
							where: { zoneId: targetZoneId, country: { in: countryCodes } },
						});
						// Move source countries to target
						await tx.priceZoneCountry.updateMany({
							where: { zoneId: sourceZoneId },
							data: { zoneId: targetZoneId },
						});
					}

					if (deleteSource) {
						await tx.priceZone.delete({
							where: { id: sourceZoneId },
						});
					}
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, sourceZoneId, targetZoneId });
			}

			// 8. BULK UPDATE MARKUP (GROUP ACTION)
			if (action === "bulk-update-markup") {
				const zoneIds: string[] = Array.isArray(body.zoneIds) ? body.zoneIds : [];
				const mode: "fixed" | "percentage" | "set" = body.mode;
				const amount = Number(body.amount);

				if (zoneIds.length === 0 || Number.isNaN(amount)) {
					return NextResponse.json({ error: "No zones specified or invalid amount." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					const targetZones = await tx.priceZone.findMany({
						where: { id: { in: zoneIds } },
					});

					for (const zone of targetZones) {
						let nextMarkup = zone.markupNok;
						if (mode === "fixed") {
							nextMarkup = Math.max(0, zone.markupNok + amount);
						} else if (mode === "percentage") {
							nextMarkup = Math.max(0, Math.round(zone.markupNok * (1 + amount / 100)));
						} else if (mode === "set") {
							nextMarkup = Math.max(0, amount);
						}

						await tx.priceZone.update({
							where: { id: zone.id },
							data: { markupNok: nextMarkup },
						});
					}
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, updatedCount: zoneIds.length });
			}

			// 9. BULK DELETE ZONES
			if (action === "bulk-delete") {
				const zoneIds: string[] = Array.isArray(body.zoneIds) ? body.zoneIds : [];
				if (zoneIds.length === 0) {
					return NextResponse.json({ error: "No zones specified." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					await tx.priceZoneCountry.deleteMany({
						where: { zoneId: { in: zoneIds } },
					});
					await tx.priceZone.deleteMany({
						where: { id: { in: zoneIds } },
					});
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, deletedCount: zoneIds.length });
			}

			// 10. DELETE INDIVIDUAL ZONE
			if (action === "delete") {
				const zoneId = String(body.zoneId || body.id || "").trim();
				if (!zoneId) {
					return NextResponse.json({ error: "Missing zone ID." }, { status: 400 });
				}

				await prisma.$transaction(async (tx) => {
					await tx.priceZoneCountry.deleteMany({ where: { zoneId } });
					await tx.priceZone.delete({ where: { id: zoneId } });
				});

				invalidatePriceZoneCache();
				return NextResponse.json({ success: true, zoneId });
			}

			return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
		}

		// Fallback for HTML Form submission (backwards compatibility)
		const formData = await request.formData();
		const action = formData.get("action");
		const name = String(formData.get("name") ?? "").trim();
		const code = String(formData.get("code") ?? "")
			.trim()
			.toUpperCase();
		const markupNok = Number(formData.get("markupNok"));
		const priority = Number(formData.get("priority") ?? 0);
		const countries = formData.getAll("countries").map((c) => String(c).trim().toUpperCase());

		if (action === "delete") {
			const zoneId = String(formData.get("zoneId") ?? "").trim();
			if (!zoneId) {
				return NextResponse.json({ error: "Missing zone ID." }, { status: 400 });
			}

			await prisma.$transaction(async (tx) => {
				await tx.priceZoneCountry.deleteMany({ where: { zoneId } });
				await tx.priceZone.delete({ where: { id: zoneId } });
			});

			invalidatePriceZoneCache();
			return NextResponse.redirect(new URL("/admin/settings/pricing-zones", request.url));
		}

		if (!name || !code || Number.isNaN(markupNok) || markupNok < 0) {
			return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
		}

		const existing = await prisma.priceZone.findUnique({ where: { code } });
		if (existing) {
			return NextResponse.json({ error: "Zone code already exists." }, { status: 400 });
		}

		await prisma.$transaction(async (tx) => {
			if (countries.length > 0) {
				await tx.priceZoneCountry.deleteMany({ where: { country: { in: countries } } });
			}
			await tx.priceZone.create({
				data: {
					name,
					code,
					markupNok,
					priority,
					countries: {
						create: countries.map((country) => ({ country })),
					},
				},
			});
		});

		invalidatePriceZoneCache();
		return NextResponse.redirect(new URL("/admin/settings/pricing-zones", request.url));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to process pricing zone request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const authError = await requireAdmin();
		if (authError) return authError;

		const { searchParams } = new URL(request.url);
		let zoneId = searchParams.get("id");

		if (!zoneId) {
			try {
				const body = await request.json();
				zoneId = body.zoneId || body.id;
			} catch {
				// No body
			}
		}

		if (!zoneId) {
			return NextResponse.json({ error: "Missing zone ID." }, { status: 400 });
		}

		await prisma.$transaction(async (tx) => {
			await tx.priceZoneCountry.deleteMany({ where: { zoneId } });
			await tx.priceZone.delete({ where: { id: zoneId } });
		});

		invalidatePriceZoneCache();
		return NextResponse.json({ success: true, zoneId });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete pricing zone.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
