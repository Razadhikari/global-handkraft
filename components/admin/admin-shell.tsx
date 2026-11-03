"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, FileBarChart2, Tags, Star, Quote, Settings, Menu, X, LogOut, Store, ChevronDown, Landmark, CreditCard, Truck, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_CUSTOM_REQUESTS_TOPIC } from "@/lib/realtime-topics";
import { SkipLink } from "@/components/skip-link";
import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
	{ href: "/admin/categories", label: "Categories", icon: Tags },
	{ href: "/admin/products", label: "Products", icon: Package },
	{ href: "/admin/shipping-rates", label: "Shipping Rates", icon: Truck },
	{ href: "/admin/settings/pricing-zones", label: "Pricing Zones", icon: Globe },
	{ href: "/admin/orders", label: "Orders", icon: ShoppingCart },
	{ href: "/admin/custom-requests", label: "Custom Orders", icon: Landmark },
	{ href: "/admin/stripe", label: "Stripe", icon: CreditCard },
	{ href: "/admin/reviews", label: "Reviews", icon: Star },
	{ href: "/admin/testimonials", label: "Testimonials", icon: Quote },
	{ href: "/admin/reports", label: "Reports", icon: FileBarChart2 },
	// { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
	return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(email: string) {
	return email.slice(0, 2).toUpperCase();
}

function useCustomRequestCount() {
	const [supabase] = useState(() => createClient());
	const [count, setCount] = useState<{ total: number; pending: number } | null>(null);

	useEffect(() => {
		let active = true;

		fetch("/api/admin/mandap-inquiries/count")
			.then((response) => response.json())
			.then((data: { total?: number; pending?: number }) => {
				if (active && typeof data.total === "number" && typeof data.pending === "number") {
					setCount({ total: data.total, pending: data.pending });
				}
			})
			.catch(() => {
				// Silently fail - the badge is optional
			});

		const channel = supabase
			.channel(ADMIN_CUSTOM_REQUESTS_TOPIC, { config: { private: true } })
			.on("broadcast", { event: "count" }, ({ payload }) => {
				if (active && typeof payload?.total === "number" && typeof payload?.pending === "number") {
					setCount({ total: payload.total, pending: payload.pending });
				}
			})
			.subscribe();

		return () => {
			active = false;
			supabase.removeChannel(channel);
		};
	}, [supabase]);

	return count;
}

function SidebarNav({ pathname, onNavigate, customRequestCount }: { pathname: string; onNavigate?: () => void; customRequestCount: { total: number; pending: number } | null }) {
	return (
		<nav className="flex-1 space-y-1 px-3 py-4">
			{NAV_ITEMS.map((item) => {
				const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
				const Icon = item.icon;
				const showBadge = item.href === "/admin/custom-requests" && customRequestCount && customRequestCount.total > 0;
				return (
					<Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
						<span className={`h-5 w-0.5 shrink-0 -ml-3 rounded-r-full transition ${active ? "bg-stone-500" : "bg-transparent"}`} aria-hidden="true" />
						<Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-stone-700" : "text-slate-600 group-hover:text-slate-200"}`} />
						<span className="flex-1">{item.label}</span>
						{showBadge ? (
							<span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
								{customRequestCount.pending}/{customRequestCount.total}
							</span>
						) : null}
					</Link>
				);
			})}
		</nav>
	);
}

export function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [supabase] = useState(() => createClient());
	const customRequestCount = useCustomRequestCount();

	const currentSection = NAV_ITEMS.find((item) => isActive(pathname, item.href, "exact" in item ? item.exact : false));

	const handleSignOut = async () => {
		await fetch("/api/auth/signout", { method: "POST" });
		router.push("/");
		router.refresh();
	};

	return (
		<div className="flex min-h-screen bg-slate-50 text-slate-900">
			<SkipLink />
			{/* Desktop sidebar */}
			<aside className="hidden w-64 shrink-0 flex-col bg-[#1B365D] lg:flex">
				<div className="flex items-center gap-2.5 px-5 py-5">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
						<img src="/images/globalhandicraft-logo.png" alt="" className="h-8 w-8 scale-125 object-contain" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold leading-tight text-white">Global Handcrafts</p>
						<p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-700">Admin</p>
					</div>
				</div>
				<SidebarNav pathname={pathname} customRequestCount={customRequestCount} />
				<div className="border-t border-white/10 p-3">
					<Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
						<Store className="h-4.5 w-4.5 text-slate-600" />
						View store
					</Link>
				</div>
			</aside>

			{/* Mobile sidebar */}
			<Dialog open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} variant="drawer-left" className="w-64 max-w-none bg-[#1B365D] lg:hidden">
				<div className="flex items-center justify-between gap-2.5 px-5 py-5">
					<div className="flex min-w-0 items-center gap-2.5">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
							<img src="/images/globalhandicraft-logo.png" alt="" className="h-8 w-8 scale-125 object-contain" />
						</div>
						<div className="min-w-0">
							<DialogTitle className="truncate text-sm font-semibold leading-tight text-white">Global Handcrafts</DialogTitle>
							<p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-700">Admin</p>
						</div>
					</div>
					<DialogClose label="Close navigation" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
						<X className="h-5 w-5" />
					</DialogClose>
				</div>
				<SidebarNav pathname={pathname} onNavigate={() => setMobileNavOpen(false)} customRequestCount={customRequestCount} />
				<div className="border-t border-white/10 p-3">
					<Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileNavOpen(false)}>
						<Store className="h-4.5 w-4.5 text-slate-600" />
						View store
					</Link>
				</div>
			</Dialog>

			{/* Main column */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
					<button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden" aria-label="Open navigation">
						<Menu className="h-5 w-5" />
					</button>
					<p className="truncate text-sm font-medium text-slate-500">
						Admin <span className="mx-1.5 text-slate-300">/</span> <span className="text-slate-900">{currentSection?.label ?? ""}</span>
					</p>
					<div className="ml-auto flex items-center gap-2">
						<Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex">
							<Store className="h-4 w-4" />
							View store
						</Link>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button type="button" className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
									<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B365D] text-xs font-semibold text-white">{getInitials(userEmail)}</span>
									<span className="hidden max-w-[10rem] truncate sm:inline">{userEmail}</span>
									<ChevronDown className="h-4 w-4 text-slate-600" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<div className="border-b border-slate-100 px-4 py-3">
									<p className="truncate text-xs text-slate-500">Signed in as</p>
									<p className="truncate text-sm font-semibold text-slate-900">{userEmail}</p>
								</div>
								<DropdownMenuItem onSelect={handleSignOut} className="text-red-600 hover:bg-red-50">
									<LogOut className="h-4 w-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>
				<main id="main-content" className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<div className="mx-auto max-w-7xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
