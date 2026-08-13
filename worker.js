const NOTION_VERSION = "2025-09-03";

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "*").trim();
  const ok = allowed === "*" || origin === allowed;
  return {
    "Access-Control-Allow-Origin": ok ? (allowed === "*" ? "*" : origin) : "null",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) },
  });
}

function extractId(input) {
  const s = String(input || "").trim();
  const m = s.match(/[0-9a-fA-F]{32}/g);
  if (m?.length) return m[m.length - 1];
  const u = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g);
  if (u?.length) return u[u.length - 1].replace(/-/g, "");
  if (/^[0-9a-fA-F-]{32,36}$/.test(s)) return s.replace(/-/g, "");
  throw new Error("NotionのURL/IDからIDを読み取れませんでした。");
}

function uuid32(id) {
  const x = id.replace(/-/g, "");
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}

async function notionFetch(path, token, init = {}) {
  return fetch(`https://api.notion.com${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function resolveDataSource(id, token) {
  const uuid = uuid32(id);

  // 1) 直接 data_source ID として試す（読み取りのみ）
  const ds = await notionFetch(`/v1/data_sources/${uuid}`, token, { method: "GET" });
  if (ds.ok) return uuid;

  // 2) database ID として取得し、配下の data source を選ぶ（読み取りのみ）
  const db = await notionFetch(`/v1/databases/${uuid}`, token, { method: "GET" });
  if (!db.ok) {
    const e = await db.json().catch(() => ({}));
    throw new Error(e.message || `Notion database/data source を取得できません (${db.status})`);
  }
  const data = await db.json();
  const first = data.data_sources?.[0]?.id;
  if (!first) throw new Error("このデータベースに data source が見つかりません。");
  return first;
}

async function queryAll(dataSourceId, token) {
  const results = [];
  let cursor = undefined;

  // 読み取り検索。Notion API上はPOSTだが、作成・更新・削除ではない。
  for (let i = 0; i < 20; i++) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const r = await notionFetch(`/v1/data_sources/${dataSourceId}/query`, token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `Notion query に失敗しました (${r.status})`);
    }
    const j = await r.json();
    results.push(...(j.results || []));
    if (!j.has_more || !j.next_cursor) break;
    cursor = j.next_cursor;
  }
  return results;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname !== "/notion/read" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, request, env);
    }

    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "*").trim();
    if (allowed !== "*" && origin !== allowed) {
      return json({ error: "この公開元からのアクセスは許可されていません。" }, 403, request, env);
    }

    try {
      const body = await request.json();
      const notionToken = String(body.notionToken || "").trim();
      const source = String(body.source || "").trim();
      if (!notionToken || !source) return json({ error: "APIキーとNotion URL/IDが必要です。" }, 400, request, env);

      const rawId = extractId(source);
      const dataSourceId = await resolveDataSource(rawId, notionToken);
      const results = await queryAll(dataSourceId, notionToken);

      // APIキーは保存・ログ出力しない。
      return json({ data_source_id: dataSourceId, results }, 200, request, env);
    } catch (e) {
      return json({ error: e?.message || "Unexpected error" }, 400, request, env);
    }
  },
};