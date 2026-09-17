"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // Don't show footer on admin and affiliate admin pages
    if (
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/affiliate/admin") ||
      pathname?.startsWith("/leader/admin")
    ) {
        return null;
    }

    return (
        <footer className="w-full font-outfit">
            {/* Mobile Footer View (#5640:6064, width: 100%, max-height: ~346px, rounded-t: 34px) */}
            <div className="block md:hidden w-full relative h-[346px] rounded-t-[34px] overflow-hidden text-white px-5 pt-6 pb-4 font-outfit bg-[#2A3B43]">
                {/* Background Image (#5640:6065) - vibrant, clearly visible mountains & cliff */}
                <img
                    src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=3540&auto=format&fit=crop"
                    alt="Footer background"
                    className="absolute inset-0 w-full h-full object-cover object-[center_35%] pointer-events-none"
                />
                {/* Subtle Text Vignette / Light Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(135deg, rgba(20, 30, 35, 0.65) 0%, rgba(20, 30, 35, 0.35) 50%, rgba(10, 20, 25, 0.55) 100%)",
                    }}
                />

                {/* Swirl / Watermark Logo (#5640:6066) */}
                <div className="absolute -left-10 bottom-0 w-[200px] h-[200px] pointer-events-none opacity-25 select-none z-0">
                    <img
                        src="/nba_logo1.svg"
                        alt=""
                        className="w-full h-full object-contain invert brightness-0"
                    />
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                    {/* Brand Header */}
                    <div>
                        <h2 className="text-[27px] font-bold text-white leading-[1.02] tracking-tight font-outfit">
                            Nothing but <br />
                            Adventures.
                        </h2>
                        {/* Divider Line */}
                        <div className="w-[68px] h-[1.5px] bg-white my-2.5" />
                        {/* Tagline */}
                        <p className="text-[10px] text-white/90 font-normal leading-[14px] font-outfit max-w-[210px] mb-2.5">
                            Curating authentic Indian experiences for discerning travelers since 2015.
                        </p>

                        {/* Social Icons Row */}
                        <div className="flex items-center gap-[7px]">
                            <a href="#" className="w-[25px] h-[25px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Facebook">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                            <a href="#" className="w-[25px] h-[25px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Instagram">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                            <a href="#" className="w-[25px] h-[25px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Twitter">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                            <a href="#" className="w-[25px] h-[25px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="YouTube">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* 3-Column Footer Grid matching design exactly */}
                    <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] gap-2 items-start">
                        {/* Contact Us Column */}
                        <div>
                            <h4 className="text-[10px] font-semibold text-white mb-1.5 font-outfit">Contact Us</h4>
                            <div className="flex flex-col gap-1.5 text-[9px] text-white/85 font-outfit">
                                <a href="mailto:hello@nothingbutadventures.com" className="flex items-start gap-1 hover:text-white leading-tight">
                                    <svg className="w-3 h-3 text-white/80 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="break-all">hello@nothingbutadventure<br className="sm:hidden" />s.com</span>
                                </a>
                                <a href="tel:+911234567890" className="flex items-center gap-1 hover:text-white">
                                    <svg className="w-3 h-3 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span>+91 123 456 7890</span>
                                </a>
                                <div className="flex items-center gap-1 text-white/85">
                                    <svg className="w-3 h-3 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>New Delhi, India</span>
                                </div>
                            </div>
                        </div>

                        {/* Destinations Column */}
                        <div>
                            <h4 className="text-[10px] font-semibold text-white mb-1.5 font-outfit">Destinations</h4>
                            <ul className="space-y-0.5 text-[9px] text-white/85 font-normal font-outfit">
                                <li><Link href="/trips?destination=rajasthan" className="hover:text-white transition-colors">Rajasthan</Link></li>
                                <li><Link href="/trips?destination=kerala" className="hover:text-white transition-colors">Kerala</Link></li>
                                <li><Link href="/trips?destination=himalayas" className="hover:text-white transition-colors">Himalayas</Link></li>
                                <li><Link href="/trips?destination=golden-triangle" className="hover:text-white transition-colors">Golden Triangle</Link></li>
                                <li><Link href="/trips?destination=varanasi" className="hover:text-white transition-colors">Varanasi</Link></li>
                                <li><Link href="/trips?destination=goa" className="hover:text-white transition-colors">Goa</Link></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div>
                            <h4 className="text-[10px] font-semibold text-white mb-1.5 font-outfit">Company</h4>
                            <ul className="space-y-0.5 text-[9px] text-white/85 font-normal font-outfit">
                                <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/why-nba" className="hover:text-white transition-colors">Why Choose Us</Link></li>
                                <li><Link href="/#reviews" className="hover:text-white transition-colors">Reviews</Link></li>
                                <li><Link href="/blogs" className="hover:text-white transition-colors">Travel Blog</Link></li>
                                <li><Link href="/tree-planting" className="hover:text-white transition-colors">Sustainability</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Footer View (hidden md:block) */}
            <div className="hidden md:block px-4 lg:px-6 xl:px-[35px] pt-6 md:pt-[24px] lg:pt-[32px] xl:pt-10 pb-2">
                {/* Dark Curved Image Card Footer (#5640:7739 on 785px / #5091:7737 on 1280px) */}
                <div className="relative rounded-[7.36px] xl:rounded-xl overflow-hidden text-white p-6 md:p-[20px] lg:p-[32px] xl:p-16 mb-1 shadow-md bg-[#1A1A1A]">
                    {/* Background Image with Dark Overlay */}
                    <img
                        src="/footer-10.svg"
                        alt="Footer background"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

                    {/* Watermark Logo in Background of Left Side */}
                    <div className="absolute -left-6 -bottom-8 w-[200px] h-[200px] lg:w-[260px] lg:h-[260px] xl:w-[380px] xl:h-[380px] pointer-events-none opacity-20 z-0 overflow-hidden select-none">
                        <img
                            src="/nba_logo1.svg"
                            alt=""
                            className="w-full h-full object-contain invert brightness-0"
                        />
                    </div>

                    {/* Card Content Grid */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 lg:gap-8 items-start">
                        {/* Left Brand Column (#5640:7741 on 785px: 168px / 1280px: max-w-md) */}
                        <div className="col-span-1 md:col-span-5 max-w-[168px] lg:max-w-[240px] xl:max-w-md relative z-10">
                            <h2 className="text-[17.17px] lg:text-[24px] xl:text-[44px] font-bold text-white leading-[18px] lg:leading-[26px] xl:leading-tight tracking-tight font-outfit">
                                Nothing but<br />
                                Adventures.
                            </h2>
                            <div className="w-[24.5px] lg:w-[35px] xl:w-40 h-[1.2px] xl:h-[2px] bg-white/80 my-2 lg:my-3 xl:my-5"></div>
                            <p className="text-[8.59px] lg:text-[11px] xl:text-[14px] text-white/80 font-normal leading-[13px] lg:leading-[17px] xl:leading-relaxed font-outfit mb-3 lg:mb-4 xl:mb-6 max-w-[168px] lg:max-w-[240px] xl:max-w-xs">
                                Curating authentic Indian experiences for discerning travelers since 2015.
                            </p>

                            {/* Social Media Circular Buttons (#5640:7742 on 785px: 24.5px buttons / 1280px: 40px) */}
                            <div className="flex items-center gap-1.5 lg:gap-2 xl:gap-3">
                                <a href="#" className="w-[15px] lg:w-[20px] xl:w-10 h-[15px] lg:h-[20px] xl:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer" aria-label="Facebook">
                                    <svg className="w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-4 xl:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                                <a href="#" className="w-[15px] lg:w-[20px] xl:w-10 h-[15px] lg:h-[20px] xl:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer" aria-label="Instagram">
                                    <svg className="w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-4 xl:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                                <a href="#" className="w-[15px] lg:w-[20px] xl:w-10 h-[15px] lg:h-[20px] xl:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer" aria-label="Twitter">
                                    <svg className="w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-4 xl:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                                <a href="#" className="w-[15px] lg:w-[20px] xl:w-10 h-[15px] lg:h-[20px] xl:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer" aria-label="YouTube">
                                    <svg className="w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-4 xl:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Right Columns Grid (#5640:7758, #5640:7774, #5640:7790 on 785px / 1280px) */}
                        <div className="col-span-1 md:col-span-7 grid grid-cols-3 gap-3 md:gap-4 lg:gap-8 relative z-10">
                            {/* Destinations */}
                            <div>
                                <h3 className="font-semibold text-[9.81px] lg:text-[13px] xl:text-base text-white mb-2 lg:mb-3 xl:mb-4 font-outfit">Destinations</h3>
                                <ul className="space-y-1 lg:space-y-2 xl:space-y-2.5 text-[8.59px] lg:text-[11px] xl:text-sm text-white/80 font-normal font-outfit">
                                    <li><Link href="/trips?destination=rajasthan" className="hover:text-white transition-colors">Rajasthan</Link></li>
                                    <li><Link href="/trips?destination=kerala" className="hover:text-white transition-colors">Kerala</Link></li>
                                    <li><Link href="/trips?destination=himalayas" className="hover:text-white transition-colors">Himalayas</Link></li>
                                    <li><Link href="/trips?destination=golden-triangle" className="hover:text-white transition-colors">Golden Triangle</Link></li>
                                    <li><Link href="/trips?destination=varanasi" className="hover:text-white transition-colors">Varanasi</Link></li>
                                    <li><Link href="/trips?destination=goa" className="hover:text-white transition-colors">Goa</Link></li>
                                </ul>
                            </div>

                            {/* Company */}
                            <div>
                                <h3 className="font-semibold text-[9.81px] lg:text-[13px] xl:text-base text-white mb-2 lg:mb-3 xl:mb-4 font-outfit">Company</h3>
                                <ul className="space-y-1 lg:space-y-2 xl:space-y-2.5 text-[8.59px] lg:text-[11px] xl:text-sm text-white/80 font-normal font-outfit">
                                    <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                                    <li><Link href="/why-nba" className="hover:text-white transition-colors">Why Choose Us</Link></li>
                                    <li><Link href="/#reviews" className="hover:text-white transition-colors">Reviews</Link></li>
                                    <li><Link href="/blogs" className="hover:text-white transition-colors">Travel Blog</Link></li>
                                    <li><Link href="/tree-planting" className="hover:text-white transition-colors">Sustainability</Link></li>
                                    <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                                </ul>
                            </div>

                            {/* Contact Us */}
                            <div>
                                <h3 className="font-semibold text-[9.81px] lg:text-[13px] xl:text-base text-white mb-2 lg:mb-3 xl:mb-4 font-outfit">Contact Us</h3>
                                <ul className="space-y-1.5 lg:space-y-2.5 xl:space-y-3.5 text-[8.59px] lg:text-[11px] xl:text-sm text-white/80 font-normal font-outfit">
                                    <li className="flex items-center gap-1.5 xl:gap-3">
                                        <svg className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <a href="mailto:hello@nothingbutadventures.com" className="hover:text-white transition-colors truncate">hello@nothingbutadventures.com</a>
                                    </li>
                                    <li className="flex items-center gap-1.5 xl:gap-3">
                                        <svg className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        <a href="tel:+911234567890" className="hover:text-white transition-colors whitespace-nowrap">+91 123 456 7890</a>
                                    </li>
                                    <li className="flex items-center gap-1.5 xl:gap-3">
                                        <svg className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="whitespace-nowrap">New Delhi, India</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Footer Copyright & Legal Links (#5640:7811 on 785px / 1280px) */}
                <div className="flex flex-row items-center justify-between gap-4 text-[7.36px] lg:text-[10.5px] xl:text-sm text-[#1A1A1A] font-outfit px-1 py-1.5 md:py-[10px] xl:py-2">
                    <p>© 2026 Nothing But Adventures. All rights reserved.</p>
                    <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
                        <Link href="/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
                        <Link href="/cookie-policy" className="hover:text-black transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
