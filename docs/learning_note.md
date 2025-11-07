# 🧭 Learning Notes

Here's a summary of what I learned while building this full-stack cover image generator project.

---

## 🚀 Deploying Serverless APIs to Azure Function App

**Context:** I built a serverless image generation API and deployed it to Azure Function App to learn cloud deployment and serverless architecture patterns.

**What I Learned:**

- Azure Functions provides a serverless compute model where you only pay for execution time, not idle server time.
- Function App deployment requires proper authentication setup using service principals and GitHub secrets.
- Environment variables and sensitive configurations (like `local.settings.json`) must be managed carefully to avoid exposing credentials.
- Azure CLI commands can automate the deployment pipeline using config-zip for continuous deployment.

**Why It Matters:**

- Serverless architecture reduces operational overhead and infrastructure costs.
- Enables automatic scaling without manual server management.
- GitHub Actions integration allows fully automated CI/CD pipelines from code merge to production.
- Understanding cloud deployment is critical for modern application development.

**How I Applied It:**

- Created an Azure Function App resource named `cover-craft` in `personal-projects` resource group.
- Configured GitHub Actions workflow to automatically build, test, and deploy on push to main.
- Set up Azure service principal credentials in GitHub secrets for secure authentication.
- Implemented deployment zip creation that excludes sensitive configuration files.
- Deployed Node.js Canvas-based image generation as serverless functions.

**Challenges / Limitations:**

- Initial setup of Azure credentials and service principal requires careful configuration.
- Debugging serverless functions locally requires Azure Functions Core Tools installation.
- Cold start latency can be noticeable for infrequently used functions.
- Azure Function App pricing can increase with high concurrent request volume.

**Key Takeaways:**

- ✅ Serverless is ideal for event-driven workloads like image generation on demand.
- ✅ Automated CI/CD pipelines are essential for safe and consistent cloud deployments.
- ✅ Infrastructure as Code (via GitHub Actions workflows) makes deployments reproducible and auditable.
- ✅ Proper secret management is critical when deploying to cloud platforms.  