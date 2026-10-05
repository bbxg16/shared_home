/**
 * Google Apps Script mailer for 有本要奏 / Request & Report.
 *
 * Setup:
 * 1. Create a Google Cloud service account in the same project as Firebase.
 * 2. Grant it "Cloud Datastore User".
 * 3. Create a JSON key.
 * 4. In Apps Script, add script properties:
 *    FIREBASE_PROJECT_ID = shared-home-48f90
 *    SERVICE_ACCOUNT_EMAIL = ...@...iam.gserviceaccount.com
 *    SERVICE_ACCOUNT_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 * 5. Run processEmailNotifications once and approve Gmail/URL fetch permissions.
 * 6. Add a time-driven trigger, for example every 5 minutes.
 */

const EMAIL_COLLECTION = "emailNotifications";
const MAX_EMAILS_PER_RUN = 10;

function processEmailNotifications() {
  const projectId = getRequiredProperty("FIREBASE_PROJECT_ID");
  const token = getFirestoreAccessToken();
  const pendingNotifications = fetchPendingNotifications(projectId, token);

  pendingNotifications.forEach((notification) => {
    try {
      sendNotificationEmail(notification);
      markNotificationSent(projectId, token, notification.name);
    } catch (error) {
      markNotificationFailed(projectId, token, notification.name, error);
    }
  });
}

function fetchPendingNotifications(projectId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: EMAIL_COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "pending" },
        },
      },
      limit: MAX_EMAILS_PER_RUN,
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  assertOk(response, "Fetch pending notifications failed");
  const rows = JSON.parse(response.getContentText());
  return rows
    .filter((row) => row.document)
    .map((row) => ({
      name: row.document.name,
      data: fromFirestoreFields(row.document.fields || {}),
    }));
}

function sendNotificationEmail(notification) {
  const data = notification.data;
  const recipients = (data.recipients || [])
    .map((recipient) => recipient.email)
    .filter(Boolean);

  if (recipients.length === 0) {
    return;
  }

  const kindLabel = data.kind === "report" ? "臣要告发" : "臣要上奏";
  const subject = `【有本要奏】${data.houseName || "小朝廷"}有新${kindLabel}`;
  const body = [
    `${data.createdByName || "有人"}提交了新的${kindLabel}，请来批折子。`,
    "",
    `标题：${data.title || ""}`,
    data.body ? `内容：${data.body}` : "",
    "",
    data.url ? `打开查看：${data.url}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  GmailApp.sendEmail(recipients.join(","), subject, body, {
    name: "有本要奏",
  });
}

function markNotificationSent(projectId, token, documentName) {
  patchNotification(projectId, token, documentName, {
    status: { stringValue: "sent" },
    sentAt: { timestampValue: new Date().toISOString() },
  });
}

function markNotificationFailed(projectId, token, documentName, error) {
  patchNotification(projectId, token, documentName, {
    status: { stringValue: "failed" },
    error: { stringValue: String(error && error.message ? error.message : error) },
    failedAt: { timestampValue: new Date().toISOString() },
  });
}

function patchNotification(projectId, token, documentName, fields) {
  const fieldPaths = Object.keys(fields).map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`);
  const url = `https://firestore.googleapis.com/v1/${documentName}?${fieldPaths.join("&")}`;
  const response = UrlFetchApp.fetch(url, {
    method: "patch",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify({ fields }),
    muteHttpExceptions: true,
  });
  assertOk(response, "Patch notification failed");
}

function getFirestoreAccessToken() {
  const serviceAccountEmail = getRequiredProperty("SERVICE_ACCOUNT_EMAIL");
  const privateKey = getRequiredProperty("SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claimSet = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;
  const signature = Utilities.computeRsaSha256Signature(unsignedJwt, privateKey);
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    },
    muteHttpExceptions: true,
  });

  assertOk(response, "Access token request failed");
  return JSON.parse(response.getContentText()).access_token;
}

function fromFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function fromFirestoreValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue.fields || {});
  return undefined;
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? Utilities.newBlob(value).getBytes() : value;
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
}

function getRequiredProperty(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) {
    throw new Error(`Missing script property: ${name}`);
  }
  return value;
}

function assertOk(response, message) {
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`${message}: ${status} ${response.getContentText()}`);
  }
}
