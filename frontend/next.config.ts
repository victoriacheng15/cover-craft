import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	reactCompiler: true,
	transpilePackages: ["@cover-craft/shared"],
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
