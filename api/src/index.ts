import { app } from "@azure/functions";
import "./functions/generateImage";
import "./functions/healthCheck";
import "./functions/metrics";
import "./functions/analytics";

app.setup({
	enableHttpStream: true,
});
