#!/usr/bin/env bash
# gcp-initial-project-setup.sh
# One-time setup script for GCP project: enables APIs, creates Artifact Registry,
# stores secrets in Secret Manager, and configures Workload Identity Federation
# for GitHub Actions (no long-lived service account key files needed).
#
# Prerequisites:
#   - gcloud CLI installed and authenticated: gcloud auth login
#   - Billing enabled on the GCP project
#   - GitHub repo set in GITHUB_REPO var below
#
# Usage:
#   GCP_PROJECT_ID=your-project-id GITHUB_REPO=your-org/your-repo bash scripts/gcp-initial-project-setup.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID env var}"
GITHUB_REPO="${GITHUB_REPO:?Set GITHUB_REPO env var (e.g. myorg/crowdpulse)}"
REGION="us-central1"
REPO_NAME="crowdpulse"
SERVICE_ACCOUNT="crowdpulse-deployer"
WIF_POOL="github-pool"
WIF_PROVIDER="github-provider"

echo "==> Setting up GCP project: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# ── Enable required APIs ──────────────────────────────────────────────────────
echo "==> Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com

# ── Artifact Registry ─────────────────────────────────────────────────────────
echo "==> Creating Artifact Registry repository: $REPO_NAME"
gcloud artifacts repositories create "$REPO_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --description="CrowdPulse Docker images" \
  || echo "Repository already exists, skipping."

# ── Service Account ───────────────────────────────────────────────────────────
echo "==> Creating service account: $SERVICE_ACCOUNT"
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
  --display-name="CrowdPulse GitHub Actions deployer" \
  || echo "Service account already exists, skipping."

SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant required roles
for ROLE in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" --quiet
done

# ── Workload Identity Federation ──────────────────────────────────────────────
echo "==> Configuring Workload Identity Federation for GitHub Actions..."

gcloud iam workload-identity-pools create "$WIF_POOL" \
  --location="global" \
  --display-name="GitHub Actions pool" \
  || echo "Pool already exists, skipping."

gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER" \
  --location="global" \
  --workload-identity-pool="$WIF_POOL" \
  --display-name="GitHub OIDC provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  || echo "Provider already exists, skipping."

POOL_NAME=$(gcloud iam workload-identity-pools describe "$WIF_POOL" \
  --location="global" --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${GITHUB_REPO}"

WIF_PROVIDER_FULL="${POOL_NAME}/providers/${WIF_PROVIDER}"

echo ""
echo "==> Add these GitHub Actions secrets to your repository:"
echo "    GCP_PROJECT_ID  = $PROJECT_ID"
echo "    WIF_PROVIDER    = $WIF_PROVIDER_FULL"
echo "    WIF_SA          = $SA_EMAIL"

# ── Secret Manager — create empty secrets (fill values manually) ──────────────
echo ""
echo "==> Creating Secret Manager secrets (fill values after creation)..."

for SECRET in DATABASE_URL REDIS_URL TELEGRAM_BOT_TOKEN \
              REDDIT_CLIENT_ID REDDIT_CLIENT_SECRET \
              REDDIT_USERNAME REDDIT_PASSWORD; do
  gcloud secrets create "$SECRET" --replication-policy="automatic" \
    || echo "Secret $SECRET already exists, skipping."
  echo "    Run: echo -n 'YOUR_VALUE' | gcloud secrets versions add $SECRET --data-file=-"
done

echo ""
echo "==> Setup complete. Next steps:"
echo "    1. Fill in secret values with 'gcloud secrets versions add'"
echo "    2. Add GitHub Actions secrets: GCP_PROJECT_ID, WIF_PROVIDER, WIF_SA"
echo "    3. Push to main branch to trigger deployment"
echo ""
echo "==> Free-tier alternatives (no GCP billing required for DB/Redis):"
echo "    Postgres: https://neon.tech  (free tier, serverless)"
echo "    Redis:    https://upstash.com (free tier, serverless)"
