"use client";

import { MainLayout } from "@/components/layouts";
import {
	ArchitectureBlueprint,
	CoreComponents,
	DesignTradeoffs,
	HeroSection,
	ValidationResiliency,
} from "@/components/ShowcaseSections";

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
