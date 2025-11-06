import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoverForm from "./CoverForm";

describe("CoverForm", () => {
  it("renders all form fields correctly", () => {
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

  it("enables generate button when required fields are filled", () => {
    render(<CoverForm />);

    const generateBtn = screen.getByRole("button", { name: /generate/i });

    // Fill required fields - use getAllByRole and select specific inputs
    const inputs = screen.getAllByRole("textbox");
    const imageNameInput = inputs.find(
      (input) => (input as HTMLInputElement).placeholder === "my-awesome-cover",
    ) as HTMLInputElement;
    const titleInput = inputs.find(
      (input) =>
        (input as HTMLInputElement).placeholder === "Enter your cover title...",
    ) as HTMLInputElement;

    fireEvent.change(imageNameInput, { target: { value: "test-cover" } });
    fireEvent.change(titleInput, { target: { value: "Test Title" } });

    expect(generateBtn).not.toBeDisabled();
  });

  it("shows selected values correctly in the form", () => {
    render(<CoverForm />);

    // Get all select elements
    const selects = screen.getAllByRole("combobox");

    // First select is size preset
    const sizeSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(sizeSelect, { target: { value: "Square (1080 × 1080)" } });
    expect(sizeSelect.value).toBe("Square (1080 × 1080)");

    // Last select is font
    const fontSelect = selects[selects.length - 1] as HTMLSelectElement;
    fireEvent.change(fontSelect, { target: { value: "Playfair Display" } });
    expect(fontSelect.value).toBe("Playfair Display");
  });
});
