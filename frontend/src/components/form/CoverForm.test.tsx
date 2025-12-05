import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CoverForm from "./CoverForm";

// Mock useForm hook
vi.mock("@/hooks", async () => {
	const actual = await vi.importActual("@/hooks");
	return {
		...actual,
		useForm: vi.fn(),
	};
});

import { useForm as useFormHook } from "@/hooks";

describe("CoverForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockUseForm = (overrides = {}) => {
		return {
			formData: {
				size: "Post (1200 × 627)",
				filename: "",
				title: "",
				subtitle: "",
				backgroundColor: "#374151",
				textColor: "#F9FAFB",
				font: "Montserrat",
			},
			isGenerating: false,
			error: null,
			generatedImageUrl: null,
			handleInputChange: vi.fn(),
			getPreviewDimensions: vi.fn(() => ({ width: 600, height: 313.5 })),
			handleGenerate: vi.fn(),
			handleDownload: vi.fn(),
			...overrides,
		};
	};

	it("renders all form fields correctly", () => {
		(useFormHook as any).mockReturnValue(createMockUseForm());
		render(<CoverForm />);

		// Scope to the form card
		const formCardText = screen.getByText("Cover Details");
		const formCard = formCardText.closest("div");

		if (!formCard) {
			throw new Error("Could not find form card container");
		}

		// Dropdown
		const sizeSelect = within(formCard).getByLabelText(
			/Size Preset/i,
		) as HTMLSelectElement;
		expect(sizeSelect.value).toBe("Post (1200 × 627)");

		// Inputs - use placeholder to find specific inputs
		const imageNameInput = within(formCard).getByPlaceholderText(
			"my-awesome-cover",
		) as HTMLInputElement;
		const titleInput = within(formCard).getByPlaceholderText(
			"Enter your cover title...",
		) as HTMLInputElement;
		const subtitleInput = within(formCard).getByPlaceholderText(
			"Subtitle",
		) as HTMLInputElement;

		expect(imageNameInput).toBeInTheDocument();
		expect(titleInput).toBeInTheDocument();
		expect(subtitleInput).toBeInTheDocument();

		// Color pickers
		const bgColorInput = within(formCard).getByLabelText(
			/Background Color/i,
		) as HTMLInputElement;
		const textColorInput = within(formCard).getByLabelText(
			/Text Color/i,
		) as HTMLInputElement;

		expect(bgColorInput.value).toBe("#374151");
		expect(textColorInput.value).toBe("#f9fafb");

		// Font select
		const fontSelect = within(formCard).getByLabelText(
			/Font/i,
		) as HTMLSelectElement;
		expect(fontSelect.value).toBe("Montserrat");

		// Generate button
		const generateBtn = within(formCard).getByRole("button", {
			name: /generate/i,
		});
		expect(generateBtn).toBeDisabled();
	});

	it("calls handleInputChange when form fields are changed", () => {
		const handleInputChange = vi.fn();
		(useFormHook as any).mockReturnValue(
			createMockUseForm({ handleInputChange }),
		);
		render(<CoverForm />);

		const inputs = screen.getAllByRole("textbox");
		const titleInput = inputs.find(
			(input) =>
				(input as HTMLInputElement).placeholder === "Enter your cover title...",
		) as HTMLInputElement;

		fireEvent.change(titleInput, { target: { value: "Test Title" } });
		expect(handleInputChange).toHaveBeenCalledWith("title", "Test Title");
	});

	it("displays default preview text when no input provided", () => {
		(useFormHook as any).mockReturnValue(createMockUseForm());
		render(<CoverForm />);

		expect(screen.getByText("Title Preview")).toBeInTheDocument();
		expect(screen.getByText("Subtitle Preview")).toBeInTheDocument();
	});

	it("renders live preview section", () => {
		(useFormHook as any).mockReturnValue(createMockUseForm());
		render(<CoverForm />);

		const previewText = screen.getByText("Live Preview");
		expect(previewText).toBeInTheDocument();
	});

	it("renders all color picker inputs", () => {
		(useFormHook as any).mockReturnValue(createMockUseForm());
		render(<CoverForm />);

		const bgColor = screen.getByLabelText(/Background Color/i);
		const textColor = screen.getByLabelText(/Text Color/i);

		expect(bgColor).toBeInTheDocument();
		expect(textColor).toBeInTheDocument();
	});

	it("has correct aria labels for accessibility", () => {
		(useFormHook as any).mockReturnValue(createMockUseForm());
		render(<CoverForm />);

		const formCard = screen.getByLabelText("Cover image generator form");
		expect(formCard).toBeInTheDocument();

		const sizeInput = screen.getByLabelText("Select cover image size preset");
		expect(sizeInput).toBeInTheDocument();

		const titleInput = screen.getByLabelText(
			"Enter your cover title (required)",
		);
		expect(titleInput).toBeInTheDocument();
	});

	it("displays generated image when generatedImageUrl is set", () => {
		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "test-cover",
					title: "Generated Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				generatedImageUrl: "data:image/png;base64,test",
			}),
		);

		render(<CoverForm />);

		expect(screen.getByText("Generated Image")).toBeInTheDocument();
		expect(screen.queryByText("Live Preview")).not.toBeInTheDocument();
	});

	it("displays download button when image is generated", () => {
		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "test-cover",
					title: "Generated Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				generatedImageUrl: "data:image/png;base64,test",
			}),
		);

		render(<CoverForm />);

		const downloadBtn = screen.getByRole("button", { name: /Download/i });
		expect(downloadBtn).toBeInTheDocument();
	});

	it("calls handleDownload when download button is clicked", () => {
		const handleDownloadMock = vi.fn();

		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "test-cover",
					title: "Generated Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				generatedImageUrl: "data:image/png;base64,test",
				handleDownload: handleDownloadMock,
			}),
		);

		render(<CoverForm />);

		const downloadBtn = screen.getByRole("button", { name: /Download/i });
		fireEvent.click(downloadBtn);

		expect(handleDownloadMock).toHaveBeenCalled();
	});

	it("displays error message when error is present", () => {
		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "",
					title: "Test Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				error: "Failed to generate image",
			}),
		);

		render(<CoverForm />);

		expect(screen.getByText("Failed to generate image")).toBeInTheDocument();
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("shows loading state in generate button", () => {
		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "",
					title: "Test Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				isGenerating: true,
			}),
		);

		render(<CoverForm />);

		const generateBtn = screen.getByRole("button", { name: /Generating/i });
		expect(generateBtn).toBeDisabled();
	});

	it("enables generate button when title is provided", () => {
		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "",
					title: "Test Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
			}),
		);

		render(<CoverForm />);

		const generateBtn = screen.getByRole("button", { name: /Generate/i });
		expect(generateBtn).not.toBeDisabled();
	});

	it("calls handleGenerate when generate button is clicked", () => {
		const handleGenerateMock = vi.fn();

		(useFormHook as any).mockReturnValue(
			createMockUseForm({
				formData: {
					size: "Post (1200 × 627)",
					filename: "",
					title: "Test Title",
					subtitle: "",
					backgroundColor: "#374151",
					textColor: "#F9FAFB",
					font: "Montserrat",
				},
				handleGenerate: handleGenerateMock,
			}),
		);

		render(<CoverForm />);

		const generateBtn = screen.getByRole("button", { name: /Generate/i });
		fireEvent.click(generateBtn);

		expect(handleGenerateMock).toHaveBeenCalled();
	});
});
