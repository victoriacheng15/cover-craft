"use client";

import { type AllowedFont, FONT_OPTIONS } from "@cover-craft/shared";
import { Select } from "@/components/ui";
import { FormField } from "./CoverFormControls";

export interface FontSelectProps {
	value: AllowedFont;
	onChange: (font: AllowedFont) => void;
	id?: string;
	label?: string;
	ariaLabel?: string;
	className?: string;
}

export function FontSelect({
	value,
	onChange,
	id = "font",
	label = "Font",
	ariaLabel = "Select font",
	className,
}: FontSelectProps) {
	return (
		<FormField label={label} htmlFor={id} className={className}>
			<Select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value as AllowedFont)}
				aria-label={ariaLabel}
			>
				{FONT_OPTIONS.map((f) => (
					<option key={f} value={f}>
						{f}
					</option>
				))}
			</Select>
		</FormField>
	);
}
