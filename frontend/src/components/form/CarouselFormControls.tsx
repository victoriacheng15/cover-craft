"use client";

import {
	CAROUSEL_LIMITS,
	getContrastRatio,
	isValidHexColor,
} from "@cover-craft/shared";
import {
	Button,
	Card,
	ColorPicker,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import type {
	CarouselDeckSettings,
	CarouselSlideItem,
} from "@/hooks/useCarouselForm";
import { FormField } from "./CoverFormControls";

export interface CarouselFormControlsProps {
	deckSettings: CarouselDeckSettings;
	slides: CarouselSlideItem[];
	activeSlideIndex: number;
	activeSlide: CarouselSlideItem;
	setActiveSlideIndex: (index: number) => void;
	addSlide: () => void;
	removeSlide: (index: number) => void;
	moveSlide: (fromIndex: number, toIndex: number) => void;
	updateSlide: (index: number, partial: Partial<CarouselSlideItem>) => void;
}

export function CarouselFormControls({
	deckSettings,
	slides,
	activeSlideIndex,
	activeSlide,
	setActiveSlideIndex,
	addSlide,
	removeSlide,
	moveSlide,
	updateSlide,
}: CarouselFormControlsProps) {
	// Check if active slide has color override
	const hasSlideColorOverride =
		Boolean(activeSlide.backgroundColor) || Boolean(activeSlide.textColor);

	const slideBg = activeSlide.backgroundColor || deckSettings.backgroundColor;
	const slideText = activeSlide.textColor || deckSettings.textColor;
	const rawSlideContrast =
		isValidHexColor(slideBg) && isValidHexColor(slideText)
			? getContrastRatio(slideBg, slideText)
			: 0;
	const slideContrast = rawSlideContrast ?? 0;

	// List item helpers
	const handleListItemChange = (itemIndex: number, value: string) => {
		const nextItems = [...activeSlide.listItems];
		nextItems[itemIndex] = value;
		updateSlide(activeSlideIndex, { listItems: nextItems });
	};

	const handleAddListItem = () => {
		if (activeSlide.listItems.length >= CAROUSEL_LIMITS.MAX_LIST_ITEMS) return;
		const nextItems = [...activeSlide.listItems, ""];
		updateSlide(activeSlideIndex, { listItems: nextItems });
	};

	const handleRemoveListItem = (itemIndex: number) => {
		if (activeSlide.listItems.length <= CAROUSEL_LIMITS.MIN_LIST_ITEMS) return;
		const nextItems = activeSlide.listItems.filter((_, i) => i !== itemIndex);
		updateSlide(activeSlideIndex, { listItems: nextItems });
	};

	return (
		<div className="flex-1 flex flex-col gap-6">
			<Card className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<SectionTitle size="md">
						Slides ({slides.length}/{CAROUSEL_LIMITS.MAX_SLIDES})
					</SectionTitle>
					<Button
						type="button"
						variant="outline"
						onClick={addSlide}
						disabled={slides.length >= CAROUSEL_LIMITS.MAX_SLIDES}
						aria-label="Add a new slide to the carousel"
					>
						+ Add Slide
					</Button>
				</div>

				{/* Filmstrip Tab Strip */}
				<div
					className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200"
					role="tablist"
					aria-label="Carousel slide filmstrip"
				>
					{slides.map((s, idx) => {
						const isSelected = idx === activeSlideIndex;
						return (
							<button
								key={s.id}
								type="button"
								role="tab"
								aria-selected={isSelected}
								onClick={() => setActiveSlideIndex(idx)}
								className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
									isSelected
										? "bg-emerald-600 text-white shadow-xs"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								<span>Slide {idx + 1}</span>
								{s.mode === "list" && (
									<span className="text-xs opacity-75">• list</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Active Slide Reordering & Delete Controls */}
				<div className="flex justify-between items-center">
					<div className="flex gap-2 items-center">
						<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
							Reorder:
						</span>
						<Button
							type="button"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() => moveSlide(activeSlideIndex, activeSlideIndex - 1)}
							disabled={activeSlideIndex === 0}
							aria-label={`Move slide ${activeSlideIndex + 1} left`}
						>
							◀ Left
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() => moveSlide(activeSlideIndex, activeSlideIndex + 1)}
							disabled={activeSlideIndex === slides.length - 1}
							aria-label={`Move slide ${activeSlideIndex + 1} right`}
						>
							Right ▶
						</Button>
					</div>

					<Button
						type="button"
						variant="outline"
						className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
						onClick={() => removeSlide(activeSlideIndex)}
						disabled={slides.length <= CAROUSEL_LIMITS.MIN_SLIDES}
						aria-label={`Delete slide ${activeSlideIndex + 1}`}
					>
						Delete Slide
					</Button>
				</div>
			</Card>

			{/* Slide Content Editor */}
			<Card className="flex flex-col gap-4">
				<div className="flex justify-between items-center border-b border-gray-200 pb-2">
					<SectionTitle size="sm" as="h3">
						Slide {activeSlideIndex + 1} Content
					</SectionTitle>
				</div>

				{/* Title */}
				<FormField
					label="Slide Title"
					htmlFor={`slide-title-${activeSlideIndex}`}
					required
				>
					<Input
						id={`slide-title-${activeSlideIndex}`}
						placeholder="E.g., Core Architectural Insights"
						value={activeSlide.title}
						onChange={(e) =>
							updateSlide(activeSlideIndex, { title: e.target.value })
						}
						maxLength={CAROUSEL_LIMITS.MAX_TITLE_LENGTH}
						aria-label="Slide title"
					/>
					<div className="flex justify-end text-xs text-gray-500 mt-1">
						{activeSlide.title.length} / {CAROUSEL_LIMITS.MAX_TITLE_LENGTH}
					</div>
				</FormField>

				{/* Mode Switcher: Subtitle vs Bulleted List */}
				<div className="flex flex-col gap-1.5">
					<span className="block text-sm font-medium text-gray-900">
						Content Mode
					</span>
					<div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit gap-1">
						<button
							type="button"
							aria-pressed={activeSlide.mode === "subtitle"}
							onClick={() =>
								updateSlide(activeSlideIndex, { mode: "subtitle" })
							}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								activeSlide.mode === "subtitle"
									? "bg-white text-emerald-700 shadow-xs font-bold"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							Subtitle
						</button>
						<button
							type="button"
							aria-pressed={activeSlide.mode === "list"}
							onClick={() => updateSlide(activeSlideIndex, { mode: "list" })}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								activeSlide.mode === "list"
									? "bg-white text-emerald-700 shadow-xs font-bold"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							Bulleted List (2-5 items)
						</button>
					</div>
				</div>

				{/* Subtitle Field */}
				{activeSlide.mode === "subtitle" && (
					<FormField
						label="Slide Subtitle"
						htmlFor={`slide-sub-${activeSlideIndex}`}
					>
						<textarea
							id={`slide-sub-${activeSlideIndex}`}
							rows={3}
							className="flex w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
							placeholder="A clear, concise summary of this slide's takeaway..."
							value={activeSlide.subtitle}
							onChange={(e) =>
								updateSlide(activeSlideIndex, { subtitle: e.target.value })
							}
							maxLength={CAROUSEL_LIMITS.MAX_SUBTITLE_LENGTH}
							aria-label="Slide subtitle text"
						/>
						<div className="flex justify-end text-xs text-gray-500 mt-1">
							{activeSlide.subtitle.length} /{" "}
							{CAROUSEL_LIMITS.MAX_SUBTITLE_LENGTH}
						</div>
					</FormField>
				)}

				{/* Bulleted List Fields */}
				{activeSlide.mode === "list" && (
					<div className="flex flex-col gap-3">
						<div className="flex justify-between items-center">
							<span className="text-sm font-medium text-gray-900">
								Bullet Points ({activeSlide.listItems.length}/
								{CAROUSEL_LIMITS.MAX_LIST_ITEMS})
							</span>
							<Button
								type="button"
								variant="outline"
								className="h-7 px-2.5 text-xs"
								onClick={handleAddListItem}
								disabled={
									activeSlide.listItems.length >= CAROUSEL_LIMITS.MAX_LIST_ITEMS
								}
								aria-label="Add bullet item"
							>
								+ Add Item
							</Button>
						</div>

						<div className="flex flex-col gap-2">
							{activeSlide.listItems.map((item, itemIdx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: list item order is by index
									key={`item-${itemIdx}`}
									className="flex items-center gap-2"
								>
									<span className="text-gray-400 font-bold">•</span>
									<Input
										value={item}
										placeholder={`Bullet point ${itemIdx + 1}`}
										onChange={(e) =>
											handleListItemChange(itemIdx, e.target.value)
										}
										maxLength={CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH}
										aria-label={`Bullet point ${itemIdx + 1}`}
									/>
									<span className="text-xs text-gray-400 w-12 text-right">
										{item.length}/{CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH}
									</span>
									<button
										type="button"
										onClick={() => handleRemoveListItem(itemIdx)}
										disabled={
											activeSlide.listItems.length <=
											CAROUSEL_LIMITS.MIN_LIST_ITEMS
										}
										className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 text-sm"
										aria-label={`Remove bullet point ${itemIdx + 1}`}
									>
										✕
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Alignment Controls */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
					<FormField
						label="Horizontal Alignment"
						htmlFor={`slide-halign-${activeSlideIndex}`}
					>
						<Select
							id={`slide-halign-${activeSlideIndex}`}
							value={activeSlide.textAlign}
							onChange={(e) =>
								updateSlide(activeSlideIndex, {
									textAlign: e.target.value as "left" | "center" | "right",
								})
							}
							aria-label="Horizontal text alignment"
						>
							<option value="left">Left</option>
							<option value="center">Center</option>
							<option value="right">Right</option>
						</Select>
					</FormField>

					<FormField
						label="Vertical Alignment"
						htmlFor={`slide-valign-${activeSlideIndex}`}
					>
						<Select
							id={`slide-valign-${activeSlideIndex}`}
							value={activeSlide.verticalAlign}
							onChange={(e) =>
								updateSlide(activeSlideIndex, {
									verticalAlign: e.target.value as "top" | "center" | "bottom",
								})
							}
							aria-label="Vertical content alignment"
						>
							<option value="top">Top</option>
							<option value="center">Center</option>
							<option value="bottom">Bottom</option>
						</Select>
					</FormField>
				</div>

				{/* Optional Slide Color Override */}
				<div className="pt-2 border-t border-gray-200 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<input
								id={`slide-override-${activeSlideIndex}`}
								type="checkbox"
								checked={hasSlideColorOverride}
								onChange={(e) => {
									if (e.target.checked) {
										updateSlide(activeSlideIndex, {
											backgroundColor: deckSettings.backgroundColor,
											textColor: deckSettings.textColor,
										});
									} else {
										updateSlide(activeSlideIndex, {
											backgroundColor: undefined,
											textColor: undefined,
										});
									}
								}}
								className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
							/>
							<label
								htmlFor={`slide-override-${activeSlideIndex}`}
								className="text-sm font-medium text-gray-900"
							>
								Custom Colors for Slide {activeSlideIndex + 1}
							</label>
						</div>

						{hasSlideColorOverride && (
							<button
								type="button"
								onClick={() =>
									updateSlide(activeSlideIndex, {
										backgroundColor: undefined,
										textColor: undefined,
									})
								}
								className="text-xs text-emerald-600 hover:text-emerald-700 underline"
							>
								Reset to Deck Colors
							</button>
						)}
					</div>

					{hasSlideColorOverride && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-100/60 p-3 rounded-xl border border-gray-200">
							<FormField
								label="Slide Background"
								htmlFor={`slide-bg-${activeSlideIndex}`}
							>
								<ColorPicker
									id={`slide-bg-${activeSlideIndex}`}
									value={slideBg}
									onChange={(e) =>
										updateSlide(activeSlideIndex, {
											backgroundColor: e.target.value,
										})
									}
									title="Choose background color for this slide"
									aria-label="Slide background color picker"
								/>
							</FormField>

							<FormField
								label="Slide Text Color"
								htmlFor={`slide-text-${activeSlideIndex}`}
							>
								<ColorPicker
									id={`slide-text-${activeSlideIndex}`}
									value={slideText}
									onChange={(e) =>
										updateSlide(activeSlideIndex, {
											textColor: e.target.value,
										})
									}
									title="Choose text color for this slide"
									aria-label="Slide text color picker"
								/>
							</FormField>

							<div className="sm:col-span-2 text-xs">
								<span
									className={`font-semibold ${slideContrast >= 4.5 ? "text-emerald-700" : "text-amber-700"}`}
								>
									Contrast ratio: {slideContrast.toFixed(2)}:1{" "}
									{slideContrast >= 4.5
										? "(WCAG AA Compliant)"
										: "(Low Contrast)"}
								</span>
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
