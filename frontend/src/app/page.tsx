"use client";

import {
	ArchitectureBlueprint,
	CoreComponents,
	DesignTradeoffs,
	HeroSection,
	ValidationResiliency,
} from "@/components/landing/ShowcaseSections";
import { MainLayout } from "@/components/layout/layouts";

export default function LandingPage() {
	return (
		<MainLayout>
			<div className="flex flex-col gap-14 max-w-4xl mx-auto">
				<HeroSection />
				<ArchitectureBlueprint />
				<CoreComponents />
				<ValidationResiliency />
				<DesignTradeoffs />
			</div>
		</MainLayout>
	);
}
