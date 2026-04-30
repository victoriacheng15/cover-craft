"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { OriginStory } from "@/components/landing/OriginStory";
import { Principles } from "@/components/landing/Principles";
import MainLayout from "@/components/layout/MainLayout";

export default function LandingPage() {
	return (
		<MainLayout>
			<div className="flex flex-col gap-14 max-w-4xl mx-auto">
				<HeroSection />
				<OriginStory />
				<Principles />
			</div>
		</MainLayout>
	);
}
