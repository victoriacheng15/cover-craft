import type { AllowedFont } from "../shared/validators";

export interface FontDefinition {
	family: AllowedFont;
	file: string;
	weight?: string;
}

/**
 * Configuration mapping for server-side font registration.
 * Maps abstract font family names to specific .ttf asset files.
 *
 * Note: Family names must match FONT_OPTIONS in shared/validators.ts
 */
export const FONT_CONFIG: FontDefinition[] = [
	{ family: "Montserrat", file: "Montserrat-Regular.ttf" },
	{ family: "Montserrat", file: "Montserrat-Bold.ttf", weight: "bold" },
	{ family: "Roboto", file: "Roboto-Regular.ttf" },
	{ family: "Roboto", file: "Roboto-Bold.ttf", weight: "bold" },
	{ family: "Lato", file: "Lato-Regular.ttf" },
	{ family: "Lato", file: "Lato-Bold.ttf", weight: "bold" },
	{ family: "Playfair Display", file: "PlayfairDisplay-Regular.ttf" },
	{
		family: "Playfair Display",
		file: "PlayfairDisplay-Bold.ttf",
		weight: "bold",
	},
	{ family: "Open Sans", file: "OpenSans-Regular.ttf" },
	{ family: "Open Sans", file: "OpenSans-Bold.ttf", weight: "bold" },
];
