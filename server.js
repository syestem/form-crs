require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { Pool } = require("pg");

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "";
const ADMIN_TOKEN_TTL_HOURS = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 12);
const PGSCHEMA = process.env.PGSCHEMA || "public";

let pool;
let TABLES;
let dbAvailable = false;

function getAllowedOrigins() {
  const raw = String(process.env.CORS_ALLOWED_ORIGINS || "").trim();
  if (!raw) {
    return ["*"];
  }

  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function applyCors(req, res) {
  const origin = cleanString(req.headers.origin);
  const allowedOrigins = getAllowedOrigins();
  const allowAny = allowedOrigins.includes("*");

  if (allowAny && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (allowAny) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function shouldUseSsl() {
  return process.env.PGSSL === "true" || process.env.PGSSLMODE === "require";
}

function buildPoolConfig(forceSsl) {
  const ssl = forceSsl ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl
    };
  }

  return {
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "",
    user: process.env.PGUSER || "",
    password: process.env.PGPASSWORD || "",
    ssl
  };
}

function createPool(forceSsl) {
  return new Pool(buildPoolConfig(forceSsl));
}

function getSafeSchemaName() {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(PGSCHEMA)) {
    throw new Error("PGSCHEMA must contain only letters, numbers and underscores, and cannot start with a number");
  }

  return PGSCHEMA;
}

function buildTableNames() {
  const schemaName = getSafeSchemaName();
  return {
    schemaName,
    appSettings: `"${schemaName}"."app_settings"`,
    adminSessions: `"${schemaName}"."admin_sessions"`,
    submissions: `"${schemaName}"."submissions"`
  };
}

async function query(text, params = []) {
  if (!dbAvailable || !pool) {
    throw new Error("Local database is not available. Point the frontend to Supabase or configure PostgreSQL for local API testing.");
  }
  return pool.query(text, params);
}

async function connectDatabase() {
  const initialSsl = shouldUseSsl();
  pool = createPool(initialSsl);

  try {
    await pool.query("SELECT 1");
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    const sslUnsupported = initialSsl && (message.includes("does not support ssl") || message.includes("ssl connections"));
    if (!sslUnsupported) {
      throw error;
    }

    await pool.end().catch(() => {});
    pool = createPool(false);
    await pool.query("SELECT 1");
  }

  TABLES = buildTableNames();
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${TABLES.schemaName}"`);
  dbAvailable = true;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.appSettings} (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.adminSessions} (
      token TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.submissions} (
      submission_id TEXT PRIMARY KEY,
      updated_at TIMESTAMPTZ NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      group_name TEXT NOT NULL DEFAULT '',
      participants INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      per_person INTEGER NOT NULL DEFAULT 0,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      summary JSONB NOT NULL DEFAULT '[]'::jsonb,
      schema_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function cleanString(value) {
  return typeof value === "string" ? value : "";
}

function deepParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getSetting(key, fallback) {
  const result = await query(`SELECT value FROM ${TABLES.appSettings} WHERE key = $1`, [key]);
  if (!result.rows.length) {
    return fallback;
  }
  return result.rows[0].value ?? fallback;
}

async function setSetting(key, value) {
  await query(`
    INSERT INTO ${TABLES.appSettings} (key, value, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `, [key, JSON.stringify(value)]);
}

function generateToken() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function requireAdmin(req) {
  const authHeader = cleanString(req.headers.authorization);
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    throw new Error("Admin authorization required");
  }

  const result = await query(
    `SELECT token FROM ${TABLES.adminSessions} WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );

  if (!result.rows.length) {
    throw new Error("Admin authorization required");
  }

  return token;
}

function normalizeDependency(rule) {
  return {
    id: rule?.id || generateToken(),
    fieldId: cleanString(rule?.fieldId),
    operator: cleanString(rule?.operator) || "equals",
    value: rule?.value ?? ""
  };
}

function normalizeDependencies(dependsOn) {
  if (Array.isArray(dependsOn)) {
    return {
      joiner: "and",
      groups: dependsOn.length ? [{ id: generateToken(), joiner: "and", rules: dependsOn.map(normalizeDependency) }] : []
    };
  }

  if (dependsOn && typeof dependsOn === "object") {
    return {
      joiner: dependsOn.joiner === "or" ? "or" : "and",
      groups: Array.isArray(dependsOn.groups)
        ? dependsOn.groups.map(group => ({
            id: cleanString(group?.id) || generateToken(),
            joiner: group?.joiner === "or" ? "or" : "and",
            rules: Array.isArray(group?.rules) ? group.rules.map(normalizeDependency) : []
          }))
        : []
    };
  }

  return { joiner: "and", groups: [] };
}

function normalizeOption(option) {
  return {
    value: cleanString(option?.value),
    label: cleanString(option?.label),
    description: cleanString(option?.description),
    details: cleanString(option?.details),
    mapUrl: cleanString(option?.mapUrl),
    image: cleanString(option?.image),
    price: Number(option?.price) || 0,
    nextPrice: option?.nextPrice === "" || option?.nextPrice == null
      ? null
      : (Number.isFinite(Number(option?.nextPrice)) ? Number(option?.nextPrice) : null),
    priceType: cleanString(option?.priceType) || "fixed",
    promoText: cleanString(option?.promoText),
    defaultSelected: Boolean(option?.defaultSelected),
    locked: Boolean(option?.locked),
    allowQuantity: Boolean(option?.allowQuantity),
    quantitySyncFieldId: cleanString(option?.quantitySyncFieldId),
    quantitySyncOptionValue: cleanString(option?.quantitySyncOptionValue),
    dependsOn: normalizeDependencies(option?.dependsOn)
  };
}

function normalizeField(field) {
  const normalized = {
    id: cleanString(field?.id) || generateToken(),
    label: cleanString(field?.label) || "Новое поле",
    hint: cleanString(field?.hint),
    promoTag: cleanString(field?.promoTag),
    promoTitle: cleanString(field?.promoTitle),
    promoSubtitle: cleanString(field?.promoSubtitle),
    type: cleanString(field?.type) || "single",
    required: Boolean(field?.required),
    appearance: cleanString(field?.appearance) || undefined,
    dependsOn: normalizeDependencies(field?.dependsOn)
  };

  if (normalized.type !== "text") {
    normalized.options = Array.isArray(field?.options) ? field.options.map(normalizeOption) : [];
  }

  return normalized;
}

function flattenFields(fields, bucket = []) {
  (fields || []).forEach(field => {
    bucket.push(normalizeField(field));
  });
  return bucket;
}

function getDynamicColumns(schema) {
  return flattenFields(schema).map(field => ({
    id: field.id,
    label: field.label || field.id
  }));
}

function findField(schema, fieldId) {
  return flattenFields(schema).find(field => field.id === fieldId) || null;
}

function findOption(field, value) {
  return (field?.options || []).find(option => option.value === value) || null;
}

function extractSubmissionMetrics(schema, answersRaw) {
  const answers = typeof answersRaw === "object" && answersRaw ? answersRaw : {};
  const hours = Number(answers.__hours) || 0;
  const quantities = answers.__optionQuantities && typeof answers.__optionQuantities === "object"
    ? answers.__optionQuantities
    : {};
  let hourlyRate = 0;

  flattenFields(schema).forEach(field => {
    if (!Array.isArray(field?.options) || !field.options.length) {
      return;
    }

    const answerValue = answers[field.id];
    const selectedValues = Array.isArray(answerValue) ? answerValue : [answerValue];
    selectedValues.forEach(selectedValue => {
      const option = findOption(field, selectedValue);
      if (option?.priceType === "perHour") {
        const quantityKey = `${field.id}::${String(selectedValue)}`;
        const quantity = Number(quantities[quantityKey]) || 1;
        hourlyRate += (Number(option.price) || 0) * Math.max(1, quantity);
      }
    });
  });

  return { hours, hourlyRate };
}

function humanizeAnswerValue(field, value) {
  if (value == null || value === "") {
    return "";
  }

  if (!field || field.type === "text") {
    return String(value);
  }

  if (field.type === "multi") {
    const values = Array.isArray(value) ? value : [];
    return values.map(item => findOption(field, item)?.label || String(item)).join(", ");
  }

  return findOption(field, value)?.label || String(value);
}

function buildResponsesPreviewRows(schema, rows) {
  const dynamicColumns = getDynamicColumns(schema);
  const headers = ["updatedAt", "name", "group", "hours", "multiply", "hourlyRate", "total"].concat(dynamicColumns.map(column => column.label));

  const dataRows = rows.map(row => {
    const answers = typeof row.answers === "object" && row.answers ? row.answers : {};
    const metrics = extractSubmissionMetrics(schema, answers);
    const result = [
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ""),
      row.name || "",
      row.group_name || "",
      metrics.hours,
      metrics.hours > 0 && metrics.hourlyRate > 0 ? "×" : "",
      metrics.hourlyRate,
      row.total || 0
    ];

    dynamicColumns.forEach(column => {
      const field = findField(schema, column.id);
      result.push(humanizeAnswerValue(field, answers[column.id]));
    });

    return result;
  });

  return { headers, rows: dataRows };
}

async function buildStats() {
  const result = await query(`SELECT answers FROM ${TABLES.submissions}`);
  const optionCounts = {};

  result.rows.forEach(row => {
    const answers = typeof row.answers === "object" && row.answers ? row.answers : {};
    Object.entries(answers).forEach(([fieldId, value]) => {
      if (String(fieldId).startsWith("__")) {
        return;
      }
      optionCounts[fieldId] = optionCounts[fieldId] || {};
      if (Array.isArray(value)) {
        value.forEach(optionValue => {
          optionCounts[fieldId][optionValue] = (optionCounts[fieldId][optionValue] || 0) + 1;
        });
      } else {
        optionCounts[fieldId][value] = (optionCounts[fieldId][value] || 0) + 1;
      }
    });
  });

  return {
    ok: true,
    responsesCount: result.rows.length,
    optionCounts
  };
}

const app = express();
app.use((req, res, next) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(200).json({ ok: true });
    return;
  }
  next();
});
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));
app.use(express.static(__dirname));

app.use("/api", (req, res, next) => {
  if (dbAvailable) {
    next();
    return;
  }

  res.status(503).json({
    ok: false,
    error: "Local database is not available. Use Supabase in config.runtime.js or configure PostgreSQL for local backend testing."
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/schema", async (req, res) => {
  try {
    const schema = await getSetting("formSchema", []);
    const uiConfig = await getSetting("uiConfig", {});
    res.json({ ok: true, schema, uiConfig });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    res.json(await buildStats());
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    if (!ADMIN_PASSCODE) {
      throw new Error("ADMIN_PASSCODE is not configured");
    }

    if (cleanString(req.body.passcode) !== ADMIN_PASSCODE) {
      throw new Error("Invalid admin passcode");
    }

    const adminToken = generateToken();
    const expiresAt = new Date(Date.now() + ADMIN_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await query(
      `INSERT INTO ${TABLES.adminSessions} (token, expires_at) VALUES ($1, $2)`,
      [adminToken, expiresAt.toISOString()]
    );

    res.json({ ok: true, adminToken, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/schema", async (req, res) => {
  try {
    await requireAdmin(req);
    const schema = Array.isArray(req.body.schema) ? req.body.schema.map(normalizeField) : [];
    const uiConfig = req.body.uiConfig && typeof req.body.uiConfig === "object" ? req.body.uiConfig : {};
    await setSetting("formSchema", schema);
    await setSetting("uiConfig", uiConfig);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("/api/responses", async (req, res) => {
  try {
    await requireAdmin(req);
    const schema = await getSetting("formSchema", []);
    const result = await query(
      `SELECT updated_at, name, group_name, total, per_person, answers FROM ${TABLES.submissions} ORDER BY updated_at DESC LIMIT 100`
    );
    res.json({ ok: true, ...buildResponsesPreviewRows(schema, result.rows) });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/reset-all-data", async (req, res) => {
  try {
    await requireAdmin(req);
    await query(`TRUNCATE TABLE ${TABLES.submissions}`);
    await query(`DELETE FROM ${TABLES.adminSessions} WHERE expires_at <= NOW()`);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post("/api/submissions/upsert", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const submissionId = cleanString(payload.submissionId) || generateToken();
    const updatedAt = payload.updatedAt ? new Date(payload.updatedAt) : new Date();
    const answers = {
      ...deepParse(payload.answers, {}),
      __hours: Number(payload.hours) || 0
    };

    await query(`
      INSERT INTO ${TABLES.submissions} (
        submission_id,
        updated_at,
        name,
        group_name,
        participants,
        total,
        per_person,
        answers,
        summary,
        schema_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)
      ON CONFLICT (submission_id)
      DO UPDATE SET
        updated_at = EXCLUDED.updated_at,
        name = EXCLUDED.name,
        group_name = EXCLUDED.group_name,
        participants = EXCLUDED.participants,
        total = EXCLUDED.total,
        per_person = EXCLUDED.per_person,
        answers = EXCLUDED.answers,
        summary = EXCLUDED.summary,
        schema_snapshot = EXCLUDED.schema_snapshot
    `, [
      submissionId,
      updatedAt.toISOString(),
      cleanString(payload.name),
      cleanString(payload.group),
      Number(payload.participants) || 0,
      Number(payload.total) || 0,
      Number(payload.perPerson) || 0,
      JSON.stringify(answers),
      JSON.stringify(deepParse(payload.summary, [])),
      JSON.stringify(Array.isArray(payload.schema) ? payload.schema : [])
    ]);

    res.json({ ok: true, submissionId });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function startListening(startPort) {
  const port = Number(startPort) || DEFAULT_PORT;
  const server = app.listen(port, () => {
    console.log(`Local dev server is running on http://localhost:${port}`);
  });

  server.on("error", error => {
    if (error?.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Trying http://localhost:${nextPort} ...`);
      startListening(nextPort);
      return;
    }

    console.error("Failed to start local dev server:", error);
    process.exit(1);
  });
}

connectDatabase()
  .then(() => initDb())
  .then(() => {
    startListening(DEFAULT_PORT);
  })
  .catch(error => {
    console.warn("PostgreSQL is unavailable. Starting static-only local dev server.");
    console.warn(error instanceof Error ? error.message : error);
    dbAvailable = false;
    startListening(DEFAULT_PORT);
  });
