import { app } from "@azure/functions";
import "./functions/generateCoverImage";
import "./functions/healthCheck";

app.setup({
	enableHttpStream: true,
});
