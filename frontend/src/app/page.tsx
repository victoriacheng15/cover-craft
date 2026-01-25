"use client";

import { DesignPrinciples } from "@/components/landing/DesignPrinciples";
import { HeroSection } from "@/components/landing/HeroSection";
import { OriginStory } from "@/components/landing/OriginStory";
import { SourceCodeLink } from "@/components/landing/SourceCodeLink";
import MainLayout from "@/components/layout/MainLayout";

export default function LandingPage() {
	return (
		<MainLayout>
			<div className="flex flex-col gap-16 max-w-3xl mx-auto">
				{/* Hero Section */}
				<HeroSection />

				{/* Origin Story */}
				<OriginStory />

				{/* Design Principles */}
				<DesignPrinciples />

				{/* Footer Link */}
				<SourceCodeLink />
			</div>
		</MainLayout>
	);
}
