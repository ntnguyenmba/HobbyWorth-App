export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PRODUCT_IDS = new Set(["com.everittventures.hobbyworth.lifetime", "hobbyworth_lifetime"]);
  const PACKAGE_NAME = "com.everittventures.hobbyworth";
  const { productId, purchaseToken, packageName } = req.body || {};
  if (!PRODUCT_IDS.has(productId) || packageName !== PACKAGE_NAME || !purchaseToken) {
    return res.status(400).json({ error: "Invalid Google Play purchase" });
  }

  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const oidcToken = req.headers["x-vercel-oidc-token"] || process.env.VERCEL_OIDC_TOKEN;
  if (!projectNumber || !poolId || !providerId || !serviceAccountEmail || !oidcToken) {
    return res.status(503).json({ error: "Google keyless authentication is not configured" });
  }

  try {
    const audience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
    const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
        requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
        scope: "https://www.googleapis.com/auth/cloud-platform",
        subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
        subjectToken: oidcToken,
      }),
    });
    const sts = await stsResponse.json();
    if (!stsResponse.ok || !sts.access_token) throw new Error("STS failed");

    const impResponse = await fetch(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${sts.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: ["https://www.googleapis.com/auth/androidpublisher"],
          lifetime: "3600s",
        }),
      }
    );
    const imp = await impResponse.json();
    if (!impResponse.ok || !imp.accessToken) throw new Error("Impersonation failed");

    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${imp.accessToken}`, Accept: "application/json" },
    });
    const purchase = await response.json();
    if (!response.ok || Number(purchase.purchaseState ?? 0) !== 0) {
      return res.status(402).json({ error: "Google Play purchase is not completed" });
    }
    return res.status(200).json({ verified: true, orderId: purchase.orderId || null });
  } catch (error) {
    console.error("HobbyWorth Google verification failed", error);
    return res.status(503).json({ error: "Google Play purchase verification is unavailable" });
  }
}
