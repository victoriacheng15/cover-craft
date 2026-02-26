import type { HttpRequest } from "@azure/functions";
import type { ImageParams } from "@cover-craft/shared";
import type { createLogger } from "../lib/logger";

export async function extractParams(
	request: HttpRequest,
	logger: ReturnType<typeof createLogger>,
): Promise<Partial<ImageParams>> {
	const params: Partial<ImageParams> = {};

	const queryWidth = request.query.get("width");
	const queryHeight = request.query.get("height");
	const queryBgColor = request.query.get("backgroundColor");
	const queryTextColor = request.query.get("textColor");
	const queryFont = request.query.get("font");
	const queryTitle = request.query.get("title");
	const querySubtitle = request.query.get("subtitle");
	const queryFilename = request.query.get("filename");

	// Try to parse body
	let bodyParams: Partial<ImageParams> = {};
	try {
		const bodyText = await request.text();
		if (bodyText) {
			bodyParams = JSON.parse(bodyText);
		}
	} catch (error) {
		// Only ignore JSON parse errors, not text() errors
		if (error instanceof SyntaxError) {
			logger.warn(
				"Request body contained invalid JSON, falling back to query parameters.",
				{ error },
			);
		} else {
			// Re-throw text() or other unexpected errors
			logger.error("Error reading request body:", error);
			throw error;
		}
	}

	if (queryWidth != null) {
		params.width = Number(queryWidth);
	} else {
		params.width = bodyParams.width;
	}

	if (queryHeight != null) {
		params.height = Number(queryHeight);
	} else {
		params.height = bodyParams.height;
	}

	params.backgroundColor = queryBgColor || bodyParams.backgroundColor;
	params.textColor = queryTextColor || bodyParams.textColor;
	params.font = queryFont || bodyParams.font;
	params.title = queryTitle || bodyParams.title;
	params.subtitle = querySubtitle || bodyParams.subtitle;
	params.filename = queryFilename || bodyParams.filename;

	return params;
}
