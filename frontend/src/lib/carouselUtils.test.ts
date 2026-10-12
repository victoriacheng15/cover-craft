import { describe, expect, it } from "vitest";
import { detectBulletList, detectTextDiagram } from "./carouselUtils";

describe("detectBulletList", () => {
	it("returns null for empty or single line text", () => {
		expect(detectBulletList("")).toBeNull();
		expect(detectBulletList("Single line subtitle")).toBeNull();
	});

	it("detects dash-prefixed bullet lists and cleans markers", () => {
		const text = "- First item\n- Second item\n- Third item";
		const result = detectBulletList(text);
		expect(result).toEqual(["First item", "Second item", "Third item"]);
	});

	it("detects asterisk and unicode bullet-prefixed lists", () => {
		const text = "• Step A\n• Step B";
		const result = detectBulletList(text);
		expect(result).toEqual(["Step A", "Step B"]);
	});

	it("detects numbered lists", () => {
		const text = "1. Scalability\n2. Reliability\n3. Observability";
		const result = detectBulletList(text);
		expect(result).toEqual(["Scalability", "Reliability", "Observability"]);
	});

	it("clamps to a maximum of 5 items", () => {
		const text = "- 1\n- 2\n- 3\n- 4\n- 5\n- 6\n- 7";
		const result = detectBulletList(text);
		expect(result).toHaveLength(5);
		expect(result).toEqual(["1", "2", "3", "4", "5"]);
	});

	it("returns null if fewer than 2 items are detected", () => {
		const text = "- Only one valid bullet";
		expect(detectBulletList(text)).toBeNull();
	});
});

describe("detectTextDiagram", () => {
	it("returns null for non-diagram text", () => {
		expect(detectTextDiagram("")).toBeNull();
		expect(
			detectTextDiagram("This is just a regular sentence with no arrows."),
		).toBeNull();
	});

	it("detects vertical text diagrams and extracts pipeline nodes", () => {
		const diagram = `EventBridge
↓
ECS Fargate (Extractor)
↓
SNS → SQS
↓
AWS Lambda (DynamoDB)
↓
Discord Webhook`;

		const result = detectTextDiagram(diagram);
		expect(result).not.toBeNull();
		expect(result?.isDiagram).toBe(true);
		expect(result?.steps).toEqual([
			"EventBridge",
			"ECS Fargate (Extractor)",
			"SNS → SQS",
			"AWS Lambda (DynamoDB)",
			"Discord Webhook",
		]);
	});

	it("detects other arrow separators like v, |, and ->", () => {
		const diagram = `Frontend
->
API Gateway
->
Database`;

		const result = detectTextDiagram(diagram);
		expect(result).not.toBeNull();
		expect(result?.steps).toEqual(["Frontend", "API Gateway", "Database"]);
	});

	it("clamps extracted steps to maximum 5 items", () => {
		const diagram = "A\n↓\nB\n↓\nC\n↓\nD\n↓\nE\n↓\nF\n↓\nG";
		const result = detectTextDiagram(diagram);
		expect(result?.steps).toHaveLength(5);
		expect(result?.steps).toEqual(["A", "B", "C", "D", "E"]);
	});
});
