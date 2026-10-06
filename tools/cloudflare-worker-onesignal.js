const ALLOWED_ORIGIN = "https://bbxg16.github.io";
const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204);
    }

    if (request.method !== "POST") {
      return corsResponse({ error: "Method not allowed" }, 405);
    }

    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return corsResponse({ error: "Origin not allowed" }, 403);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return corsResponse({ error: "Invalid JSON" }, 400);
    }

    const houseId = asText(payload.houseId, 120);
    const houseName = asText(payload.houseName, 80);
    const kind = payload.kind === "report" ? "report" : "purchase";
    const title = asText(payload.title, 80);
    const body = asText(payload.body, 140);
    const createdByName = asText(payload.createdByName, 80);
    const url = asText(payload.url, 500);
    const recipientUserIds = Array.isArray(payload.recipientUserIds)
      ? payload.recipientUserIds.map((id) => asText(id, 120)).filter(Boolean).slice(0, 2000)
      : [];

    if (!houseId || !title || !env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY) {
      return corsResponse({ error: "Missing required data" }, 400);
    }

    const heading = kind === "report" ? "有新告发" : "有新上奏";
    const content = `${createdByName || "有人"}提交了：${title}${body ? ` - ${body}` : ""}`;
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: env.ONESIGNAL_APP_ID,
        target_channel: "push",
        headings: { en: heading, zh: heading },
        contents: { en: content, zh: content },
        url,
        ...(recipientUserIds.length > 0
          ? { include_aliases: { external_id: recipientUserIds } }
          : { filters: [{ field: "tag", key: "house_id", relation: "=", value: houseId }] }),
        data: {
          houseId,
          houseName,
          kind,
          postId: asText(payload.postId, 120),
        },
      }),
    });

    const result = await response.json().catch(() => ({}));
    return corsResponse(result, response.ok ? 200 : response.status);
  },
};

function asText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function corsResponse(body, status = 200) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
  });
}
