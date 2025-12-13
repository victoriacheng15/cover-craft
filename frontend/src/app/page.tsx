"use client";

import { useEffect, useState } from "react";
import { health } from "@/_utils";
import CoverForm from "@/components/form/CoverForm";
import MainLayout from "@/components/layout/MainLayout";

export default function Home() {
	// NOTE: The API health check below is for testing purposes. Remove before production release.
	return (
		<MainLayout>
			<CoverForm />
		</MainLayout>
	);
}
