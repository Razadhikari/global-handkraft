"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";
import { SiteFooter } from "@/components/site-footer";
import { useProductsCatalog } from "@/lib/products-catalog";
import { HomeCategoryProductsSection } from "@/components/home-category-products-section";
import { useCategoriesCatalog } from "@/lib/categories-catalog";
import { useTestimonialsCatalog, type PublicTestimonial } from "@/lib/testimonials-catalog";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { HeroSection } from "@/components/hero-section";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ProductImage } from "@/components/ui/product-image";
import { ProductPrice } from "@/components/product-price";

function TestimonialCard({ item }: { item: PublicTestimonial }) {
	return (
		<div className="group flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star key={i} className={`h-4 w-4 ${i < item.rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-stone-300"}`} />
					))}
					<span className="ml-1.5 text-xs font-medium text-stone-700">{item.rating.toFixed(1)}</span>
				</div>
				<span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 flex items-center gap-1">
					<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
					</svg>
					Verified Purchase
				</span>
			</div>
			<p className="mt-4 flex-1 text-sm leading-7 text-stone-700">“{item.quote}”</p>
			<div className="mt-5 flex items-center gap-3 border-t border-stone-200 pt-4">
				{item.image ? <Image src={item.image} alt={item.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-stone-100" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-700 ring-2 ring-stone-100">{item.name.charAt(0).toUpperCase()}</div>}
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-stone-900 text-sm">{item.name}</p>
					<p className="text-xs text-stone-700 flex items-center gap-1">
						<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Verified Customer
					</p>
				</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	const products = useProductsCatalog();
	const categories = useCategoriesCatalog();
	const testimonials = useTestimonialsCatalog();
	const categoriesWithProducts = categories.filter((category) => category.productCount > 0);
	const featuredProducts = (products.filter((product) => product.featured).length > 0 ? products.filter((product) => product.featured) : products).slice(0, 4);
	const highlightedCategories = categoriesWithProducts;
	const templeCategory = categories.find((category) => /temple/i.test(category.name) || /temple/i.test(category.slug));
	const secondaryCtaHref = templeCategory ? `/shop?category=${encodeURIComponent(templeCategory.slug)}` : "/shop";
	const secondaryCtaLabel = templeCategory ? "Explore Temples" : "Explore Collections";
	const mandapCategory = categories.find((category) => /mandap/i.test(category.name) || /mandap/i.test(category.slug));
	const mandapProducts = mandapCategory ? products.filter((product) => product.categorySlug === mandapCategory.slug) : [];
	const mandapCtaHref = mandapProducts[0] ? `/product/${mandapProducts[0].slug}` : "/contact";
	const dynamicCategorySections = highlightedCategories
		.filter((category) => category.slug !== mandapCategory?.slug)
		.map((category) => {
			return {
				title: category.name,
				href: `/shop?category=${encodeURIComponent(category.slug)}`,
				products: products.filter((product) => product.categorySlug === category.slug).slice(0, 4),
			};
		});
	const categoryHighlights = categoriesWithProducts.map((category) => {
		const matchedProducts = products.filter((product) => product.categorySlug === category.slug);
		return {
			label: category.name,
			slug: category.slug,
			count: category.productCount,
			previewImage: category.imageUrl ?? matchedProducts[0]?.image ?? "/images/temple-1.webp",
		};
	});
	const reviewFacts = [
		{ label: "Avg. satisfaction", value: "4.9/5" },
		{ label: "Repeat customers", value: "95%" },
		{ label: "On-time deliveries", value: "99%" },
	];
	const [email, setEmail] = useState("");
	const [subscribing, setSubscribing] = useState(false);
	const [buying, setBuying] = useState(false);
	const [newsletterMessage, setNewsletterMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

	const perPage = 2;
	const pageCount = Math.ceil(testimonials.length / perPage);
	const showSlider = testimonials.length > perPage;
	const [page, setPage] = useState(0);

	const goPrev = () => setPage((p) => Math.max(p - 1, 0));
	const goNext = () => setPage((p) => Math.min(p + 1, pageCount - 1));

	const handleSubscribers = async () => {
		if (!email.trim()) {
			setNewsletterMessage({ tone: "error", text: "Please enter your email." });
			return;
		}

		setSubscribing(true);
		setNewsletterMessage(null);
		const res = await fetch("/api/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await res.json();

		if (res.ok) {
			setNewsletterMessage({ tone: "success", text: "Thank you for subscribing!" });
			setEmail("");
		} else {
			setNewsletterMessage({ tone: "error", text: data.error || "Something went wrong. Please try again." });
		}
		setSubscribing(false);
	};

	return (
		<div className="flex min-h-screen flex-col bg-saffron text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="flex-1">
				{highlightedCategories.length > 0 ? (
					<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
						<div className="flex items-end justify-between gap-4">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Featured Categories</p>
								<h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Collections curated for culture, prayer, and gifting</h2>
							</div>
							<Link href="/shop" className="hidden sm:block text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
								View all
							</Link>
						</div>

						{/* Mobile / tablet: horizontal snap-scroll row */}
						<div className="mt-8 no-scrollbar scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] lg:hidden [&::-webkit-scrollbar]:hidden">
							{categoryHighlights.map((category) => (
								<Link key={category.slug} href={`/shop?category=${encodeURIComponent(category.slug)}`} className="group flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm transition sm:w-48 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
									<div className="relative aspect-square w-full overflow-hidden bg-stone-100">
										{/* Blurred backdrop reuses the same next/image-optimized source (tiny, low-quality) instead of a second raw fetch of the full-resolution original from Supabase. */}
										<Image src={category.previewImage} alt="" fill sizes="32px" quality={20} aria-hidden="true" className="scale-110 object-cover opacity-60 blur-xl" />
										<Image src={category.previewImage} alt={category.label} fill sizes="192px" className="relative object-contain" />
									</div>
									<div className="px-3 py-3 text-center md:align-middle">
										<p className="text-sm font-semibold text-stone-900 group-hover:text-[#1B365D]">{category.label}</p>
										<p className="mt-1 text-xs text-stone-700">{category.count} products</p>
									</div>
								</Link>
							))}
						</div>

						{/* Desktop: bento showcase — one large spotlight category plus a stacked list, so the row fills the width with intent instead of trailing off into empty space */}
						{(() => {
							const isTemple = (category: (typeof categoryHighlights)[number]) => /temple/i.test(category.label) || /temple/i.test(category.slug);
							const [heroCategory, ...restCategories] = [...categoryHighlights].sort((a, b) => Number(isTemple(b)) - Number(isTemple(a)) || b.count - a.count);
							if (!heroCategory) return null;
							return (
								<div className="mt-8 hidden lg:grid lg:grid-cols-5 lg:gap-6">
									<Link href={`/shop?category=${encodeURIComponent(heroCategory.slug)}`} className={`group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[2rem] border border-stone-200 shadow-sm transition duration-300 hover:shadow-xl ${restCategories.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}`}>
										{/* Blurred backdrop reuses the same next/image-optimized source (tiny, low-quality) instead of a second raw fetch of the full-resolution original from Supabase. */}
										<Image src={heroCategory.previewImage} alt="" fill sizes="48px" quality={20} aria-hidden="true" className="scale-110 bg-stone-200 object-cover opacity-70 blur-2xl" />
										<Image src={heroCategory.previewImage} alt={heroCategory.label} fill sizes="(min-width: 1024px) 60vw, 100vw" className="relative object-contain transition duration-500 group-hover:scale-105" />
										<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
										<div className="relative z-10 p-8">
											<span className="inline-flex items-center rounded-full bg-brand-orange px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm">{isTemple(heroCategory) ? "Signature Collection" : "Most Popular"}</span>
											<h3 className="mt-4 text-3xl font-semibold text-white">{heroCategory.label}</h3>
											<p className="mt-1.5 text-sm text-white/80">{heroCategory.count} products</p>
											<span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#1B365D] transition group-hover:gap-2.5">
												Shop Collection
												<ArrowRight className="h-3.5 w-3.5" />
											</span>
										</div>
									</Link>

									{restCategories.length > 0 && (
										<div className="flex flex-col gap-6 lg:col-span-2">
											{restCategories.map((category) => (
												<Link key={category.slug} href={`/shop?category=${encodeURIComponent(category.slug)}`} className="group relative flex flex-1 items-center gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg">
													<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
														{/* Blurred backdrop reuses the same next/image-optimized source (tiny, low-quality) instead of a second raw fetch of the full-resolution original from Supabase. */}
														<Image src={category.previewImage} alt="" fill sizes="24px" quality={20} aria-hidden="true" className="scale-110 object-cover opacity-60 blur-lg" />
														<Image src={category.previewImage} alt={category.label} fill sizes="80px" className="relative object-contain transition duration-500 group-hover:scale-105" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="font-semibold text-stone-900 group-hover:text-[#1B365D]">{category.label}</p>
														<p className="mt-1 text-xs text-stone-700">{category.count} products</p>
													</div>
													<ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-1 group-hover:text-[#1B365D]" />
												</Link>
											))}
										</div>
									)}
								</div>
							);
						})()}
					</section>
				) : null}

				<HeroSection secondaryCtaHref={secondaryCtaHref} secondaryCtaLabel={secondaryCtaLabel} rating={4.9} />

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Featured Products</p>
							<h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Best sellers and premium new arrivals</h2>
						</div>
						<Link href="/shop" className="hidden sm:block text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
							Shop all
						</Link>
					</div>
					{/* Mobile / tablet: horizontal snap-scroll cards */}
					<div className="mt-8 no-scrollbar scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] lg:hidden [&::-webkit-scrollbar]:hidden">
						{featuredProducts.map((product) => {
							const displayPrice = product.variants[0]?.price ?? 0;
							const originalPrice = displayPrice * 1.2;
							const discount = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
							return (
								<div key={product.id} className="flex h-full w-[72vw] max-w-70 shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition md:w-70 md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
									<div className="group relative block">
										<Link href={`/product/${product.slug}`} className="block">
											<div className="relative w-full aspect-5/6 overflow-hidden bg-stone-100">
												<Image src={product.image} alt={product.name} fill sizes="(min-width: 768px) 25vw, 72vw" className="object-cover" />
												{product.featured && <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white shadow-sm">⭐ Best Seller</span>}
												{discount > 0 && <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">-{discount}%</span>}
												<div className="absolute inset-x-0 bottom-0 hidden items-center justify-center bg-gradient-to-t from-black/50 to-transparent p-4 group-hover:flex">
													<span className="text-xs text-white font-medium">View Details</span>
												</div>
											</div>
											<div className="px-3 pt-3 sm:px-5 sm:pt-4">
												<p className="text-sm font-semibold text-stone-900 sm:text-base line-clamp-1" title={product.name}>
													{product.name}
												</p>
												<div className="mt-1.5 flex items-center gap-1">
													<div className="flex items-center">
														{Array.from({ length: 5 }).map((_, i) => (
															<Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-stone-200 text-stone-200"}`} />
														))}
													</div>
													<span className="text-xs text-stone-700">({product.reviewCount})</span>
												</div>
											</div>
										</Link>
									</div>
									<div className="mt-auto flex items-center justify-between gap-3 px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
										<div className="flex flex-col">
											<ProductPrice amountNok={displayPrice} className="text-sm font-semibold text-[#1B365D] sm:text-base" />
											{discount > 0 && <ProductPrice amountNok={originalPrice} className="text-xs text-stone-700 line-through" />}
										</div>
										<Button asChild className={`${buying ? "opacity-50 cursor-not-allowed" : ""} rounded-full bg-brand-orange px-4 py-2 text-xs text-white hover:bg-[#d87810] sm:text-sm`} disabled={buying}>
											<Link href={`/product/${product.slug}`}>Buy</Link>
										</Button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Desktop: editorial spotlight layout — two large feature panels instead of small cards */}
					<div className="mt-10 hidden lg:grid lg:grid-cols-2 lg:gap-8">
						{featuredProducts.slice(0, 2).map((product, index) => {
							const displayPrice = product.variants[0]?.price ?? 0;
							const originalPrice = displayPrice * 1.2;
							const discount = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
							const tags = [product.sizeLabel, product.material].filter(Boolean);
							return (
								<Link key={product.id} href={`/product/${product.slug}`} className="group relative isolate flex overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl">
									<span className="pointer-events-none absolute -left-3 -top-8 -z-10 select-none text-[8rem] font-black leading-none text-stone-100 transition group-hover:text-stone-100/80">0{index + 1}</span>

									<div className="relative w-2/5 shrink-0 overflow-hidden">
										<Image src={product.image} alt={product.name} fill sizes="(min-width: 1024px) 20vw, 40vw" className="bg-stone-100 object-cover transition duration-500 group-hover:scale-105" />
										<div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
										<div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
											{product.featured && <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white shadow-sm">⭐ Best Seller</span>}
											{discount > 0 && <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">-{discount}%</span>}
										</div>
									</div>

									<div className="flex min-w-0 flex-1 flex-col justify-between p-7">
										<div className="min-w-0">
											<p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange">{product.category}</p>
											<h3 className="mt-2 truncate text-2xl font-semibold text-stone-900" title={product.name}>
												{product.name}
											</h3>
											<p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">{product.shortDescription}</p>

											<div className="mt-3 flex items-center gap-1.5">
												<div className="flex items-center">
													{Array.from({ length: 5 }).map((_, i) => (
														<Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-stone-200 text-stone-200"}`} />
													))}
												</div>
												<span className="text-xs text-stone-700">({product.reviewCount} reviews)</span>
											</div>

											{tags.length > 0 && (
												<div className="mt-4 flex flex-wrap gap-2">
													{tags.map((tag) => (
														<span key={tag} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
															{tag}
														</span>
													))}
												</div>
											)}
										</div>

										<div className="mt-6 flex items-end justify-between gap-3 border-t border-stone-100 pt-5">
											<div className="flex flex-col">
												<span className="text-xs font-medium uppercase tracking-[0.15em] text-stone-700">Price</span>
												<ProductPrice amountNok={displayPrice} className="text-xl font-bold text-[#1B365D]" />
												{discount > 0 && <ProductPrice amountNok={originalPrice} className="text-xs text-stone-700 line-through" />}
											</div>
											<span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B365D] px-5 py-2.5 text-xs font-semibold text-white transition group-hover:gap-2.5 group-hover:bg-[#152d4c]">
												Shop Now
												<ArrowRight className="h-3.5 w-3.5" />
											</span>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				</section>

				{dynamicCategorySections.map((section) => (
					<HomeCategoryProductsSection key={section.title} title={section.title} href={section.href} products={section.products} />
				))}

				{mandapCategory ? (
					<section className="py-14 sm:py-20 md:py-24">
						<div className="relative overflow-hidden border-y-4 border-brand-orange shadow-xl">
							<div className="absolute inset-0 bg-stone-900" aria-hidden="true">
								{/* Routed through next/image (instead of a raw CSS background-image) so it's optimized, resized, and cached at the edge rather than fetched full-resolution from Supabase on every visit. */}
								<Image src={mandapCategory.imageUrl ?? mandapProducts[0]?.image ?? "/images/temple-2.jpg"} alt="" fill sizes="100vw" className="object-cover opacity-60" />
								<div className="absolute inset-0 bg-gradient-to-r from-[#1B365D]/95 via-[#1B365D]/85 to-[#1B365D]/55" />
							</div>
							<div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20 md:py-24 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-28">
								<div className="max-w-2xl">
									<span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm">
										<span className="h-2 w-2 animate-pulse rounded-full bg-white" />
										Made To Order
									</span>
									<h2 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl">Custom Mandaps &amp; Temples, Built To Your Design</h2>
									<p className="mt-4 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Every celebration deserves a mandap that fits its space and story. Share your size, style, material, and preferences — our artisans design and craft it to order, for indoor or outdoor events.</p>
									<ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-white/80">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
											Tell us your dimensions &amp; style
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
											Personalized quote within 24 hours
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
											Handcrafted for indoor &amp; outdoor events
										</li>
									</ul>
								</div>
								<div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
									<Button asChild className="rounded-full bg-brand-orange px-6 sm:px-8 py-4 sm:py-6 text-base font-semibold text-white shadow-lg shadow-[#F7931E]/30 transition hover:scale-105 hover:bg-[#d87810]">
										<Link href={mandapCtaHref} className="inline-flex items-center gap-2">
											Request a Custom Mandap
											<ArrowRight className="h-5 w-5" />
										</Link>
									</Button>
									<p className="text-xs text-white/60">No obligation — just tell us what you have in mind.</p>
								</div>
							</div>
						</div>
					</section>
				) : null}

				{/* <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-2 lg:gap-6 grid-cols-2 lg:grid-cols-4">
						{stats.map((item) => (
							<div key={item.label} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
								<p className="text-3xl font-semibold text-[#1B365D]">{item.value}</p>
								<p className="mt-2 text-sm text-stone-700">{item.label}</p>
							</div>
						))}
					</div>
				</section> */}

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
							<div className="flex flex-col items-start justify-between gap-8">
								<div className="max-w-xl">
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Shop With Confidence</p>
									<h2 className="mt-3 text-3xl font-semibold text-stone-900">Handmade quality, delivered across Europe</h2>
									<p className="mt-3 text-sm leading-7 text-stone-700">Not sure what size or piece fits your space? Our team is happy to guide you before you buy.</p>
								</div>

								<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
									<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
										<Link href="/shop">Start Shopping</Link>
									</Button>
									<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
										<Link href="/contact">Talk to an Expert</Link>
									</Button>
								</div>
							</div>
						</div>
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Shop by Intent</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Find the right collection faster</h2>
							<div className="mt-5 space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
								{categoryHighlights.map((item) => (
									<Link key={item.slug} href={`/shop?category=${encodeURIComponent(item.slug)}`} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition hover:border-stone-300 hover:bg-white">
										<ProductImage src={item.previewImage} alt={item.label} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl bg-stone-100" />
										<div className="min-w-0">
											<p className="text-sm font-semibold text-stone-900 group-hover:text-[#1B365D]">{item.label}</p>
											<p className="mt-1 text-xs text-stone-700">{item.count > 0 ? `${item.count} products available` : "No products yet"}</p>
										</div>
									</Link>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="py-8 sm:py-12 md:py-16">
					<div className="relative overflow-hidden border-y border-stone-200/70 bg-gradient-to-br from-[#FFF3E0] via-white to-[#F4EDE4] lg:shadow-md">
						{/* Decorative shared background: dot pattern + soft glow blobs, desktop only */}
						<div className="pointer-events-none absolute inset-0 hidden lg:block">
							<div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(27,54,93,0.14)_1.5px,transparent_1.5px)] [background-size:22px_22px]" />
							<div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-orange/15 blur-3xl" />
							<div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[#1B365D]/10 blur-3xl" />
						</div>

						<div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:px-8 lg:py-14">
							<div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
								{/* Left: intro card */}
								<div className="flex h-full min-w-0 flex-col">
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Customer Voice</p>
									<h2 className="mt-3 text-3xl font-semibold text-stone-900">Proof that your order is in safe hands</h2>

									<div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
										{reviewFacts.map((fact) => (
											<div key={fact.label}>
												<p className="text-2xl font-semibold text-[#1B365D]">{fact.value}</p>
												<p className="mt-1 text-xs uppercase tracking-[0.12em] text-stone-700">{fact.label}</p>
											</div>
										))}
									</div>

									{/* pushes CTAs to the bottom so the card's own content fills its height */}
									<div className="mt-6 flex flex-1 flex-wrap items-end gap-3">
										<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
											<Link href="/shop">Shop Now</Link>
										</Button>
										<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
											<Link href="/contact">Ask Before You Buy</Link>
										</Button>
									</div>
								</div>

								{/* Right: testimonials, vertically centered to fill the same height */}
								<div className="flex h-full min-w-0 flex-col justify-center mt-3 md:mt-0">
									{showSlider && (
										<div className="mb-4 hidden items-center justify-end gap-2 md:flex">
											<button onClick={goPrev} disabled={page === 0} aria-label="Previous testimonials" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">
												<ChevronLeft className="h-4 w-4" />
											</button>
											<button onClick={goNext} disabled={page === pageCount - 1} aria-label="Next testimonials" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">
												<ChevronRight className="h-4 w-4" />
											</button>
										</div>
									)}

									{/* Desktop: paged, equal-height cards */}
									<div className="hidden overflow-hidden md:block">
										<div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
											{Array.from({ length: pageCount }).map((_, p) => (
												<div key={p} className="grid w-full flex-shrink-0 auto-rows-fr grid-cols-2 gap-4">
													{testimonials.slice(p * perPage, p * perPage + perPage).map((item) => (
														<TestimonialCard key={item.id} item={item} />
													))}
												</div>
											))}
										</div>
									</div>

									{showSlider && (
										<div className="mt-4 hidden justify-center gap-1.5 md:flex">
											{Array.from({ length: pageCount }).map((_, p) => (
												<button key={p} onClick={() => setPage(p)} aria-label={`Go to page ${p + 1}`} aria-current={p === page ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${p === page ? "w-6 bg-[#1B365D]" : "w-1.5 bg-stone-300"}`} />
											))}
										</div>
									)}

									{/* Mobile: native swipe, one card at a time */}
									<div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
										{testimonials.map((item) => (
											<div key={item.id} className="w-[85%] flex-shrink-0 snap-center">
												<TestimonialCard item={item} />
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 pb-8 sm:pb-12 md:pb-16 sm:px-6 lg:px-8">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-7 shadow-sm">
						<div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Newsletter</p>
								<h2 className="mt-2 text-3xl font-semibold text-stone-900">Get festival drops and artisan stories first</h2>
								<p className="mt-2 text-sm text-stone-700">Receive product launches, temple care guides, and exclusive seasonal offers.</p>
							</div>
							<div>
								<div className="flex flex-col gap-3 sm:flex-row">
									<label htmlFor="newsletter-email" className="sr-only">
										Email address
									</label>
									<input id="newsletter-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-full border border-stone-300 bg-stone-50 px-5 py-3 text-sm text-stone-900 outline-none sm:w-80" />

									<Button onClick={handleSubscribers} className={`${subscribing ? "opacity-50 cursor-not-allowed" : ""} rounded-full cursor-pointer bg-brand-orange px-6 text-white hover:bg-[#d87810]`} disabled={subscribing}>
										{subscribing ? "Subscribing..." : "Subscribe"}
									</Button>
								</div>
								{newsletterMessage ? (
									<InlineAlert tone={newsletterMessage.tone} className="mt-2">
										{newsletterMessage.text}
									</InlineAlert>
								) : null}
							</div>
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
