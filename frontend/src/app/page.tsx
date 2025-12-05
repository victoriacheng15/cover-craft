"use client";

import { useEffect, useState } from "react";
import CoverForm from "@/components/form/CoverForm";
import MainLayout from "@/components/layout/MainLayout";
import { health } from "@/lib/api";

export default function Home() {
	const [apiStatus, setApiStatus] = useState<string>("Checking...");

	useEffect(() => {
		async function checkHealth() {
			try {
				const res = await health();
				setApiStatus(res.status || "Healthy");
			} catch {
				setApiStatus("API Unreachable");
			}
		}
		checkHealth();
	}, []);

	// NOTE: The API health check below is for testing purposes. Remove before production release.
	return (
		<MainLayout>
			<div style={{ marginBottom: 16 }}>
				<strong>API Health:</strong> {apiStatus}
			</div>
			<CoverForm />
		</MainLayout>
	);
}
