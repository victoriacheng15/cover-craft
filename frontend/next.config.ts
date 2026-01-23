import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	transpilePackages: ["@cover-craft/shared"],
};

export default nextConfig;
