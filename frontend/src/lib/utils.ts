import { SIZE_PRESETS } from "@cover-craft/shared";

export function cn(...classes: (string | undefined | null | false)[]) {
	return classes.filter(Boolean).join(" ");
}

export function calculatePreviewDimensions(sizeLabel: string) {
	const selectedSize = SIZE_PRESETS.find(
		(preset) => preset.label === sizeLabel,
	);

	if (!selectedSize) {
		return {
			width: SIZE_PRESETS[0].width * 0.5,
			height: SIZE_PRESETS[0].height * 0.5,
		};
	}

	return {
		width: selectedSize.width * 0.5,
		height: selectedSize.height * 0.5,
	};
}
