import { Button, ColorPicker } from "@/components/ui";
import type { FormData } from "@/hooks/useForm";
import FormField from "./FormField";

interface ColorControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string) => void;
	handleRandomizeColors: () => void;
}

export default function ColorControls({
	formData,
	handleInputChange,
	handleRandomizeColors,
}: ColorControlsProps) {
	return (
		<div className="flex gap-10 items-end">
			<div className="flex-1">
				<FormField label="Background Color" htmlFor="background-color">
					<ColorPicker
						id="background-color"
						value={formData.backgroundColor}
						onChange={(e) =>
							handleInputChange("backgroundColor", e.target.value)
						}
						title="Choose background color for your cover"
						aria-label="Background color picker"
					/>
				</FormField>
			</div>

			<div className="flex-1">
				<FormField label="Text Color" htmlFor="text-color">
					<ColorPicker
						id="text-color"
						value={formData.textColor}
						onChange={(e) => handleInputChange("textColor", e.target.value)}
						title="Choose text color for your cover"
						aria-label="Text color picker"
					/>
				</FormField>
			</div>

			<Button
				variant="outline"
				onClick={handleRandomizeColors}
				aria-label="Randomize background and text colors"
				type="button"
				className="flex-shrink-0"
			>
				Randomize Colors
			</Button>
		</div>
	);
}
