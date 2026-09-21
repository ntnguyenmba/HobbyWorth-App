import crypto from "node:crypto";

const PRODUCT_IDS = new Set([
  "com.everittventures.hobbyworth.lifetime",
  "hobbyworth_lifetime",
]);
const PACKAGE_NAME = "com.everittventures.hobbyworth";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function loadServiceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || "";
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function workloadIdentityConfig() {
  const projectNumber = (process.env.GCP_PROJECT_NUMBER || "").trim();
  const poolId = (process.env.GCP_WORKLOAD_IDENTITY_POOL_ID || "").trim();
  const providerId = (process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID || "").trim();
  const serviceAccountEmail = (process.env.GCP_SERVICE_ACCOUNT_EMAIL || "").trim();
  if (!projectNumber || !poolId || !providerId || !serviceAccountEmail) return null;
  return { projectNumber, poolId, providerId, serviceAccountEmail };
}

async function getLegacyAccessToken() {
  const sa = loadServiceAccount();
  if (!sa) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured");

  const now = Math.floor(Date.now() / 1000);
  const tokenUrl = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: tokenUrl,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const assertion = `${signingInput}.${base64url(signer.sign(sa.private_key))}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Google service-account authentication failed");
  }
  return data.access_token;
}

async function getKeylessAccessToken(req) {
  const cfg = workloadIdentityConfig();
  const oidcToken =
    req.headers["x-vercel-oidc-token"] ||
    process.env.VERCEL_OIDC_TOKEN ||
    "";
  if (!cfg || !oidcToken) return null;

  const audience =
    `//iam.googleapis.com/projects/${cfg.projectNumber}/locations/global/workloadIdentityPools/${cfg.poolId}/providers/${cfg.providerId}`;

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
  if (!stsResponse.ok || !sts.access_token) throw new Error("Google STS token exchange failed");

  const impersonation = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(
      cfg.serviceAccountEmail
    )}:generateAccessToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sts.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scope: [SCOPE],
        lifetime: "3600s",
      }),
    }
  );
  const token = await impersonation.json();
  if (!impersonation.ok || !token.accessToken) {
    throw new Error("Google service-account impersonation failed");
  }
  return token.accessToken;
}

async function getAccessToken(req) {
  const keyless = await getKeylessAccessToken(req);
  if (keyless) return keyless;

  if (loadServiceAccount()) {
    return getLegacyAccessToken();
  }

  throw new Error(
    "Google Play authentication is not configured. Add GOOGLE_PLAY_SERVICE_ACCOUNT_JSON or the GCP keyless variables."
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productId, purchaseToken, packageName } = req.body || {};
  if (!PRODUCT_IDS.has(productId) || packageName !== PACKAGE_NAME || !purchaseToken) {
    return res.status(400).json({ error: "Invalid Google Play purchase" });
  }

  try {
    const accessToken = await getAccessToken(req);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
        PACKAGE_NAME
      )}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
        purchaseToken
      )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const purchase = await response.json();

    if (!response.ok || Number(purchase.purchaseState ?? 0) !== 0) {
      return res.status(402).json({
        error: "Google Play purchase is not completed",
      });
    }

    return res.status(200).json({
      verified: true,
      orderId: purchase.orderId || null,
    });
  } catch (error) {
    console.error("HobbyWorth Google verification failed", error);
    return res.status(503).json({
      error: "Google Play purchase verification is unavailable",
    });
  }
}
