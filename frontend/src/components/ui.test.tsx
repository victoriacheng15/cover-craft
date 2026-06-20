import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	Button,
	Card,
	ColorPicker,
	Input,
	KPICard,
	SectionTitle,
	Select,
	Skeleton,
} from "./ui";

// ===================================================================================
// Button Component Tests
// ===================================================================================

// Component signature:
// export function Button({
// 	variant = "primary",
// 	className,
// 	disabled,
// 	isLoading = false,
// 	children,
// 	...props
// }: ButtonProps)

describe("Button", () => {
	it("renders basic button with children", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: "Click me" }),
		).toBeInTheDocument();
	});

	it("shows loading state when isLoading is true", () => {
		render(<Button isLoading>Submit</Button>);
		expect(screen.getByText("⏳")).toBeInTheDocument();
	});

	it("applies primary styles by default", () => {
		render(<Button>Primary</Button>);
		const btn = screen.getByRole("button", { name: "Primary" });
		expect(btn).toHaveClass("bg-emerald-500");
	});
});

// ===================================================================================
// Card Components Tests (Card, KPICard)
// ===================================================================================

// Component signature:
// export function Card({ className, children, ...props }: CardProps)

describe("Card", () => {
	it("renders children correctly", () => {
		render(
			<Card>
				<p>Card content</p>
			</Card>,
		);

		expect(screen.getByText("Card content")).toBeInTheDocument();
	});

	it("applies additional className", () => {
		render(
			<Card className="custom-class">
				<p>Styled card</p>
			</Card>,
		);

		const cardElement = screen.getByText("Styled card").parentElement;
		expect(cardElement).toHaveClass("custom-class");
	});
});

// Component signature:
// export function KPICard({
// 	title,
// 	value,
// 	color,
// 	suffix,
// 	bold = true,
// }: KPICardProps)

describe("KPICard", () => {
	it("renders title and value correctly", () => {
		render(<KPICard title="Test Metric" value={100} color="blue" />);

		expect(screen.getByText("Test Metric")).toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
	});

	it("formats numeric values to whole numbers", () => {
		render(<KPICard title="Percentage" value={75.567} color="green" />);

		expect(screen.getByText("76")).toBeInTheDocument();
	});

	it("displays string values as-is", () => {
		render(<KPICard title="String Value" value="1478.50" color="purple" />);

		expect(screen.getByText("1478.50")).toBeInTheDocument();
	});

	it("appends suffix correctly", () => {
		render(
			<KPICard title="Success Rate" value={95.5} color="orange" suffix="%" />,
		);

		expect(screen.getByText(/^96/)).toBeInTheDocument();
	});

	it("applies correct color styling for blue", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="blue" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-blue-50");
		expect(screen.getByText("100")).toHaveClass("text-blue-600");
	});

	it("applies correct color styling for green", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="green" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-green-50");
		expect(screen.getByText("100")).toHaveClass("text-green-600");
	});

	it("applies correct color styling for red", () => {
		const { container } = render(
			<KPICard title="Failure Rate" value={5} color="red" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-red-50");
		expect(screen.getByText("5")).toHaveClass("text-red-600");
	});

	it("applies correct color styling for white", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="white" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-white");
		expect(card).toHaveClass("border");
		expect(screen.getByText("100")).toHaveClass("text-gray-900");
	});

	it("applies bold font by default", () => {
		render(<KPICard title="Metric" value={100} color="blue" />);

		expect(screen.getByText("100")).toHaveClass("font-bold");
	});

	it("applies semibold font when bold is false", () => {
		render(<KPICard title="Metric" value={100} color="blue" bold={false} />);

		expect(screen.getByText("100")).toHaveClass("font-semibold");
	});

	it("handles all color variants", () => {
		const colors = [
			"blue",
			"green",
			"purple",
			"orange",
			"indigo",
			"pink",
			"red",
			"white",
		] as const;

		colors.forEach((color) => {
			const { unmount } = render(
				<KPICard title={`${color} card`} value={100} color={color} />,
			);

			expect(screen.getByText(`${color} card`)).toBeInTheDocument();
			unmount();
		});
	});

	it("handles zero value correctly", () => {
		render(<KPICard title="Zero Value" value={0} color="blue" />);

		expect(screen.getByText("0")).toBeInTheDocument();
	});

	it("combines suffix with formatted value", () => {
		render(
			<KPICard title="Duration" value={1478.9} color="white" suffix="ms" />,
		);

		expect(screen.getByText(/1479ms/)).toBeInTheDocument();
	});
});

// ===================================================================================
// Form Controls Components Tests (Input, Select, ColorPicker)
// ===================================================================================

// Component signature:
// export function Input({ className, type = "text", ...props }: InputProps)

describe("Input", () => {
	it("renders correctly", () => {
		render(<Input data-testid="input-field" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input).toBeInTheDocument();
	});

	it("renders with default type text", () => {
		render(<Input data-testid="input-field" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.type).toBe("text");
	});

	it("renders with custom type", () => {
		render(<Input data-testid="input-field" type="email" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.type).toBe("email");
	});

	it("renders with placeholder", () => {
		render(<Input data-testid="input-field" placeholder="Enter text" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.placeholder).toBe("Enter text");
	});

	it("applies additional className", () => {
		render(<Input data-testid="input-field" className="custom-class" />);
		const input = screen.getByTestId("input-field");
		expect(input).toHaveClass("custom-class");
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<Input data-testid="input-field" value="test" onChange={handleChange} />,
		);

		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.value).toBe("test");

		fireEvent.change(input, { target: { value: "new value" } });
		expect(handleChange).toHaveBeenCalled();
	});

	it("is disabled when disabled prop is set", () => {
		render(<Input data-testid="input-field" disabled />);
		const input = screen.getByTestId("input-field");
		expect(input).toBeDisabled();
	});

	it("renders with required attribute", () => {
		render(<Input data-testid="input-field" required />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.required).toBe(true);
	});
});

// Component signature:
// export function Select({ className, children, ...props }: SelectProps)

describe("Select", () => {
	it("renders correctly", () => {
		render(
			<Select data-testid="select-field">
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field");
		expect(select).toBeInTheDocument();
	});

	it("renders with children options", () => {
		render(
			<Select data-testid="select-field">
				<option>Option 1</option>
				<option>Option 2</option>
				<option>Option 3</option>
			</Select>,
		);
		expect(screen.getByText("Option 1")).toBeInTheDocument();
		expect(screen.getByText("Option 2")).toBeInTheDocument();
		expect(screen.getByText("Option 3")).toBeInTheDocument();
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<Select
				data-testid="select-field"
				value="option1"
				onChange={handleChange}
			>
				<option value="option1">Option 1</option>
				<option value="option2">Option 2</option>
			</Select>,
		);

		const select = screen.getByTestId("select-field") as HTMLSelectElement;
		expect(select.value).toBe("option1");

		fireEvent.change(select, { target: { value: "option2" } });
		expect(handleChange).toHaveBeenCalled();
	});
});

// Component signature:
// export function ColorPicker({ className, title, ...props }: ColorPickerProps)

describe("ColorPicker", () => {
	it("renders correctly", () => {
		render(<ColorPicker data-testid="color-input" />);
		const input = screen.getByTestId("color-input") as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.type).toBe("color");
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<ColorPicker
				data-testid="color-input"
				value="#ff0000"
				onChange={handleChange}
			/>,
		);

		const input = screen.getByTestId("color-input") as HTMLInputElement;
		expect(input.value).toBe("#ff0000");

		fireEvent.change(input, { target: { value: "#00ff00" } });
		expect(handleChange).toHaveBeenCalled();
	});
});

// ===================================================================================
// SectionTitle Component Tests
// ===================================================================================

// Component signature:
// export function SectionTitle({
// 	className,
// 	size = "md",
// 	as = "h2",
// 	children,
// 	...props
// }: SectionTitleProps)

describe("SectionTitle", () => {
	it("renders correctly", () => {
		render(<SectionTitle>Test Title</SectionTitle>);
		expect(screen.getByText("Test Title")).toBeInTheDocument();
	});

	it("renders as h1 element", () => {
		render(<SectionTitle as="h1">Test Title</SectionTitle>);
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toBeInTheDocument();
	});

	it("renders with default md size", () => {
		render(<SectionTitle data-testid="title">Test Title</SectionTitle>);
		const title = screen.getByTestId("title");
		expect(title).toHaveClass("text-2xl");
		expect(title).toHaveClass("font-bold");
	});

	it("renders with sm size", () => {
		render(
			<SectionTitle data-testid="title" size="sm">
				Test Title
			</SectionTitle>,
		);
		const title = screen.getByTestId("title");
		expect(title).toHaveClass("text-lg");
		expect(title).toHaveClass("font-bold");
	});

	it("renders with lg size", () => {
		render(
			<SectionTitle data-testid="title" size="lg">
				Test Title
			</SectionTitle>,
		);
		const title = screen.getByTestId("title");
		expect(title).toHaveClass("text-3xl");
	});
});

// ===================================================================================
// Skeleton Component Tests
// ===================================================================================

// Component signature:
// export function Skeleton({ className, ...props }: SkeletonProps)

describe("Skeleton", () => {
	it("renders correctly with default styles", () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.firstChild as HTMLElement;
		expect(skeleton).toHaveClass("animate-pulse");
		expect(skeleton).toHaveClass("bg-gray-200");
		expect(skeleton).toHaveClass("rounded-md");
	});
});
