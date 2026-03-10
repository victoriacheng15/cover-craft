"use client";

/**
 * SchemaReference component provides a quick documentation guide for the JSON schema
 * used in bulk image generation. It uses accessible HTML5 <details> and <summary> elements.
 * Optimized for screen readers and high contrast (WCAG AAA) using semantic <dl>, <dt>, and <dd>.
 */
export default function SchemaReference() {
	return (
		<details className="group text-xs bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all">
			<summary className="cursor-pointer font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 flex items-center gap-2 list-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded px-1 -mx-1 [&::-webkit-details-marker]:hidden">
				<span
					className="transform transition-transform group-open:rotate-90 inline-block w-3 text-center"
					aria-hidden="true"
				>
					▶
				</span>
				Schema Reference
			</summary>

			<div className="mt-4 flex flex-col gap-4">
				<header>
					<p className="text-gray-700 leading-relaxed font-medium">
						Each object in the JSON array represents one image. You can specify
						the following properties:
					</p>
				</header>

				<dl
					className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3"
					aria-label="JSON Property Definitions"
				>
					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							title
						</dt>
						<dd className="text-gray-700">String (Required, max 40 chars)</dd>
					</div>

					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							subtitle
						</dt>
						<dd className="text-gray-700">String (Optional, max 70 chars)</dd>
					</div>

					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							width
						</dt>
						<dd className="text-gray-700">Number (1-1200 pixels)</dd>
					</div>

					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							height
						</dt>
						<dd className="text-gray-700">Number (1-1200 pixels)</dd>
					</div>

					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							backgroundColor
						</dt>
						<dd className="text-gray-700">String (Valid HEX, e.g. #1E293B)</dd>
					</div>

					<div className="flex flex-col gap-0.5">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							textColor
						</dt>
						<dd className="text-gray-700">String (Valid HEX, e.g. #F8FAFC)</dd>
					</div>

					<div className="flex flex-col gap-0.5 sm:col-span-2">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							font
						</dt>
						<dd className="text-gray-700">
							Montserrat, Roboto, Lato, Playfair Display, or Open Sans
						</dd>
					</div>

					<div className="flex flex-col gap-0.5 sm:col-span-2">
						<dt className="font-mono text-emerald-900 font-bold text-sm">
							filename
						</dt>
						<dd className="text-gray-700">
							String (Optional, defaults to "cover")
						</dd>
					</div>
				</dl>
			</div>
		</details>
	);
}
