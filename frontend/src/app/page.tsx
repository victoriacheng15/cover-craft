"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { OriginStory } from "@/components/landing/OriginStory";
import { Principles } from "@/components/landing/Principles";
import MainLayout from "@/components/layout/MainLayout";

export default function LandingPage() {
	return (
		<MainLayout>
			<div className="flex flex-col gap-16 max-w-3xl mx-auto">
				{/* Hero Section */}
				<HeroSection />

				{/* Origin Story */}
				<OriginStory />

				{/* Principles */}
				<Principles />
			</div>
		</MainLayout>
	);
}
