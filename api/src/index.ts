import { app } from "@azure/functions";
import "./functions/generateCoverImage";
import "./functions/healthCheck";
import "./functions/metrics";
import "./functions/analytics";

app.setup({
	enableHttpStream: true,
});
