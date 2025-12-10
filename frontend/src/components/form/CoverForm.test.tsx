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

type UseFormReturn = ReturnType<typeof useFormHook>;
const mockUseFormHook = vi.mocked(useFormHook);

describe("CoverForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockUseForm = (overrides: Partial<UseFormReturn> = {}) => {
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
			handleInputChange: vi.fn() as UseFormReturn["handleInputChange"],
			getPreviewDimensions: vi.fn(() => ({
				width: 600,
				height: 313.5,
			})) as unknown as UseFormReturn["getPreviewDimensions"],
			handleGenerate: vi.fn() as UseFormReturn["handleGenerate"],
			handleDownload: vi.fn() as UseFormReturn["handleDownload"],
			contrastCheck: {
				status: "good",
				message: "Contrast passes",
				meetsWCAG: true,
				ratio: 5,
				level: "AA",
			},
			...overrides,
		};
	};

	const renderCoverForm = (overrides: Partial<UseFormReturn> = {}) => {
		//@ts-expect-error
		mockUseFormHook.mockReturnValue(createMockUseForm(overrides));
		render(<CoverForm />);
	};

	it("renders all form fields correctly", () => {
		renderCoverForm();

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
		expect((titleInput as HTMLInputElement).maxLength).toBe(55);
		expect(subtitleInput).toBeInTheDocument();
		expect((subtitleInput as HTMLInputElement).maxLength).toBe(120);

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
		renderCoverForm({ handleInputChange });

		const inputs = screen.getAllByRole("textbox");
		const titleInput = inputs.find(
			(input) =>
				(input as HTMLInputElement).placeholder === "Enter your cover title...",
		) as HTMLInputElement;

		fireEvent.change(titleInput, { target: { value: "Test Title" } });
		expect(handleInputChange).toHaveBeenCalledWith("title", "Test Title");
	});

	it("displays default preview text when no input provided", () => {
		renderCoverForm();

		expect(screen.getByText("Title Preview")).toBeInTheDocument();
		expect(screen.getByText("Subtitle Preview")).toBeInTheDocument();
	});

	it("renders live preview section", () => {
		renderCoverForm();

		const previewText = screen.getByText("Live Preview");
		expect(previewText).toBeInTheDocument();
	});

	it("renders all color picker inputs", () => {
		renderCoverForm();

		const bgColor = screen.getByLabelText(/Background Color/i);
		const textColor = screen.getByLabelText(/Text Color/i);

		expect(bgColor).toBeInTheDocument();
		expect(textColor).toBeInTheDocument();
	});

	it("has correct aria labels for accessibility", () => {
		renderCoverForm();

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
		renderCoverForm({
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
		});

		expect(screen.getByText("Generated Image")).toBeInTheDocument();
		expect(screen.queryByText("Live Preview")).not.toBeInTheDocument();
	});

	it("displays download button when image is generated", () => {
		renderCoverForm({
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
		});

		const downloadBtn = screen.getByRole("button", { name: /Download/i });
		expect(downloadBtn).toBeInTheDocument();
	});

	it("calls handleDownload when download button is clicked", () => {
		const handleDownloadMock = vi.fn();

		renderCoverForm({
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
		});

		const downloadBtn = screen.getByRole("button", { name: /Download/i });
		fireEvent.click(downloadBtn);

		expect(handleDownloadMock).toHaveBeenCalled();
	});

	it("displays error message when error is present", () => {
		renderCoverForm({
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
		});

		expect(screen.getByText("Failed to generate image")).toBeInTheDocument();
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("shows loading state in generate button", () => {
		renderCoverForm({
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
		});

		const generateBtn = screen.getByRole("button", { name: /Generating/i });
		expect(generateBtn).toBeDisabled();
	});

	it("enables generate button when title is provided", () => {
		renderCoverForm({
			formData: {
				size: "Post (1200 × 627)",
				filename: "",
				title: "Test Title",
				subtitle: "",
				backgroundColor: "#374151",
				textColor: "#F9FAFB",
				font: "Montserrat",
			},
		});

		const generateBtn = screen.getByRole("button", { name: /Generate/i });
		expect(generateBtn).not.toBeDisabled();
	});

	it("calls handleGenerate when generate button is clicked", () => {
		const handleGenerateMock = vi.fn();

		renderCoverForm({
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
		});

		const generateBtn = screen.getByRole("button", { name: /Generate/i });
		fireEvent.click(generateBtn);

		expect(handleGenerateMock).toHaveBeenCalled();
	});

	it("updates form data when color pickers change", () => {
		const handleInputChange = vi.fn();
		renderCoverForm({ handleInputChange });

		const bgColorInput = screen.getByLabelText(/Background Color/i);
		const textColorInput = screen.getByLabelText(/Text Color/i);

		fireEvent.change(bgColorInput, { target: { value: "#123456" } });
		fireEvent.change(textColorInput, { target: { value: "#abcdef" } });

		expect(handleInputChange).toHaveBeenCalledWith("backgroundColor", "#123456");
		expect(handleInputChange).toHaveBeenCalledWith("textColor", "#abcdef");
	});

	it("renders preview aria label with custom title and subtitle", () => {
		renderCoverForm({
			formData: {
				size: "Post (1200 × 627)",
				filename: "",
				title: "Preview Title",
				subtitle: "Preview Subtitle",
				backgroundColor: "#000000",
				textColor: "#ffffff",
				font: "Montserrat",
			},
		});

		const previewRegion = screen.getByRole("img", {
			name: /Preview: Preview Title - Preview Subtitle/i,
		});

		expect(previewRegion).toHaveStyle({
			backgroundColor: "#000000",
			color: "#ffffff",
		});
	});

	it("renders contrast indicator when status is provided", () => {
		renderCoverForm({
			contrastCheck: {
				status: "warning",
				message: "Contrast needs work",
				meetsWCAG: true,
				ratio: 2,
				level: "AA",
			},
		});

		const contrastMessage = screen.getByText("Contrast needs work");
		expect(contrastMessage).toBeInTheDocument();
		const statusTag = screen.getByText(/Contrast status is warning/i);
		expect(statusTag).toBeInTheDocument();
	});

	it("disables generate button and surfaces reason when contrast fails", () => {
		const handleGenerateMock = vi.fn();
		renderCoverForm({
			contrastCheck: {
				status: "poor",
				message: "Contrast low",
				meetsWCAG: false,
				ratio: 1.2,
				level: "AA",
			},
			handleGenerate: handleGenerateMock,
		});

		const generateBtn = screen.getByRole("button", { name: /Generate/i });
		expect(generateBtn).toBeDisabled();
		expect(generateBtn).toHaveAttribute(
			"aria-label",
			"Generate button disabled: Contrast low",
		);
		expect(generateBtn).toHaveAttribute(
			"title",
			"Cannot generate: Contrast low",
		);
	});

	it("calls handleReset when reset button clicked", () => {
		const handleResetMock = vi.fn();
		renderCoverForm({ handleReset: handleResetMock });

		const resetBtn = screen.getByRole("button", {
			name: /Reset/i,
		});
		fireEvent.click(resetBtn);

		expect(handleResetMock).toHaveBeenCalled();
	});
});
