"use client";

import type React from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
	value: T;
	label: string;
	ariaLabel?: string;
}

export interface SegmentedGroupProps<T extends string> {
	label: string;
	options: Array<SegmentedOption<T>>;
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
}

export function SegmentedGroup<T extends string>({
	label,
	options,
	value,
	onChange,
	disabled = false,
	id,
	className,
}: SegmentedGroupProps<T>) {
	const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLButtonElement>,
		currentIndex: number,
	) => {
		if (disabled || options.length <= 1) return;

		let targetIndex = -1;
		switch (e.key) {
			case "ArrowRight":
			case "ArrowDown":
				e.preventDefault();
				targetIndex = (currentIndex + 1) % options.length;
				break;
			case "ArrowLeft":
			case "ArrowUp":
				e.preventDefault();
				targetIndex = (currentIndex - 1 + options.length) % options.length;
				break;
			case "Home":
				e.preventDefault();
				targetIndex = 0;
				break;
			case "End":
				e.preventDefault();
				targetIndex = options.length - 1;
				break;
		}

		if (targetIndex >= 0) {
			const targetOption = options[targetIndex];
			onChange(targetOption.value);
			buttonRefs.current[targetIndex]?.focus();
		}
	};

	return (
		<fieldset
			id={id}
			className={cn("flex flex-col gap-1.5 border-0 p-0 m-0", className)}
			disabled={disabled}
		>
			<legend className="block text-sm font-medium text-gray-900">
				{label}
			</legend>
			<div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit gap-1 flex-wrap">
				{options.map((option, index) => {
					const isActive = option.value === value;
					return (
						<button
							key={option.value}
							ref={(el) => {
								buttonRefs.current[index] = el;
							}}
							type="button"
							aria-pressed={isActive}
							aria-label={option.ariaLabel || option.label}
							disabled={disabled}
							onClick={() => onChange(option.value)}
							onKeyDown={(e) => handleKeyDown(e, index)}
							className={cn(
								"px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
								"disabled:opacity-50 disabled:cursor-not-allowed",
								isActive
									? "bg-white text-emerald-700 shadow-xs font-bold"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
							)}
						>
							{option.label}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
