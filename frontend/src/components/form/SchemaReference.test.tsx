import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SchemaReference from "./SchemaReference";

describe("SchemaReference", () => {
	it("renders the summary text", () => {
		render(<SchemaReference />);
		expect(screen.getByText(/Schema Reference/i)).toBeInTheDocument();
	});

	it("renders all property definitions using semantic elements", () => {
		render(<SchemaReference />);

		const properties = [
			"title",
			"subtitle",
			"width",
			"height",
			"backgroundColor",
			"textColor",
			"font",
			"filename",
		];

		for (const prop of properties) {
			const dt = screen.getByText(prop);
			expect(dt.tagName).toBe("DT");
		}
	});

	it("has the correct ARIA attributes and structure for accessibility", () => {
		render(<SchemaReference />);

		// Check for description list
		const dl = screen.getByLabelText(/JSON Property Definitions/i);
		expect(dl.tagName).toBe("DL");

		// Check for specific property details
		const titleDescription = screen.getByText(
			/String \(Required, max 40 chars\)/i,
		);
		expect(titleDescription.tagName).toBe("DD");
	});
});
