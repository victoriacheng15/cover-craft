import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BatchResultsDisplay from "./BatchResultsDisplay";

// Mock JSZip
vi.mock("jszip", () => {
	return {
		default: vi.fn().mockImplementation(function (this: {
			file: ReturnType<typeof vi.fn>;
			generateAsync: ReturnType<typeof vi.fn>;
		}) {
			this.file = vi.fn().mockReturnThis();
			this.generateAsync = vi
				.fn()
				.mockResolvedValue(new Blob(["mock zip content"]));
			return this;
		}),
	};
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("BatchResultsDisplay", () => {
	const mockStatus = {
		id: "job-123",
		status: "processing" as const,
		progress: 1,
		total: 2,
		results: ["data:image/png;base64,img1"],
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	it("renders empty state when no status or jobId", () => {
		render(<BatchResultsDisplay status={null} jobId={null} />);
		expect(
			screen.getByText(/Submit a batch or track a Job ID to see results/i),
		).toBeInTheDocument();
	});

	it("renders processing state correctly", () => {
		render(<BatchResultsDisplay status={mockStatus} jobId="job-123" />);

		const statusText = screen.getByText((content, element) => {
			return (
				element?.tagName === "SPAN" && content.toLowerCase() === "processing"
			);
		});
		expect(statusText).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).toHaveAttribute(
			"aria-valuenow",
			"1",
		);
		expect(screen.getByText(/ID: job-123/i)).toBeInTheDocument();
	});

	it("renders completed state with images", () => {
		const completedStatus = {
			...mockStatus,
			status: "completed" as const,
			progress: 2,
			results: ["data:image/png;base64,img1", "data:image/png;base64,img2"],
		};

		render(<BatchResultsDisplay status={completedStatus} jobId="job-123" />);

		const statusText = screen.getByText((content, element) => {
			return (
				element?.tagName === "SPAN" && content.toLowerCase() === "completed"
			);
		});
		expect(statusText).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: /Download All \(ZIP\)/i }),
		).toBeInTheDocument();
	});

	it("renders failed state with error message", () => {
		const failedStatus = {
			...mockStatus,
			status: "failed" as const,
			error: "Queue connection timed out",
		};

		render(<BatchResultsDisplay status={failedStatus} jobId="job-123" />);

		const statusText = screen.getByText((content, element) => {
			return element?.tagName === "SPAN" && content.toLowerCase() === "failed";
		});
		expect(statusText).toBeInTheDocument();
		expect(screen.getByText(/Queue connection timed out/i)).toBeInTheDocument();
	});

	it("handles individual result errors", () => {
		const statusWithItemError = {
			...mockStatus,
			status: "completed" as const,
			results: [
				"data:image/png;base64,img1",
				"error: canvas generation failed",
			],
		};

		render(
			<BatchResultsDisplay status={statusWithItemError} jobId="job-123" />,
		);

		const failedLabel = screen.getByText((content, element) => {
			return element?.tagName === "P" && content === "Failed";
		});
		expect(failedLabel).toBeInTheDocument();
		expect(screen.getByText(/canvas generation failed/i)).toBeInTheDocument();
	});

	it("triggers ZIP download when clicking download button", async () => {
		const completedStatus = {
			...mockStatus,
			status: "completed" as const,
			results: ["data:image/png;base64,img1"],
		};

		render(<BatchResultsDisplay status={completedStatus} jobId="job-123" />);

		// Mock document.createElement for the download link
		const mockLink = {
			click: vi.fn(),
			href: "",
			download: "",
			style: {},
		};
		const createSpy = vi
			.spyOn(document, "createElement")
			.mockReturnValue(mockLink as unknown as HTMLAnchorElement);
		const appendSpy = vi
			.spyOn(document.body, "appendChild")
			.mockImplementation((node) => node);
		const removeSpy = vi
			.spyOn(document.body, "removeChild")
			.mockImplementation((node) => node);

		const downloadBtn = screen.getByRole("button", {
			name: /Download All \(ZIP\)/i,
		});

		fireEvent.click(downloadBtn);

		await waitFor(() => {
			expect(mockLink.click).toHaveBeenCalled();
			expect(mockLink.download).toContain("batch-");
			expect(mockLink.download).toContain(".zip");
		});

		createSpy.mockRestore();
		appendSpy.mockRestore();
		removeSpy.mockRestore();
	});
});
