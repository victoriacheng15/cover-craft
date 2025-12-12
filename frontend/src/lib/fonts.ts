import {
	Lato,
	Montserrat,
	Open_Sans,
	Playfair_Display,
	Roboto,
} from "next/font/google";

export const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const roboto = Roboto({
	variable: "--font-roboto",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const lato = Lato({
	variable: "--font-lato",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const openSans = Open_Sans({
	variable: "--font-open-sans",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const fontFamilyMap: Record<string, string> = {
	Montserrat: "var(--font-montserrat)",
	Roboto: "var(--font-roboto)",
	Lato: "var(--font-lato)",
	"Playfair Display": "var(--font-playfair-display)",
	"Open Sans": "var(--font-open-sans)",
};
