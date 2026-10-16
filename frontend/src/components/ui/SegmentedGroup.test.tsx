import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedGroup } from "./SegmentedGroup";

const sampleOptions = [
	{ value: "none", label: "None" },
	{ value: "solid", label: "Solid" },
	{ value: "dashed", label: "Dashed" },
];

describe("SegmentedGroup", () => {
	it("renders legend and option buttons", () => {
		render(
			<SegmentedGroup
				label="Border Pattern"
				options={sampleOptions}
				value="none"
				onChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Border Pattern")).toBeInTheDocument();
		expect(
			screen.getByRole("group", { name: "Border Pattern" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "None" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Solid" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("triggers onChange when button is clicked", () => {
		const handleChange = vi.fn();
		render(
			<SegmentedGroup
				label="Border Pattern"
				options={sampleOptions}
				value="none"
				onChange={handleChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Solid" }));
		expect(handleChange).toHaveBeenCalledWith("solid");
	});

	it("supports keyboard arrow navigation", () => {
		const handleChange = vi.fn();
		render(
			<SegmentedGroup
				label="Border Pattern"
				options={sampleOptions}
				value="solid"
				onChange={handleChange}
			/>,
		);

		const solidBtn = screen.getByRole("button", { name: "Solid" });
		fireEvent.keyDown(solidBtn, { key: "ArrowRight" });
		expect(handleChange).toHaveBeenCalledWith("dashed");

		fireEvent.keyDown(solidBtn, { key: "ArrowLeft" });
		expect(handleChange).toHaveBeenCalledWith("none");

		fireEvent.keyDown(solidBtn, { key: "End" });
		expect(handleChange).toHaveBeenCalledWith("dashed");

		fireEvent.keyDown(solidBtn, { key: "Home" });
		expect(handleChange).toHaveBeenCalledWith("none");
	});

	it("disables all buttons when disabled prop is true", () => {
		render(
			<SegmentedGroup
				label="Border Multiplicity"
				options={[
					{ value: "single", label: "Single" },
					{ value: "double", label: "Double" },
				]}
				value="single"
				onChange={vi.fn()}
				disabled={true}
			/>,
		);

		expect(screen.getByRole("button", { name: "Single" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Double" })).toBeDisabled();
	});
});
