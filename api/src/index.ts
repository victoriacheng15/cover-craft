import { app } from "@azure/functions";
import "./functions/generateImage";
import "./functions/healthCheck";
import "./functions/metrics";
import "./functions/analytics";
import "./functions/generateImages";
import "./functions/getJobStatus";
import "./functions/processJobs";

app.setup({
	enableHttpStream: true,
});
