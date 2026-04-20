import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		exclude: ["node_modules", "dist"],
		alias: {
			"@cover-craft/shared": path.resolve(__dirname, "../shared/index.ts"),
		},
	},
});
