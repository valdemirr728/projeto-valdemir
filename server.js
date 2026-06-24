// Guará Facilities - Backend V16 FINANCEIRO + DASHBOARD DE EQUIPAMENTOS PLUS
// Base V10.24 DEFINITIVO
// Node.js + Express + SQLite
// Recursos: login admin, proteção do painel/API, responsável, histórico, notas e anexos.

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch (err) { nodemailer = null; }
let sharp = null;
try { sharp = require("sharp"); } catch (err) { sharp = null; }
let webpush = null;
try { webpush = require("web-push"); } catch (err) { webpush = null; }
const Database = require("better-sqlite3");

const app = express();

// GF cachefix mobile/app: evita PWA e celular segurarem admin.js/html antigo
try {
  app.use(function(req, res, next){
    var u = String(req.url || "");
    if (u.includes("/admin") || u.includes("/app") || u.includes("/js/admin.js") || u.includes("/css/admin.css") || u.includes("/api/public") || u.startsWith("/s/") || u.startsWith("/c/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
} catch(e){}


const PORT = 3005;
console.log("[GF-FIX] server.js atualizado: aceitar chamado sem ON CONFLICT - 2026-05-21");

// Caminhos
const ROOT_DIR = path.join(__dirname, "..");

// V10.17 - carrega .env automaticamente sem depender de pacote externo
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const raw = line.trim();
      if (!raw || raw.startsWith("#") || !raw.includes("=")) continue;
      const idx = raw.indexOf("=");
      const key = raw.slice(0, idx).trim();
      let value = raw.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (err) {
    console.warn("Aviso: não foi possível carregar .env:", err.message);
  }
}
loadEnvFile(path.join(ROOT_DIR, ".env"));
loadEnvFile(path.join(__dirname, ".env"));

const DB_PATH = path.join(ROOT_DIR, "database", "guara_facilities.db");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const COMPANY_LOGOS_DIR = path.join(UPLOADS_DIR, "company-logos");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(COMPANY_LOGOS_DIR)) fs.mkdirSync(COMPANY_LOGOS_DIR, { recursive: true });

if (!fs.existsSync(DB_PATH)) {
  console.error("ERRO: Banco não encontrado em:", DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
try {
  // GF-PERF V1: melhora leitura concorrente e reduz travadas em SQLite quando o painel atualiza.
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("cache_size = -64000");
  db.pragma("temp_store = MEMORY");
} catch (err) {
  console.warn("Aviso: PRAGMA de performance não aplicado:", err.message);
}

// Sessões em memória + persistidas no SQLite.
// Antes ficava só no Map; ao reiniciar o Node/PM2, todos os logins caíam.
// Agora o cookie continua no navegador e o servidor recupera a sessão pela tabela auth_sessions.
const sessions = new Map();

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      company_id INTEGER,
      company_slug TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER,
      user_agent TEXT,
      ip TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
  `);

  db.prepare(`DELETE FROM auth_sessions WHERE expires_at < ?`).run(Date.now());
} catch (err) {
  console.warn("Aviso: não foi possível preparar sessões persistentes:", err.message);
}


// GF QR RATING - avaliações públicas por chamado, isoladas por empresa.
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, ticket_id)
    );
    CREATE INDEX IF NOT EXISTS idx_ticket_ratings_company_ticket ON ticket_ratings(company_id, ticket_id);
  `);
} catch (err) {
  console.warn("Aviso: não foi possível preparar ticket_ratings:", err.message);
}

function savePersistentSession(token, session) {
  try {
    db.prepare(`
      INSERT INTO auth_sessions (
        token, user_id, company_id, company_slug, expires_at, created_at, last_seen_at, user_agent, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        user_id = excluded.user_id,
        company_id = excluded.company_id,
        company_slug = excluded.company_slug,
        expires_at = excluded.expires_at,
        last_seen_at = excluded.last_seen_at,
        user_agent = excluded.user_agent,
        ip = excluded.ip
    `).run(
      token,
      session.userId,
      session.companyId || null,
      session.companySlug || "",
      session.expiresAt,
      session.createdAt || Date.now(),
      session.lastSeenAt || Date.now(),
      session.userAgent || "",
      session.ip || ""
    );
  } catch (err) {
    console.warn("Aviso: falha ao salvar sessão persistente:", err.message);
  }
}

function loadPersistentSession(token) {
  try {
    const row = db.prepare(`
      SELECT token, user_id, company_id, company_slug, expires_at, created_at, last_seen_at, user_agent, ip
      FROM auth_sessions
      WHERE token = ?
      LIMIT 1
    `).get(token);

    if (!row) return null;

    if (Number(row.expires_at || 0) < Date.now()) {
      db.prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token);
      sessions.delete(token);
      return null;
    }

    return {
      userId: row.user_id,
      companyId: row.company_id || null,
      companySlug: row.company_slug || "",
      expiresAt: Number(row.expires_at),
      createdAt: Number(row.created_at || Date.now()),
      lastSeenAt: Number(row.last_seen_at || Date.now()),
      userAgent: row.user_agent || "",
      ip: row.ip || "",
    };
  } catch (err) {
    console.warn("Aviso: falha ao carregar sessão persistente:", err.message);
    return null;
  }
}

function deletePersistentSession(token) {
  try {
    db.prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token);
  } catch (err) {
    console.warn("Aviso: falha ao apagar sessão persistente:", err.message);
  }
}

// V12.3 - Sessão blindada
// Mantém apenas uma sessão ativa por usuário no servidor.
// Quando o mesmo usuário faz login novamente, sessões antigas dele são derrubadas.
function clearSessionsForUser(userId, keepToken = null) {
  try {
    for (const [token, session] of sessions.entries()) {
      if (session && session.userId === userId && token !== keepToken) {
        sessions.delete(token);
        deletePersistentSession(token);
      }
    }
  } catch (err) {
    console.warn("Aviso: falha ao limpar sessões antigas:", err.message);
  }
}

// V12.3 - Sessão blindada: reduz tempo e evita usuário fantasma em histórico.
// Antes era 12h; em painel administrativo 4h é mais seguro.
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 24 * 30); // 30 dias para não deslogar fácil no site/app

// ADMIN AUTOMÁTICO DESATIVADO
const DEFAULT_ADMIN_EMAIL = "";
const DEFAULT_ADMIN_PASSWORD = "";
const DEFAULT_ADMIN_NAME = "";

const PUBLIC_QR_BASE =
process.env.GF_PUBLIC_BASE_URL ||
"https://facilities.requisicoesguara93783j8934hgd993k.uk";

// =========================
// V21.2 - WhatsApp Grupo: novo chamado + edição ao assumir/resolver
// O bot roda separado e recebe este webhook local quando nasce chamado novo.
// Não trava a criação do chamado se o bot estiver desligado.
// Configure no .env se precisar mudar:
// GF_BOT_WEBHOOK_URL=http://127.0.0.1:3334/webhook/facilities
// GF_ADMIN_BASE_URL=https://seu-dominio/admin.html
// Eventos enviados: ticket_created, ticket_updated.
// =========================
const GF_BOT_WEBHOOK_URL = process.env.GF_BOT_WEBHOOK_URL || "http://127.0.0.1:3334/webhook/facilities";
const GF_ADMIN_BASE_URL = (process.env.GF_ADMIN_BASE_URL || (PUBLIC_QR_BASE.replace(/\/$/, "") + "/admin.html")).replace(/\/$/, "");

function adminTicketLink(ticket) {
  // CURA DA FERIDA: navegação sempre por tickets.id.
  // ticket_number é visual por empresa e não pode ser usado para abrir chamado.
  const id = ticket?.id || "";
  const numero = ticket?.ticket_number || ticket?.id || "";
  const companySlug = String(ticket?.company_slug || '').trim().toLowerCase();
  const base = companySlug
    ? `${String(PUBLIC_QR_BASE).replace(/\/$/, '')}/c/${encodeURIComponent(companySlug)}/admin`
    : GF_ADMIN_BASE_URL;
  const sep = String(base).includes("?") ? "&" : "?";
  return `${base}${sep}ticket_id=${encodeURIComponent(id)}&ticket=${encodeURIComponent(id)}&ticket_number=${encodeURIComponent(numero)}`;
}

function getTicketNotificationPayload(ticketId) {
  const t = db.prepare(`
    SELECT
      t.id, COALESCE(t.ticket_number, t.id) AS ticket_number, t.status, t.priority,
      t.company_id, c.name AS company_name, c.slug AS company_slug,
      c.whatsapp_group_name, c.whatsapp_group_ti_name, c.whatsapp_group_manutencao_name,
      t.description, t.created_at, t.updated_at, t.resolved_at, t.final_outcome,
      t.technical_observation, t.opened_by_name, t.opened_by_phone,
      s.name AS sector_name,
      ${ticketServiceSelectFields()}
      i.name AS issue_name,
      COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
      (
        SELECT notes
        FROM ticket_logs tl
        WHERE tl.ticket_id=t.id
          AND tl.action='RESOLUTION_NOTE'
          AND COALESCE(TRIM(tl.notes),'') <> ''
        ORDER BY tl.created_at DESC, tl.id DESC
        LIMIT 1
      ) AS solution_note,
      (
        SELECT notes
        FROM ticket_logs tl
        WHERE tl.ticket_id=t.id
          AND tl.action='PUBLIC_NOTE'
          AND COALESCE(TRIM(tl.notes),'') <> ''
        ORDER BY tl.created_at DESC, tl.id DESC
        LIMIT 1
      ) AS public_note,
      (SELECT COUNT(1) FROM ticket_attachments ta WHERE ta.ticket_id=t.id) AS attachments_count
    FROM tickets t
    JOIN sectors s ON s.id=t.sector_id
    JOIN companies c ON c.id = COALESCE(t.company_id, s.company_id)
    LEFT JOIN assets a ON a.id=t.asset_id
    ${ticketServiceJoinSql('t')}
    LEFT JOIN issue_types i ON i.id=t.issue_type_id
    LEFT JOIN users u ON u.id=t.assigned_to_user_id
    WHERE t.id=?
    LIMIT 1
  `).get(ticketId);
  if (!t) return null;
  t.admin_link = adminTicketLink(t);
  return t;
}

async function notifyFacilitiesBot(eventType, ticketId) {
  try {
    const ticket = getTicketNotificationPayload(ticketId);
    if (!ticket) return;
    const response = await fetch(GF_BOT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, event: eventType, ticket })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn("[BOT-GRUPO] Webhook respondeu erro:", response.status, detail || response.statusText);
    }
  } catch (err) {
    console.warn("[BOT-GRUPO] Aviso não enviado (bot offline?):", err.message);
  }
}

// =========================
// V10.17 - Email / recuperação de senha com Resend
// Crie C:\Users\Administrator\Desktop\GuaraFacilities\.env com:
// EMAIL_PROVIDER=resend
// RESEND_API_KEY=re_sua_chave_aqui
// SMTP_FROM=Guará Facilities <onboarding@resend.dev>
//
// Também mantém SMTP antigo como fallback, sem quebrar nada.
// =========================
const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || SMTP_USER || "Guará Facilities <onboarding@resend.dev>";
const RESET_CODE_MINUTES = 10;

// V10.19 - Códigos internos para cadastro pela tela de login
// Troque esses códigos no .env em produção. Quem tiver o código cria conta no perfil correspondente.
const REGISTER_CODE_ADMIN = process.env.REGISTER_CODE_ADMIN || "GF-ADM-2026";
const REGISTER_CODE_TECH = process.env.REGISTER_CODE_TECH || "GF-TEC-2026";
const REGISTER_CODE_VIEWER = process.env.REGISTER_CODE_VIEWER || "GF-VIS-2026";

// =========================
// V12.4 MASTER TIMEZONE GLOBAL - HORÁRIO DE BRASÍLIA
// Mantém o banco em UTC (CURRENT_TIMESTAMP do SQLite) e entrega datas formatadas em America/Sao_Paulo.
// Não altera rotas, tabelas, endpoints nem lógica antiga.
// =========================
const BR_TZ = "America/Sao_Paulo";

function parseDateBR(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  let raw = String(value).trim();
  if (!raw) return null;
  // SQLite CURRENT_TIMESTAMP vem como "YYYY-MM-DD HH:mm:ss" em UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) raw = raw.replace(" ", "T") + "Z";
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) raw = raw + "Z";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}


function gfShortPersonNameServer(name) {
  const raw = String(name || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  const parts = raw.split(' ').filter(Boolean);
  if (parts.length <= 2) return raw;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
function gfShortenTicketPersonNames(row) {
  if (!row || typeof row !== 'object') return row;
  const fields = [
    'assigned_to_name',
    'resolved_by_name',
    'closed_by_name',
    'assigned_by_name',
    'assumed_by_name',
    'public_note_by_name',
    'user_name',
    'responsible_name'
  ];
  for (const f of fields) {
    if (row[f]) row[f] = gfShortPersonNameServer(row[f]);
  }
  return row;
}
function gfShortenTicketListNames(list) {
  return Array.isArray(list) ? list.map(gfShortenTicketPersonNames) : list;
}


function formatDateBR(value) {
  const d = parseDateBR(value);
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BR_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d).replace(",", "");
}

function dayKeyBR(value) {
  const d = parseDateBR(value);
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function timestampBR(value) {
  const d = parseDateBR(value);
  return d ? d.getTime() : 0;
}

function getQrTechnicalNotes(ticketId, companyId) {
  try {
    const rows = db.prepare(`
      SELECT
        tl.action,
        tl.notes,
        tl.created_at,
        COALESCE(NULLIF(u.display_name,''), u.name) AS user_name
      FROM ticket_logs tl
      LEFT JOIN users u ON u.id = tl.user_id AND (? IS NULL OR COALESCE(u.company_id, ?) = ?)
      WHERE tl.ticket_id = ?
        AND COALESCE(TRIM(tl.notes),'') <> ''
        AND tl.action IN ('PUBLIC_NOTE','RESOLUTION_NOTE','TICKET_FINALIZED','TICKET_SWAP_PENDING','TICKET_REOPENED_FOR_SWAP')
      ORDER BY datetime(tl.created_at) ASC, tl.id ASC
    `).all(companyId, companyId, companyId, ticketId);

    const seen = new Set();
    return rows.map((r) => {
      let type = 'OBS';
      if (r.action === 'PUBLIC_NOTE') type = 'ATUALIZAÇÃO';
      else if (r.action === 'RESOLUTION_NOTE') type = 'OBS. FINALIZAÇÃO';
      else if (r.action === 'TICKET_FINALIZED') type = 'FINALIZAÇÃO';
      else if (r.action === 'TICKET_SWAP_PENDING' || r.action === 'TICKET_REOPENED_FOR_SWAP') type = 'TROCA';

      let note = String(r.notes || '').trim();
      // Evita mostrar linhas automáticas vazias ou repetidas quando a RESOLUTION_NOTE já traz a observação real.
      const key = `${type}|${String(r.user_name || '')}|${formatDateBR(r.created_at)}|${note}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        type,
        note,
        user_name: r.user_name || '',
        created_at: r.created_at || '',
        created_at_br: formatDateBR(r.created_at)
      };
    }).filter(Boolean);
  } catch (_) {
    return [];
  }
}


function statusLabelBR(status) {
  if (status === "DONE") return "Resolvido";
  if (status === "IN_PROGRESS") return "Em andamento";
  if (status === "CANCELED") return "Cancelado";
  return "Novo";
}

function normalizeSolutionText(body) {
  return String(
    body?.solution ||
    body?.solution_note ||
    body?.resolution_note ||
    body?.resolved_note ||
    body?.note ||
    ""
  ).trim();
}

function normalizeFinalOutcome(body) {
  const value = String(body?.final_outcome || body?.resolution_type || body?.outcome || "RESOLVED").trim().toUpperCase();
  return ["RESOLVED", "NO_REPAIR", "SWAP", "WRITTEN_OFF"].includes(value) ? value : "RESOLVED";
}

function finalOutcomeLabelBR(value) {
  return {
    RESOLVED: "Resolvido",
    NO_REPAIR: "Sem reparo",
    SWAP: "Encaminhado para troca",
    WRITTEN_OFF: "Baixado patrimônio",
  }[value] || "Resolvido";
}

function assetStatusByOutcome(outcome) {
  if (outcome === "NO_REPAIR") return "NO_REPAIR";
  if (outcome === "WRITTEN_OFF") return "WRITTEN_OFF";
  if (outcome === "SWAP") return "SWAP";
  return null;
}


// =========================
// V30 - PADRONIZAÇÃO GLOBAL DE NOMES / IA MAIS ASSERTIVA
// Mantém IDs e histórico. Normaliza apenas texto exibido/cadastrado.
// =========================
function gfTextUpper(value) {
  let s = String(value || "").trim().toUpperCase();
  const map = {
    "ã":"Ã","á":"Á","à":"À","â":"Â","ä":"Ä",
    "é":"É","ê":"Ê","è":"È",
    "í":"Í","ì":"Ì",
    "ó":"Ó","õ":"Õ","ô":"Ô","ò":"Ò",
    "ú":"Ú","ü":"Ü","ù":"Ù",
    "ç":"Ç","ñ":"Ñ"
  };
  for (const [a,b] of Object.entries(map)) s = s.split(a).join(b);
  return s
    .replace(/\bNAO\b/g, "NÃO")
    .replace(/CONEXAO/g, "CONEXÃO")
    .replace(/SOLICITACAO/g, "SOLICITAÇÃO")
    .replace(/OPERACAO/g, "OPERAÇÃO")
    .replace(/REMOCAO/g, "REMOÇÃO")
    .replace(/USUARIO/g, "USUÁRIO")
    .replace(/ELETRICO/g, "ELÉTRICO")
    .replace(/ELETRICA/g, "ELÉTRICA")
    .replace(/MARMORE/g, "MÁRMORE")
    .replace(/NECESSARIA/g, "NECESSÁRIA")
    .replace(/AGUA/g, "ÁGUA")
    .replace(/GAS/g, "GÁS")
    .replace(/FAISCA/g, "FAÍSCA")
    .replace(/IMPRESSAO/g, "IMPRESSÃO")
    .replace(/COMUNICACAO/g, "COMUNICAÇÃO")
    .replace(/VENTILACAO/g, "VENTILAÇÃO")
    .replace(/MAQUINA/g, "MÁQUINA")
    .replace(/CAMERA/g, "CÂMERA")
    .replace(/CAMERAS/g, "CÂMERAS")
    .replace(/REQUISICAO/g, "REQUISIÇÃO")
    .replace(/NIVEL/g, "NÍVEL")
    .replace(/\s+/g, " ")
    .trim();
}

function gfCanonicalIssueName(value) {
  const s = gfTextUpper(value);
  const aliases = {
    "NÃO ESTÁ GELANDO": "NÃO GELA",
    "NÃO ESTA GELANDO": "NÃO GELA",
    "LENTO / TRAVANDO": "LENTO/TRAVANDO",
    "LENTO OU TRAVANDO": "LENTO/TRAVANDO",
    "SISTEMA LENTO/TRAVANDO": "LENTO/TRAVANDO",
    "SISTEMA LENTO / TRAVANDO": "LENTO/TRAVANDO",
    "INTERNET LENTA": "LENTIDÃO",
    "LENTA": "LENTIDÃO",
    "PROBLEMA DE INTERNET/REDE": "SEM INTERNET",
    "PROBLEMA DE CONEXÃO": "SEM CONEXÃO",
    "PROBLEMA DE CONEXÃO/REDE": "FALHA DE REDE",
    "FALHA NA CONEXÃO/REDE": "FALHA DE REDE",
    "FALHA DE COMUNICAÇÃO/REDE": "FALHA DE REDE",
    "PORTA/CABO DE REDE COM PROBLEMA": "CABO/CONEXÃO COM PROBLEMA",
    "CABO OU CONEXÃO COM PROBLEMA": "CABO/CONEXÃO COM PROBLEMA",
    "TELA QUEBRADA/MANCHADA": "TELA DANIFICADA",
    "IMPRESSÃO FALHADA": "IMPRESSÃO COM FALHA",
    "PAPEL TRAVANDO": "ATOLAMENTO DE PAPEL",
    "FALHA NA COMUNICAÇÃO": "FALHA DE COMUNICAÇÃO",
    "CRIAR CONTA USUARIO": "CRIAR CONTA DE USUÁRIO",
    "CRIAR CONTA USUÁRIO": "CRIAR CONTA DE USUÁRIO",
    "GETNET NAO SINCRONIZA": "GETNET NÃO SINCRONIZA",
    "GETNET QUEBRADA": "GETNET COM PROBLEMA",
    "SEM CONEXÃO COM O BANCO": "SEM CONEXÃO COM BANCO"
  };
  return aliases[s] || s;
}

function gfNormKey(value) {
  return gfTextUpper(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/g, " ").trim();
}

function gfAssetKindFromName(name, explicitKind) {
  const k = gfTextUpper(explicitKind);
  if (k === "SERVICE" || k === "SERVIÇO") return "SERVICE";
  if (k === "EQUIPMENT" || k === "EQUIPAMENTO") return "EQUIPMENT";
  const n = gfNormKey(name);
  const services = new Set([
    "LIMBER","INTERNET","INTERNETE","MANUTENCAO PREDIAL","MARCENARIA","VIDRACARIA","PASSAGEM DE CABO",
    "LANCAMENTO DE CABO","INSTALACAO","CAMERA","CABEAMENTO","REDE","TOMADA","LAMPADA","ELETRICA",
    "HIDRAULICA","PINTURA","ALVENARIA","REQUISICAO","OUTRAS DEMANDAS","SUPRIMENTOS"
  ]);
  return services.has(n) ? "SERVICE" : "EQUIPMENT";
}

function gfItemLabel(kind) {
  return String(kind || "").toUpperCase() === "SERVICE" ? "Serviço" : "Equipamento";
}

function ticketServiceJoinSql(alias = 't') {
  // V149 - SERVIÇO REAL PELO BANCO
  // O problema encontrado no banco: tickets.service_id estava recebendo id de assets legado
  // (ex: 1219) em vez do id real da tabela services (ex: 6). Por isso o JOIN em services falhava
  // e o filtro acabava usando dados antigos/errados.
  // Este JOIN aceita os 3 cenários sem quebrar histórico:
  // 1) t.service_id já é services.id;
  // 2) issue_types.service_id aponta para services.id;
  // 3) chamado antigo usa asset_id/service_id com assets.asset_kind='SERVICE', então mapeia pelo nome do asset.
  if (!hasTable('services')) {
    return "LEFT JOIN (SELECT NULL AS id, NULL AS company_id, NULL AS name, NULL AS category, NULL AS department, NULL AS legacy_asset_name) sv ON 0";
  }
  const ticketServiceCol = tableCols('tickets').includes('service_id') ? `${alias}.service_id` : 'NULL';
  return `LEFT JOIN services sv ON sv.id = COALESCE(
    (SELECT s0.id FROM services s0 WHERE s0.id = ${ticketServiceCol} LIMIT 1),
    (SELECT ii.service_id FROM issue_types ii WHERE ii.id = ${alias}.issue_type_id AND ii.service_id IS NOT NULL LIMIT 1),
    (
      SELECT s1.id
      FROM services s1
      JOIN assets aa ON aa.id = COALESCE(${alias}.asset_id, ${ticketServiceCol})
      WHERE COALESCE(s1.company_id,0)=COALESCE(${alias}.company_id, aa.company_id,0)
        AND UPPER(TRIM(COALESCE(aa.asset_kind,'')))='SERVICE'
        AND (
          UPPER(TRIM(COALESCE(s1.name,''))) = UPPER(TRIM(COALESCE(aa.name,'')))
          OR UPPER(TRIM(COALESCE(s1.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(aa.name,'')))
          OR UPPER(TRIM(COALESCE(s1.name,''))) = UPPER(TRIM(COALESCE(aa.patrimonio,'')))
        )
      ORDER BY s1.id
      LIMIT 1
    ),
    (
      SELECT s2.id
      FROM services s2
      JOIN issue_types ii2 ON ii2.id = ${alias}.issue_type_id
      WHERE COALESCE(s2.company_id,0)=COALESCE(${alias}.company_id, ii2.company_id,0)
        AND (
          UPPER(TRIM(COALESCE(s2.name,''))) = UPPER(TRIM(COALESCE(ii2.asset_name,'')))
          OR UPPER(TRIM(COALESCE(s2.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(ii2.asset_name,'')))
        )
      ORDER BY s2.id
      LIMIT 1
    )
  )`;
}

function ticketServiceSelectFields() {
  const serviceDetected = `(sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE')`;
  return `
        COALESCE(sv.id, ${tableCols('tickets').includes('service_id') ? 't.service_id' : 'NULL'}) AS service_id,
        CASE WHEN ${serviceDetected} THEN NULL ELSE a.patrimonio END AS patrimonio,
        COALESCE(NULLIF(TRIM(sv.name),''), NULLIF(TRIM(sv.legacy_asset_name),''), NULLIF(TRIM(a.name),''), NULLIF(TRIM(i.asset_name),'')) AS asset_name,
        CASE WHEN ${serviceDetected} THEN '' ELSE a.brand END AS asset_brand,
        CASE WHEN ${serviceDetected} THEN '' ELSE a.model END AS asset_model,
        CASE
          WHEN sv.id IS NOT NULL THEN ${serviceDepartmentCaseSql('sv')}
          WHEN UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE' THEN COALESCE(NULLIF(TRIM(a.asset_department),''),'MANUTENCAO')
          ELSE COALESCE(NULLIF(TRIM(a.asset_department),''),'TI')
        END AS asset_department,
        CASE
          WHEN ${serviceDetected} THEN 'SERVICE'
          ELSE COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
            WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
            ELSE 'EQUIPMENT'
          END)
        END AS asset_kind,
        a.sp_responsavel AS asset_sp_responsavel,
        a.sp_local AS asset_sp_local,
        a.sp_identificacao AS asset_sp_identificacao,
        a.sp_obs AS asset_sp_obs,`;
}

// V152 - Resultado final seguro para SERVIÇO.
// "Sem reparo", "Baixado" e "Troca" são fluxos patrimoniais/equipamentos.
// Se um chamado de SERVIÇO vier com esses valores por cache/front antigo, força RESOLVIDO.
function getTicketItemKindForOutcome(ticketId, req) {
  try {
    const cid = req ? currentCompanyId(req) : null;
    const row = db.prepare(`
      SELECT
        CASE
          WHEN sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE' THEN 'SERVICE'
          ELSE COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT')
        END AS asset_kind
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id
      ${ticketServiceJoinSql('t')}
      WHERE t.id=?
        AND (? IS NULL OR COALESCE(t.company_id, a.company_id)=?)
      LIMIT 1
    `).get(ticketId, cid, cid);
    return String(row?.asset_kind || 'EQUIPMENT').toUpperCase();
  } catch (err) {
    console.warn('[V152] Falha ao detectar tipo do chamado:', err.message);
    return 'EQUIPMENT';
  }
}

function finalOutcomeSafeForTicket(body, ticketId, req) {
  const outcome = normalizeFinalOutcome(body);
  const kind = getTicketItemKindForOutcome(ticketId, req);
  if (kind === 'SERVICE' && ['NO_REPAIR','WRITTEN_OFF','SWAP'].includes(outcome)) {
    return 'RESOLVED';
  }
  return outcome;
}

function fixBadServiceFinalOutcomeRows() {
  try {
    if (!hasTable('tickets')) return;
    const cols = tableCols('tickets');
    if (!cols.includes('final_outcome')) return;
    let changed = 0;
    if (hasTable('services') && cols.includes('service_id')) {
      changed += db.prepare(`
        UPDATE tickets
        SET final_outcome='RESOLVED', updated_at=CURRENT_TIMESTAMP
        WHERE UPPER(COALESCE(final_outcome,'')) IN ('NO_REPAIR','WRITTEN_OFF')
          AND service_id IS NOT NULL
          AND service_id IN (SELECT id FROM services)
      `).run().changes || 0;
    }
    if (hasTable('assets') && cols.includes('asset_id')) {
      changed += db.prepare(`
        UPDATE tickets
        SET final_outcome='RESOLVED', updated_at=CURRENT_TIMESTAMP
        WHERE UPPER(COALESCE(final_outcome,'')) IN ('NO_REPAIR','WRITTEN_OFF')
          AND asset_id IN (
            SELECT id FROM assets WHERE UPPER(TRIM(COALESCE(asset_kind,'')))='SERVICE'
          )
      `).run().changes || 0;
    }
    if (changed) console.log(`[V152] Corrigidos ${changed} chamado(s) de serviço que estavam como Sem reparo/Baixado.`);
  } catch (err) {
    console.warn('[V152] Não foi possível corrigir final_outcome de serviços:', err.message);
  }
}



// V144 - Departamento real dos SERVIÇOS.
// Antes serviço sem categoria caía em MANUTENCAO por padrão; por isso PASSAGEM DE CABO/LIMBER/INTERNET apareciam no filtro de Manutenção.
// Agora o departamento vem da category/department quando existir e, se estiver vazio, é inferido pelo nome do serviço.
function serviceDepartmentCaseSql(alias = 'sv') {
  // V151 - Departamento do serviço vem do cadastro.
  // Não tenta mais adivinhar por nome (CABO/CÂMERA/REDE), porque isso jogava serviço de Manutenção/Apoio para TI.
  const rawDeptExpr = `UPPER(TRIM(COALESCE(NULLIF(${alias}.category,''), NULLIF(${alias}.department,''), '')))`;
  return `CASE
    WHEN ${rawDeptExpr} IN ('TI','TECNOLOGIA','INFORMATICA','INFORMÁTICA') THEN 'TI'
    WHEN ${rawDeptExpr} IN ('APOIO','SUPORTE') THEN 'APOIO'
    WHEN ${rawDeptExpr} IN ('MANUTENCAO','MANUTENÇÃO','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL') THEN 'MANUTENCAO'
    ELSE 'MANUTENCAO'
  END`;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function isAdminUser(user) {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

function isTechUser(user) {
  return String(user?.role || "").toUpperCase() === "TECH";
}

function isViewerUser(user) {
  return String(user?.role || "").toUpperCase() === "VIEWER";
}

function canHandleTickets(user) {
  const role = String(user?.role || "").toUpperCase();
  return role === "ADMIN" || role === "TECH";
}

// V10.19 - Cadastro pela tela de login com 3 opções explícitas.
// Cada opção exige seu próprio código interno.
function roleFromRegisterCode(code) {
  const value = String(code || "").trim();
  if (!value) return null;
  if (value === String(REGISTER_CODE_ADMIN).trim()) return "ADMIN";
  if (value === String(REGISTER_CODE_TECH).trim()) return "TECH";
  if (value === String(REGISTER_CODE_VIEWER).trim()) return "VIEWER";
  return null;
}

function roleLabelBR(role) {
  return { ADMIN: "Administrador", TECH: "Técnico", VIEWER: "Visualizador" }[String(role || "").toUpperCase()] || "Usuário";
}

function requireAdmin(req, res, next) {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ ok: false, error: "Apenas administrador pode executar esta ação" });
  }
  next();
}

function requireTicketHandler(req, res, next) {
  if (!canHandleTickets(req.user)) {
    return res.status(403).json({ ok: false, error: "Visualizador não pode alterar chamados" });
  }
  next();
}

function makeResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendResetCodeEmail(to, code, name) {
  const subject = "Código para redefinir sua senha - Guará Facilities";
  const safeName = String(name || "").trim();
  const text = `Olá ${safeName || ""},

Seu código para redefinir a senha é: ${code}

Ele expira em ${RESET_CODE_MINUTES} minutos.

Se você não pediu isso, ignore este email.`;
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#06123a">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5ebf5">
      <div style="background:#06123a;color:#fff;padding:22px 24px">
        <div style="font-size:12px;opacity:.8;font-weight:700">GUARÁ FACILITIES</div>
        <div style="font-size:22px;font-weight:900;margin-top:4px">Redefinição de senha</div>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 14px">Olá ${safeName || ""},</p>
        <p style="margin:0 0 18px">Use o código abaixo para redefinir sua senha:</p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:900;background:#eef4ff;color:#0b2f87;border-radius:16px;padding:18px;text-align:center">${code}</div>
        <p style="margin:18px 0 0;color:#657293;font-size:13px">Esse código expira em ${RESET_CODE_MINUTES} minutos. Se você não pediu isso, ignore este email.</p>
      </div>
    </div>
  </div>`;

  // Preferido: Resend por API. Não precisa Gmail/2FA/senha de app.
  if ((EMAIL_PROVIDER === "resend" || RESEND_API_KEY) && RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SMTP_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Falha Resend ${response.status}: ${detail || response.statusText}`);
    }

    return { sent: true, provider: "resend" };
  }

  // Fallback antigo: SMTP, caso você queira usar outro provedor no futuro.
  if (nodemailer && SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({ from: SMTP_FROM, to, subject, text, html });
    return { sent: true, provider: "smtp" };
  }

  console.log("======================================");
  console.log(" CÓDIGO DE RECUPERAÇÃO GUARÁ FACILITIES");
  console.log(" Email:", to);
  console.log(" Código:", code);
  console.log(" Configure RESEND_API_KEY no .env para envio real por email.");
  console.log("======================================");
  return { sent: false, fallback: true };
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header.split(";").filter(Boolean).map((item) => {
      const idx = item.indexOf("=");
      const key = item.slice(0, idx).trim();
      const val = decodeURIComponent(item.slice(idx + 1).trim());
      return [key, val];
    })
  );
}


// =========================
// SAAS: identifica a empresa acessada por /c/:slug
// Mantém compatível com login.html antigo, pois usa cookie gf_company_slug.
// =========================
function getRequestedCompanySlug(req) {
  try {
    const cookies = parseCookies(req);
    let fromReferer = "";
    try {
      const ref = String(req.headers.referer || req.headers.referrer || "");
      if (ref) {
        const u = new URL(ref, PUBLIC_QR_BASE);
        fromReferer = u.searchParams.get("company") || "";
        if (!fromReferer) {
          const m = u.pathname.match(/^\/c\/([^\/]+)/i);
          if (m) fromReferer = decodeURIComponent(m[1] || "");
        }
      }
    } catch(_){}
    const fromPath = String(req.path || "").match(/^\/c\/([^\/]+)/i)?.[1] || "";
    return String(
      req.body?.company_slug ||
      req.body?.company ||
      req.query?.company ||
      fromPath ||
      fromReferer ||
      cookies.gf_company_slug ||
      ""
    ).trim().toLowerCase();
  } catch (_) {
    return "";
  }
}

function getRequestedCompany(req) {
  const companySlug = getRequestedCompanySlug(req);
  if (!companySlug) return null;
  try {
    return db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, active, plan_status
      FROM companies
      WHERE slug = ?
      LIMIT 1
    `).get(companySlug) || null;
  } catch (err) {
    console.warn("[SAAS] Falha ao buscar empresa da sessão:", err.message);
    return null;
  }
}

function setCompanyCookie(res, slug) {
  const value = encodeURIComponent(String(slug || "").trim().toLowerCase());
  if (!value) return;
  res.append("Set-Cookie", `gf_company_slug=${value}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
}

function clearCompanyCookie(res) {
  res.append("Set-Cookie", "gf_company_slug=; Path=/; SameSite=Lax; Max-Age=0");
}

function saasSafeSlug(slug) {
  return String(slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'default';
}

function sessionCookieName(slug) {
  const safe = saasSafeSlug(slug);
  return safe && safe !== 'default' ? `gf_session_${safe}` : 'gf_session';
}

function sessionCookieClearHeaders(slug) {
  const name = sessionCookieName(slug);
  const headers = [`${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`];
  if (name !== 'gf_session') headers.push('gf_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  return headers;
}

function buildSessionCookie(name, token) {
  const secure = String(PUBLIC_QR_BASE || "").toLowerCase().startsWith("https://") ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${secure}; Max-Age=${SESSION_HOURS * 60 * 60}`;
}


function companyPublicPayload(company) {
  if (!company) return null;
  return {
    id: company.id,
    name: company.name || '',
    slug: company.slug || '',
    logo_url: company.logo_url || '',
    plan_name: company.plan_name || '',
    plan_status: company.plan_status || '',
    active: Number(company.active || 0)
  };
}

function injectCompanyBrand(html, company) {
  const payload = JSON.stringify(companyPublicPayload(company)).replace(/</g, '\\u003c');
  const script = `
<script id="gf-company-brand-inject">
(function(){
  window.GF_COMPANY = ${payload};
  var c = window.GF_COMPANY || null;
  if(!c) return;

  try { sessionStorage.setItem('GF_COMPANY_SLUG', c.slug || ''); } catch(e){}
  try { localStorage.setItem('gf_company_slug', c.slug || ''); } catch(e){}
  try { localStorage.setItem('GF_COMPANY_SLUG', c.slug || ''); } catch(e){}
  try { document.documentElement.setAttribute('data-company-slug', c.slug || ''); } catch(e){}

  function normalize(s){ return String(s || '').trim(); }
  function isGuaraText(t){
    return /GUAR[ÁA]|Guar[áa]|ACQUA PARK|Guar[aá] Park Santa Isabel|Guar[aá] Facilities/i.test(String(t||''));
  }
  function replaceGuaraTexts(name){
    var walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var t = node.nodeValue || '';
      if(!isGuaraText(t)) return;
      node.nodeValue = t
        .replace(/GUAR[ÁA] ACQUA PARK/ig, name)
        .replace(/GUAR[ÁA] PARK/ig, name)
        .replace(/GUAR[ÁA] FACILITIES/ig, name)
        .replace(/Guar[aá] Park Santa Isabel/ig, name)
        .replace(/Guar[aá] Acqua Park/ig, name)
        .replace(/Guar[aá] Park/ig, name);
    });
  }
  function isBrandImg(img){
    var alt = (img.getAttribute('alt') || '').toLowerCase();
    var src = (img.getAttribute('src') || '').toLowerCase();
    return alt.includes('guar') || src.includes('logo') || src.includes('guara') || img.closest('.logo-box') || img.closest('.brandLogoBox') || img.closest('.appLoginBrand') || img.closest('.hero-brand-row') || img.closest('.appTopbar');
  }
  function setLogo(name, logo){
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
    var forcedLoginLogo = document.getElementById('loginCompanyLogo');
    if(forcedLoginLogo && imgs.indexOf(forcedLoginLogo) === -1) imgs.push(forcedLoginLogo);
    imgs.forEach(function(img){
      if(!isBrandImg(img) && img.id !== 'loginCompanyLogo') return;
      if(logo){
        img.src = logo;
        img.alt = name;
        img.style.display = 'block';
        img.style.objectFit = 'contain';
        var parent = img.closest('.logo-box,.brandLogoBox,.appLoginBrand');
        if(parent) parent.style.display = parent.classList && parent.classList.contains('appLoginBrand') ? 'grid' : '';
        img.onerror = function(){
          this.style.display='none';
          var p=this.closest('.logo-box,.brandLogoBox');
          if(p) p.style.display='none';
          document.body.classList.add('gf-no-company-logo');
        };
      } else {
        img.style.display = 'none';
        var p = img.closest('.logo-box,.brandLogoBox');
        if(p) p.style.display='none';
      }
    });
    if(!logo) document.body.classList.add('gf-no-company-logo');
    else document.body.classList.remove('gf-no-company-logo');
  }
  function addNoLogoCss(){
    if(document.getElementById('gf-company-brand-css')) return;
    var st=document.createElement('style');
    st.id='gf-company-brand-css';
    st.textContent = [
      'body.gf-no-company-logo .appLoginBrand{grid-template-columns:1fr!important;gap:0!important;}',
      'body.gf-no-company-logo .appLoginBrand>img{display:none!important;}',
      'body.gf-no-company-logo .hero-brand-row{display:flex!important;gap:0!important;justify-content:flex-start!important;}',
      'body.gf-no-company-logo .logo-box, body.gf-no-company-logo .brandLogoBox{display:none!important;width:0!important;min-width:0!important;height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important;}',
      'body.gf-no-company-logo header.topbar.appTopbar .appBrand .brandLogoBox{display:none!important;width:0!important;min-width:0!important;height:0!important;padding:0!important;margin:0!important;border:0!important;}',
      'body.gf-no-company-logo .appTopbar .brandText{max-width:calc(100vw - 80px)!important;}',
      '.gf-company-footer-name{font-weight:1000!important;}'
    ].join(String.fromCharCode(10));
    document.head.appendChild(st);
  }
  function ensureCompanyPill(name){
    var subtitle = document.getElementById('subtitle') || document.querySelector('.muted');
    if(subtitle && !subtitle.querySelector('[data-gf-login-company]')){
      var pill=document.createElement('span');
      pill.setAttribute('data-gf-login-company','1');
      pill.style.cssText='display:inline-flex;margin-left:8px;border-radius:999px;background:#eef7ff;border:1px solid #dbe7ff;color:#073763;padding:7px 10px;font-size:12px;font-weight:1000;vertical-align:middle;';
      pill.textContent='Empresa: '+name;
      subtitle.appendChild(pill);
    }
  }
  function apply(){
    var name = normalize(c.name) || 'Empresa';
    var logo = normalize(c.logo_url);
    addNoLogoCss();
    try { document.title = (document.title || 'Gestão de Patrimônio').replace(/Guar[aá]( Acqua Park| Park| Facilities)?/ig, name); } catch(e){}
    replaceGuaraTexts(name);
    setLogo(name, logo);
    Array.prototype.slice.call(document.querySelectorAll('form')).forEach(function(form){
      if(!form.querySelector('input[name="company_slug"]')){
        var i=document.createElement('input'); i.type='hidden'; i.name='company_slug'; i.value=c.slug||''; form.appendChild(i);
      }
    });
    try {
      var bt = document.querySelector('.brandText small'); if(bt) bt.textContent = name;
      var footerStrong = document.querySelector('footer.footer strong'); if(footerStrong) footerStrong.textContent = name;
      var footer = document.querySelector('footer.footer'); if(footer) footer.innerHTML = '<strong class="gf-company-footer-name">'+name.replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})+'</strong><br>Gestão de Patrimônio · Controle inteligente de equipamentos';
    } catch(e){}
    ensureCompanyPill(name);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
</script>`;
  // V-MULTIEMPRESA-QR-ISOLADO:
  // Injeta a empresa no <head> quando possível, antes dos scripts inline do QR/admin.
  // Assim o QR não depende do cookie global gf_company_slug quando há várias empresas em abas diferentes.
  if (html.includes('</head>')) return html.replace('</head>', script + '\n</head>');
  if (html.includes('</body>')) return html.replace('</body>', script + '\n</body>');
  return script + html;
}


function injectAssumeConfirmModalScript(html, filename) {
  if (!["admin.html","app.html","index.html"].includes(String(filename || "").toLowerCase())) return html;
  if (String(html || "").includes("GF_ASSUME_MODAL_PATCH_V7")) return html;

  const script = `
<script>
(function(){
  "use strict";
  if (window.GF_ASSUME_MODAL_PATCH_V7) return;
  window.GF_ASSUME_MODAL_PATCH_V7 = true;

  // PWA/Push: não desinstalar Service Worker aqui.
  // O Service Worker é a inscrição real do app no Android; remover ele derruba as notificações no PWA.
  // O /sw.js já é online-first e no-store, então não há cache antigo para limpar à força.

  function ensureStyle(){
    if(document.getElementById("gfAssumeModalStyleV7")) return;
    var st = document.createElement("style");
    st.id = "gfAssumeModalStyleV7";
    st.textContent =
      ".gf-assume-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(5,14,35,.62)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important}" +
      ".gf-assume-modal{width:min(460px,calc(100vw - 36px))!important;background:#fff!important;border-radius:24px!important;border:1px solid #d9e7fb!important;box-shadow:0 28px 90px rgba(0,0,0,.32)!important;padding:26px!important;text-align:center!important;font-family:inherit!important}" +
      ".gf-assume-icon{width:58px!important;height:58px!important;margin:0 auto 12px!important;border-radius:18px!important;background:#fff3d6!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important}" +
      ".gf-assume-title{margin:0 0 8px!important;color:#06183d!important;font-size:22px!important;font-weight:900!important}" +
      ".gf-assume-text{margin:0 0 22px!important;color:#334766!important;font-size:15px!important;line-height:1.45!important}" +
      ".gf-assume-actions{display:flex!important;gap:12px!important;justify-content:center!important;flex-wrap:wrap!important}" +
      ".gf-assume-btn{border:0!important;border-radius:16px!important;padding:14px 20px!important;min-width:150px!important;font-weight:900!important;cursor:pointer!important;font-size:14px!important}" +
      ".gf-assume-cancel{background:#fff!important;color:#08224d!important;border:1px solid #d6e3f4!important;box-shadow:0 10px 24px rgba(0,0,0,.08)!important}" +
      ".gf-assume-ok{background:linear-gradient(135deg,#f59e0b,#ffb31a)!important;color:#06183d!important;box-shadow:0 12px 26px rgba(245,158,11,.28)!important}";
    document.head.appendChild(st);
  }

  function openAssumeModal(ticketId){
    ensureStyle();
    return new Promise(function(resolve){
      var old = document.getElementById("gfAssumeOverlayV7");
      if(old) old.remove();

      var ov = document.createElement("div");
      ov.id = "gfAssumeOverlayV7";
      ov.className = "gf-assume-overlay";
      ov.innerHTML =
        '<div class="gf-assume-modal" role="dialog" aria-modal="true">' +
          '<div class="gf-assume-icon">⚠️</div>' +
          '<h3 class="gf-assume-title">Assumir chamado?</h3>' +
          '<p class="gf-assume-text">Deseja realmente assumir o chamado' + (ticketId ? ' nº <b>'+ticketId+'</b>' : '') + '?</p>' +
          '<div class="gf-assume-actions">' +
            '<button type="button" class="gf-assume-btn gf-assume-cancel">Cancelar</button>' +
            '<button type="button" class="gf-assume-btn gf-assume-ok">Sim, assumir</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(ov);

      function close(v){
        if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
        resolve(v);
      }

      ov.querySelector(".gf-assume-cancel").onclick = function(){ close(false); };
      ov.querySelector(".gf-assume-ok").onclick = function(){ close(true); };
      ov.addEventListener("click", function(e){ if(e.target === ov) close(false); });

      function esc(e){
        if(e.key === "Escape"){
          document.removeEventListener("keydown", esc, true);
          close(false);
        }
      }
      document.addEventListener("keydown", esc, true);
    });
  }

  function cloneInitWithConfirmation(init){
    var next = {};
    init = init || {};
    Object.keys(init).forEach(function(k){ next[k] = init[k]; });

    var headers = new Headers(init.headers || {});
    headers.set("x-gf-assume-confirmed", "YES");
    headers.set("x-assume-confirmed", "YES");
    next.headers = headers;

    if(init.body && typeof init.body === "string"){
      try{
        var obj = JSON.parse(init.body);
        obj.assume_confirmed = true;
        obj.assumeConfirmed = true;
        next.body = JSON.stringify(obj);
        if(!headers.has("Content-Type")) headers.set("Content-Type","application/json");
      }catch(e){}
    }

    return next;
  }

  function findTicketIdFromUrl(url){
    var m = String(url || "").match(/(?:tickets?|chamados?)\/(\\d+)|(?:ticket_id|id)=(\\d+)/i);
    return m ? (m[1] || m[2] || "") : "";
  }


  // GF_FIX_ASSUME_VISIBLE_CARD_20260620C
  // Corrige o caso em que a seta muda o chamado visível no card,
  // mas o botão antigo ainda tenta assumir outro ID.
  function gfText(el){
    try { return String((el && (el.innerText || el.textContent)) || ""); } catch(e){ return ""; }
  }
  function gfFindCardFromButton(btn){
    var el = btn;
    for(var i=0; el && i<8; i++, el=el.parentElement){
      var t = gfText(el);
      if(/#\s*\d+/.test(t) && /Assumir|Finalizar|Ver detalhes/i.test(t)) return el;
    }
    return btn && btn.closest ? (btn.closest('[data-ticket-id],[data-gf-ticket-id],[data-id],.ticket-card,.card,.gf-card,.dash-card,.dashboard-card') || btn.parentElement) : null;
  }
  function gfVisibleTicketIdFromCard(card){
    if(!card) return "";
    var attrs = ['data-gf-visible-ticket','data-gf-current-ticket','data-current-ticket-id','data-ticket-id','data-gf-ticket-id','data-id'];
    for(var a=0; a<attrs.length; a++){
      var v = card.getAttribute && card.getAttribute(attrs[a]);
      if(v && /^\d+$/.test(String(v).trim())) return String(v).trim();
    }
    var nodes = [];
    try { nodes = Array.prototype.slice.call(card.querySelectorAll('[data-ticket-id],[data-gf-ticket-id],[data-id],.ticket-number,.ticket-id,.gf-ticket-number,.dash-ticket-number')); } catch(e){}
    for(var n=0; n<nodes.length; n++){
      var nt = gfText(nodes[n]);
      var m1 = nt.match(/#\s*(\d+)/);
      if(m1) return m1[1];
      var av = nodes[n].getAttribute && (nodes[n].getAttribute('data-ticket-id') || nodes[n].getAttribute('data-gf-ticket-id') || nodes[n].getAttribute('data-id'));
      if(av && /^\d+$/.test(String(av).trim())) return String(av).trim();
    }
    var txt = gfText(card);
    var m = txt.match(/#\s*(\d+)/);
    return m ? m[1] : "";
  }
  function gfRewriteCardActionIds(card, id){
    if(!card || !id) return;
    var attrs = ['data-ticket-id','data-gf-ticket-id','data-gf-visible-ticket','data-gf-current-ticket','data-current-ticket-id'];
    attrs.forEach(function(a){ try{ card.setAttribute(a, id); }catch(e){} });
    try{
      Array.prototype.slice.call(card.querySelectorAll('button,a,[onclick],[data-gf-assume-ticket],[data-gf-resolve-ticket],[data-gf-open-ticket],[data-ticket-id]')).forEach(function(el){
        ['data-gf-assume-ticket','data-gf-resolve-ticket','data-gf-open-ticket','data-ticket-id','data-gf-ticket-id','data-id'].forEach(function(a){
          if(el.hasAttribute && el.hasAttribute(a)) el.setAttribute(a, id);
        });
        var oc = el.getAttribute && el.getAttribute('onclick');
        if(oc && /setStatus\s*\(/.test(oc)){
          el.setAttribute('onclick', oc.replace(/setStatus\s*\(\s*\d+\s*,/g, 'setStatus('+id+','));
        }
        if(oc && /open.*Ticket|ticket/i.test(oc)){
          el.setAttribute('onclick', oc.replace(/\(\s*\d+\s*\)/g, '('+id+')'));
        }
      });
    }catch(e){}
  }
  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('button,a,[role="button"]') : null;
    if(!btn) return;
    var label = gfText(btn).trim();
    if(!/Assumir chamado|Assumir/i.test(label)) return;
    var card = gfFindCardFromButton(btn);
    var id = gfVisibleTicketIdFromCard(card);
    if(!id) return;

    // Atualiza na hora, antes de qualquer listener antigo ler o botão.
    gfRewriteCardActionIds(card, id);
    btn.setAttribute('data-gf-assume-ticket', id);
    btn.setAttribute('data-ticket-id', id);

    // Se havia onclick antigo com outro ID, cancela e chama a ação correta.
    var oc = btn.getAttribute && btn.getAttribute('onclick');
    var old = oc && oc.match(/setStatus\s*\(\s*(\d+)/);
    var mustOwn = old && String(old[1]) !== String(id);
    if(mustOwn || btn.__gfForceVisibleAssume){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      try{
        if(typeof window.setStatus === 'function'){
          window.setStatus(Number(id), 'IN_PROGRESS');
        } else {
          window.fetch('/api/admin/tickets/'+encodeURIComponent(id)+'/status', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({status:'IN_PROGRESS'})
          }).then(function(){ try{ location.reload(); }catch(e){} });
        }
      }catch(e){ console.warn('[GF assume visible]', e); }
    }
  }, true);

  document.addEventListener('click', function(ev){
    var arrow = ev.target && ev.target.closest ? ev.target.closest('button,a,[role="button"]') : null;
    if(!arrow) return;
    var txt = gfText(arrow);
    if(!/[‹›←→]/.test(txt) && !/prev|next|anterior|pr[oó]ximo/i.test(String(arrow.className||'')+' '+txt)) return;
    setTimeout(function(){
      var card = gfFindCardFromButton(arrow);
      var id = gfVisibleTicketIdFromCard(card);
      if(id) gfRewriteCardActionIds(card, id);
    }, 0);
    setTimeout(function(){
      var card = gfFindCardFromButton(arrow);
      var id = gfVisibleTicketIdFromCard(card);
      if(id) gfRewriteCardActionIds(card, id);
    }, 80);
  }, true);

  var nativeFetch = window.fetch;
  if(nativeFetch){
    window.fetch = async function(input, init){
      var response = await nativeFetch.apply(this, arguments);

      try{
        if(response && response.status === 428){
          var clone = response.clone();
          var data = {};
          try{ data = await clone.json(); }catch(e){}
          if(data && data.need_confirmation){
            var url = typeof input === "string" ? input : (input && input.url ? input.url : "");
            var ticketId = data.ticket_id || data.ticketId || findTicketIdFromUrl(url);
            var ok = await openAssumeModal(ticketId);

            if(!ok){
              return new Response(JSON.stringify({ok:true,cancelled:true}), {
                status: 200,
                headers: {"Content-Type":"application/json"}
              });
            }

            var retryInit = cloneInitWithConfirmation(init || {});
            return nativeFetch.call(this, input, retryInit);
          }
        }
      }catch(e){}

      return response;
    };
  }

  var nativeAlert = window.alert;
  window.alert = function(msg){
    var text = String(msg || "");
    if(text.indexOf("Confirmação obrigatória antes de assumir") !== -1){
      openAssumeModal("");
      return;
    }
    return nativeAlert.apply(window, arguments);
  };
})();
</script>`;

  if (String(html).includes("</head>")) return String(html).replace("</head>", script + "\n</head>");
  if (String(html).includes("</body>")) return String(html).replace("</body>", script + "\n</body>");
  return String(html) + script;
}



function injectQrHistoryModalFix(html, filename) {
  const file = String(filename || '').toLowerCase();
  if (file !== 'qr.html' && file !== 'public.html') return html;
  const fix = `
<style id="gf-qr-history-modal-fix-final">
  .history-modal{
    width:min(560px,calc(100vw - 28px))!important;
    max-height:calc(100vh - 28px)!important;
    border-radius:24px!important;
  }
  .history-modal-head{padding:18px 20px!important;overflow:visible!important;}
  .history-modal-title{
    display:block!important;
    color:#fff!important;
    font-size:20px!important;
    line-height:1.18!important;
    font-weight:1000!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    word-break:break-word!important;
    max-width:calc(100% - 52px)!important;
  }
  .history-modal-sub{
    display:block!important;
    margin-top:5px!important;
    color:rgba(255,255,255,.92)!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    word-break:break-word!important;
  }
  .history-modal-body{
    padding:20px!important;
    max-height:calc(100vh - 178px)!important;
    overflow-y:auto!important;
  }
  .history-line{
    display:grid!important;
    grid-template-columns:128px minmax(0,1fr)!important;
    gap:10px!important;
    align-items:start!important;
    padding:11px 0!important;
  }
  .history-line-label{
    min-width:0!important;
    width:auto!important;
    max-width:none!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    word-break:normal!important;
    line-height:1.2!important;
  }
  .history-line-value{
    min-width:0!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    word-break:break-word!important;
  }
  @media(max-width:600px){
    .history-modal{width:calc(100vw - 24px)!important;}
    .history-modal-title{font-size:18px!important;max-width:calc(100% - 48px)!important;}
    .history-line{grid-template-columns:102px minmax(0,1fr)!important;gap:8px!important;}
    .history-modal-body{padding:18px!important;}
  }
</style>
<script id="gf-qr-history-modal-fix-final-js">
(function(){
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function fixHistoryModalText(){
    try{
      var title = document.getElementById('historyModalTitle');
      var sub = document.getElementById('historyModalSub');
      var body = document.getElementById('historyModalBody');
      if(!title || !body) return;

      var labels = Array.prototype.slice.call(body.querySelectorAll('.history-line-label'));
      var values = Array.prototype.slice.call(body.querySelectorAll('.history-line-value'));

      labels.forEach(function(label){
        var t = txt(label.textContent).toUpperCase();
        if(t === 'SE' || t === 'SERVICO' || t === 'SERVIÇO') label.textContent = 'SERVIÇO';
      });

      var currentTitle = txt(title.textContent);
      if(/^:\s*/.test(currentTitle)){
        var item = currentTitle.replace(/^:\s*/, '').trim();
        var kind = 'Serviço';
        title.textContent = kind + ': ' + item;
      }

      var newTitle = txt(title.textContent);
      if(newTitle && newTitle.indexOf(':') === -1){
        var serviceValue = '';
        for(var i=0;i<labels.length;i++){
          var lab = txt(labels[i].textContent).toUpperCase();
          if(lab === 'SERVIÇO' || lab === 'SE'){
            serviceValue = txt(values[i] && values[i].childNodes && values[i].childNodes[0] ? values[i].childNodes[0].textContent : values[i] && values[i].textContent);
            break;
          }
        }
        if(serviceValue) title.textContent = 'Serviço: ' + serviceValue;
      }

      if(sub){
        sub.style.whiteSpace='normal';
        sub.style.overflow='visible';
      }
    }catch(e){ console.warn('[QR modal fix]', e); }
  }

  var oldOpen = window.openHistoryDetail;
  if(typeof oldOpen === 'function' && !oldOpen.__gfFinalModalFix){
    var wrapped = function(){
      var r = oldOpen.apply(this, arguments);
      setTimeout(fixHistoryModalText, 0);
      setTimeout(fixHistoryModalText, 80);
      return r;
    };
    wrapped.__gfFinalModalFix = true;
    window.openHistoryDetail = wrapped;
  }

  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.home-history-card')){
      setTimeout(fixHistoryModalText, 0);
      setTimeout(fixHistoryModalText, 80);
    }
  }, true);
})();
</` + `script>`;

  let out = String(html || '');
  out = out.replace(/<style id="gf-qr-history-modal-fix-final">[\s\S]*?<\/style>\s*/g, '');
  out = out.replace(/<script id="gf-qr-history-modal-fix-final-js">[\s\S]*?<\/script>\s*/g, '');
  if (out.includes('</body>')) return out.replace('</body>', fix + '\n</body>');
  if (out.includes('</head>')) return out.replace('</head>', fix + '\n</head>');
  return out + fix;
}

function sendCompanyHtml(req, res, filename, company) {
  const full = path.join(FRONTEND_DIR, filename);
  if (!fs.existsSync(full)) return res.status(404).send(`Arquivo ${filename} não encontrado no frontend`);
  try {
    const html = fs.readFileSync(full, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(injectQrHistoryModalFix(injectAssumeConfirmModalScript(injectCompanyBrand(html, company), filename), filename));
  } catch (err) {
    console.warn('[SAAS] Falha ao injetar marca da empresa:', err.message);
    return res.sendFile(full);
  }
}

function clearSessionsForUserInCompany(userId, companyId, keepToken = null) {
  try {
    for (const [token, session] of sessions.entries()) {
      if (session && session.userId === userId && Number(session.companyId || 0) === Number(companyId || 0) && token !== keepToken) {
        sessions.delete(token);
        deletePersistentSession(token);
      }
    }
  } catch (err) {
    console.warn('Aviso: falha ao limpar sessões da empresa:', err.message);
  }
}

function getUserFromRequest(req) {
  const cookies = parseCookies(req);
  const companySlug = getRequestedCompanySlug(req);
  const preferredCookie = sessionCookieName(companySlug);
  const token = cookies[preferredCookie] || (!companySlug ? cookies.gf_session : null);
  if (!token) return null;

  let session = sessions.get(token);
  if (!session) {
    // Recupera login após restart do servidor/PM2.
    session = loadPersistentSession(token);
    if (session) sessions.set(token, session);
  }

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    deletePersistentSession(token);
    return null;
  }

  // Segurança SaaS: se a requisição está dentro de /c/empresa ou veio desse painel,
  // a sessão precisa ser exatamente daquela empresa. Isso permite abrir duas empresas
  // em abas diferentes sem uma derrubar ou trocar a outra.
  if (companySlug && String(session.companySlug || '').toLowerCase() !== String(companySlug).toLowerCase()) {
    return null;
  }

  session.lastSeenAt = Date.now();
  // Mantém sessão viva enquanto o usuário usa o sistema/app.
  session.expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  sessions.set(token, session);
  savePersistentSession(token, session);
  req.gfSessionToken = token;
  req.gfSessionCookieName = preferredCookie;

  const user = db.prepare(`
    SELECT id, name, email, role, active, company_id, COALESCE(is_super_admin,0) AS is_super_admin
    FROM users
    WHERE id = ? AND active = 1
  `).get(session.userId);

  if (user && session.companyId) {
    user.session_company_id = Number(session.companyId);
    user.session_company_slug = session.companySlug || '';
  }

  return user || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ ok: false, error: "Não autenticado" });
    }

    // SAAS CONTEXTO: se caiu no /admin.html sem sessão, volta para o login da empresa certa.
    // Não deixa o usuário cair no login global e misturar empresa.
    const cookies = parseCookies(req);
    const companySlug = String(cookies.gf_company_slug || req.query.company || "").trim().toLowerCase();
    if (companySlug) {
      return res.redirect(`/login?company=${encodeURIComponent(companySlug)}`);
    }

    return res.redirect("/login");
  }
  req.user = user;
  try {
    if (req.gfSessionToken && req.gfSessionCookieName) {
      res.append("Set-Cookie", buildSessionCookie(req.gfSessionCookieName, req.gfSessionToken));
    }
  } catch(_){}
  next();
}

function ensureAdminPassword() {
  try {
    const user = db.prepare(`SELECT id, name, password_hash FROM users WHERE email = ?`).get(DEFAULT_ADMIN_EMAIL);
    if (!user) {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, role, active)
        VALUES (?, ?, ?, 'ADMIN', 1)
      `).run(DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashPassword(DEFAULT_ADMIN_PASSWORD));
      return;
    }

    // V12.4 - remove o nome antigo "Admin Principal" da conta padrão, sem apagar a conta.
    if (String(user.name || "").trim().toLowerCase() === "admin principal") {
      db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(DEFAULT_ADMIN_NAME, user.id);
    }

    if (!user.password_hash) {
      db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(DEFAULT_ADMIN_PASSWORD), user.id);
    }
  } catch (err) {
    console.warn("Aviso: não foi possível garantir senha admin:", err.message);
  }
}

// ensureAdminPassword();


// V7.4 - auditoria administrativa para cadastros, transferências e histórico
function ensureAdminMigrations() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        action TEXT NOT NULL,
        user_id INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `).run();

    // V91.1 - auditoria também recebe company_id para não misturar empresas no mesmo banco.
    try { addColumnIfMissing('admin_audit_log','company_id',`ALTER TABLE admin_audit_log ADD COLUMN company_id INTEGER`); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_company ON admin_audit_log(company_id)`).run(); } catch(_){}
    try { db.prepare(`UPDATE admin_audit_log SET company_id=(SELECT company_id FROM users WHERE users.id=admin_audit_log.user_id) WHERE company_id IS NULL AND user_id IS NOT NULL`).run(); } catch(_){}

    // V10.5 - garante campos do modelo do equipamento sem quebrar bancos antigos
    const cols = db.prepare(`PRAGMA table_info(assets)`).all().map(c => c.name);
    const addCol = (name, ddl) => { if (!cols.includes(name)) db.prepare(ddl).run(); };
    addCol('brand', `ALTER TABLE assets ADD COLUMN brand TEXT`);
    addCol('model', `ALTER TABLE assets ADD COLUMN model TEXT`);
    // V17.1 - classificação do equipamento para o QR: TI ou Manutenção
    // Equipamentos antigos que ainda não foram marcados ficam como TI por padrão.
    addCol('asset_department', `ALTER TABLE assets ADD COLUMN asset_department TEXT`);
    // V60 - separa equipamento físico de serviço lógico sem quebrar rotas antigas.
    // Serviços continuam na tabela assets para preservar chamados/QR, mas ficam marcados como SERVICE
    // e podem ser removidos dos relatórios de patrimônio/equipamento físico.
    addCol('asset_kind', `ALTER TABLE assets ADD COLUMN asset_kind TEXT`);
    try {
      db.prepare(`UPDATE assets SET asset_department = 'TI' WHERE asset_department IS NULL OR TRIM(asset_department) = ''`).run();
    } catch(_){}
    try {
      db.prepare(`
        UPDATE assets
        SET asset_kind = CASE
          WHEN UPPER(TRIM(name)) IN (
            'LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL',
            'MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA',
            'ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA',
            'REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS'
          ) THEN 'SERVICE'
          ELSE COALESCE(NULLIF(TRIM(asset_kind),''),'EQUIPMENT')
        END
        WHERE asset_kind IS NULL OR TRIM(asset_kind) = ''
      `).run();
    } catch(_){}

    // V15 - identificação profissional para itens sem patrimônio
    addCol('sp_responsavel', `ALTER TABLE assets ADD COLUMN sp_responsavel TEXT`);
    addCol('sp_local', `ALTER TABLE assets ADD COLUMN sp_local TEXT`);
    addCol('sp_identificacao', `ALTER TABLE assets ADD COLUMN sp_identificacao TEXT`);
    addCol('sp_obs', `ALTER TABLE assets ADD COLUMN sp_obs TEXT`);

    // V10.8 - equipamentos fora de operação: mantém origem e remove do setor ativo
    addCol('last_sector_id', `ALTER TABLE assets ADD COLUMN last_sector_id INTEGER`);
    addCol('out_of_operation_at', `ALTER TABLE assets ADD COLUMN out_of_operation_at TEXT`);
    addCol('out_of_operation_reason', `ALTER TABLE assets ADD COLUMN out_of_operation_reason TEXT`);

    // V16 PLUS - dados financeiros opcionais do equipamento
    addCol('purchase_value', `ALTER TABLE assets ADD COLUMN purchase_value REAL`);
    addCol('invoice_number', `ALTER TABLE assets ADD COLUMN invoice_number TEXT`);
    addCol('purchase_date', `ALTER TABLE assets ADD COLUMN purchase_date TEXT`);
    addCol('supplier_name', `ALTER TABLE assets ADD COLUMN supplier_name TEXT`);
    addCol('warranty_until', `ALTER TABLE assets ADD COLUMN warranty_until TEXT`);
    addCol('useful_life_years', `ALTER TABLE assets ADD COLUMN useful_life_years INTEGER`);

    // V10.7 - finalização técnica do chamado sem quebrar bancos antigos
    const ticketCols = db.prepare(`PRAGMA table_info(tickets)`).all().map(c => c.name);
    const addTicketCol = (name, ddl) => { if (!ticketCols.includes(name)) db.prepare(ddl).run(); };
    addTicketCol('final_outcome', `ALTER TABLE tickets ADD COLUMN final_outcome TEXT`);
    addTicketCol('technical_observation', `ALTER TABLE tickets ADD COLUMN technical_observation TEXT`);
    // V16 PLUS - custo opcional de peça/manutenção ao finalizar chamado
    addTicketCol('maintenance_value', `ALTER TABLE tickets ADD COLUMN maintenance_value REAL`);
    addTicketCol('maintenance_description', `ALTER TABLE tickets ADD COLUMN maintenance_description TEXT`);
    addTicketCol('maintenance_type', `ALTER TABLE tickets ADD COLUMN maintenance_type TEXT`);
    addTicketCol('part_name', `ALTER TABLE tickets ADD COLUMN part_name TEXT`);
    addTicketCol('supplier_name', `ALTER TABLE tickets ADD COLUMN supplier_name TEXT`);

    // V16 PLUS - histórico financeiro normalizado por equipamento/chamado
    db.prepare(`
      CREATE TABLE IF NOT EXISTS asset_maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        ticket_id INTEGER,
        maintenance_type TEXT,
        description TEXT,
        part_name TEXT,
        supplier_name TEXT,
        cost REAL DEFAULT 0,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(asset_id) REFERENCES assets(id),
        FOREIGN KEY(ticket_id) REFERENCES tickets(id),
        FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_asset_maintenance_ticket ON asset_maintenance(ticket_id)`).run();


    // V10.16 - códigos temporários para recuperação de senha
    db.prepare(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used_at INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `).run();
  } catch (err) {
    console.warn("Aviso: não foi possível criar admin_audit_log/migrações V10.5:", err.message);
  }
}

function auditAdmin(req, entityType, entityId, action, notes) {
  try {
    const cols = tableCols('admin_audit_log');
    const hasCompany = cols.includes('company_id');
    const cid = (req ? currentCompanyId(req) : null) || null;

    if (hasCompany) {
      db.prepare(`
        INSERT INTO admin_audit_log (company_id, entity_type, entity_id, action, user_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cid, entityType, entityId || null, action, req.user ? req.user.id : null, notes || "");
      return;
    }

    db.prepare(`
      INSERT INTO admin_audit_log (entity_type, entity_id, action, user_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(entityType, entityId || null, action, req.user ? req.user.id : null, notes || "");
  } catch (err) {
    console.warn("Aviso: falha ao gravar auditoria:", err.message);
  }
}


// V91 - log seguro de chamado com company_id quando a tabela exigir.
// Evita erro interno após blindagem multiempresa e mantém compatibilidade com bancos antigos.
function ticketCompanyIdById(ticketId) {
  try {
    const row = db.prepare(`
      SELECT COALESCE(t.company_id, s.company_id) AS company_id
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      WHERE t.id = ?
      LIMIT 1
    `).get(ticketId);
    return row ? (row.company_id || null) : null;
  } catch (_) {
    return null;
  }
}

function insertTicketLogSafe(ticketId, action, userId, notes, req) {
  try {
    const cols = tableCols('ticket_logs');
    const hasCompany = cols.includes('company_id');
    const hasUser = cols.includes('user_id');
    const safeUserId = userId || (req && req.user ? req.user.id : null) || null;
    const safeCompanyId = (req ? currentCompanyId(req) : null) || ticketCompanyIdById(ticketId);

    if (hasCompany && hasUser) {
      db.prepare(`
        INSERT INTO ticket_logs (ticket_id, company_id, action, user_id, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(ticketId, safeCompanyId, action, safeUserId, notes || "");
      return;
    }

    if (hasCompany && !hasUser) {
      db.prepare(`
        INSERT INTO ticket_logs (ticket_id, company_id, action, notes)
        VALUES (?, ?, ?, ?)
      `).run(ticketId, safeCompanyId, action, notes || "");
      return;
    }

    if (!hasCompany && hasUser) {
      db.prepare(`
        INSERT INTO ticket_logs (ticket_id, action, user_id, notes)
        VALUES (?, ?, ?, ?)
      `).run(ticketId, action, safeUserId, notes || "");
      return;
    }

    db.prepare(`
      INSERT INTO ticket_logs (ticket_id, action, notes)
      VALUES (?, ?, ?)
    `).run(ticketId, action, notes || "");
  } catch (err) {
    console.warn("Aviso: falha ao gravar histórico do chamado:", err.message);
  }
}

function assertTicketCanBeFinalizedByCurrentUser(req, ticket) {
  const assigned = Number(ticket && ticket.assigned_to_user_id ? ticket.assigned_to_user_id : 0);
  const uid = Number(req && req.user ? req.user.id : 0);
  if (!assigned) {
    return "Antes de finalizar, o chamado precisa ser assumido por um responsável.";
  }
  if (assigned !== uid && !isSuperAdminUser(req.user)) {
    return "Somente o usuário que assumiu este chamado pode finalizar.";
  }
  return "";
}


ensureAdminMigrations();

// V-MULTIEMPRESA-HARDENING-FINAL - fecha brechas de cadastro por nome/patrimônio entre empresas.
function ensureMultiEmpresaHardeningFinal(){
  try {
    if (hasTable('assets')) {
      try { db.prepare(`DROP INDEX IF EXISTS idx_assets_patrimonio_unique`).run(); } catch(e){ console.warn('[HARDENING] Não removeu índice global de patrimônio:', e.message); }
      try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_company_patrimonio_unique ON assets(company_id, patrimonio) WHERE patrimonio IS NOT NULL AND TRIM(patrimonio) <> '' AND company_id IS NOT NULL`).run(); } catch(e){ console.warn('[HARDENING] Índice patrimônio por empresa não criado:', e.message); }
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_assets_company_kind_name ON assets(company_id, asset_kind, name)`).run(); } catch(e){}
    }
    if (hasTable('services')) {
      try { db.prepare(`UPDATE services SET company_id=(SELECT MIN(company_id) FROM sectors) WHERE company_id IS NULL`).run(); } catch(e){}
      try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_services_company_name ON services(company_id, name)`).run(); } catch(e){ console.warn('[HARDENING] Índice serviços por empresa não criado:', e.message); }
    }
    if (hasTable('service_sectors')) {
      try {
        db.prepare(`
          UPDATE service_sectors
          SET company_id = COALESCE(
            company_id,
            (SELECT company_id FROM services WHERE services.id = service_sectors.service_id),
            (SELECT company_id FROM sectors WHERE sectors.id = service_sectors.sector_id)
          )
          WHERE company_id IS NULL
        `).run();
      } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_service_sectors_company_service_sector ON service_sectors(company_id, service_id, sector_id)`).run(); } catch(e){}
    }
    if (hasTable('issue_types')) {
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company_asset_name ON issue_types(company_id, asset_name, name)`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company_service ON issue_types(company_id, service_id)`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company_asset ON issue_types(company_id, asset_id)`).run(); } catch(e){}
    }
    if (hasTable('ticket_attachments')) {
      try { db.prepare(`UPDATE ticket_attachments SET company_id=(SELECT company_id FROM tickets WHERE tickets.id=ticket_attachments.ticket_id) WHERE company_id IS NULL`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_ticket_attachments_company_ticket ON ticket_attachments(company_id, ticket_id)`).run(); } catch(e){}
    }
    if (hasTable('asset_maintenance')) {
      try { db.prepare(`UPDATE asset_maintenance SET company_id=(SELECT company_id FROM assets WHERE assets.id=asset_maintenance.asset_id) WHERE company_id IS NULL`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_asset_maintenance_company_asset ON asset_maintenance(company_id, asset_id)`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_asset_maintenance_company_ticket ON asset_maintenance(company_id, ticket_id)`).run(); } catch(e){}
    }
    if (hasTable('units')) {
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id)`).run(); } catch(e){}
    }
    if (hasTable('password_reset_codes')) {
      try { db.prepare(`UPDATE password_reset_codes SET company_id=(SELECT company_id FROM users WHERE users.id=password_reset_codes.user_id) WHERE company_id IS NULL`).run(); } catch(e){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_password_reset_codes_company_user ON password_reset_codes(company_id, user_id)`).run(); } catch(e){}
    }
  } catch (err) {
    console.warn('[HARDENING] Falha geral na blindagem multiempresa:', err.message);
  }
}
ensureMultiEmpresaHardeningFinal();


// =========================
// V30 SAAS / SUPER ADMIN - MULTIEMPRESA CONTROLADA
// Cria empresas, planos, gastos/receitas e prepara separação por company_id.
// IMPORTANTE: bancos antigos são migrados para a empresa padrão, sem apagar dados.
// =========================
const SUPER_ADMIN_EMAIL = String(process.env.SUPER_ADMIN_EMAIL || "superadmin@guarafacilities.com").trim().toLowerCase();
const SUPER_ADMIN_PASSWORD = String(process.env.SUPER_ADMIN_PASSWORD || "super123");
const SUPER_ADMIN_NAME = String(process.env.SUPER_ADMIN_NAME || "Super Admin");

function hasTable(name){
  try { return !!db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name); } catch (_) { return false; }
}


// V30.1 - REPARO SEGURO: auditoria apontando para tabela temporária antiga de usuários.
// Em alguns bancos a migração que removeu UNIQUE global de users.email renomeou users para
// users_old_email_global_..., e o FK do admin_audit_log continuou apontando para essa tabela.
// Esta rotina recria somente admin_audit_log com FK correto para users(id), preservando os registros.
function repairAdminAuditLogFK(){
  try{
    if(!hasTable('admin_audit_log')) return;

    const fks = db.prepare(`PRAGMA foreign_key_list(admin_audit_log)`).all();
    const broken = fks.some(f => String(f.table || '').startsWith('users_old_email_global_'));
    if(!broken) return;

    console.log('[SAAS] Corrigindo auditoria apontando para tabela antiga de usuários...');

    const cols = tableCols('admin_audit_log');
    const required = ['id','entity_type','entity_id','action','user_id','notes','created_at'];
    const canCopyAll = required.every(c => cols.includes(c));

    db.pragma('foreign_keys = OFF');
    db.exec('BEGIN');

    db.exec(`ALTER TABLE admin_audit_log RENAME TO admin_audit_log_old_fk_fix`);

    db.exec(`
      CREATE TABLE admin_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        action TEXT NOT NULL,
        user_id INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    if(canCopyAll){
      db.exec(`
        INSERT INTO admin_audit_log (id, entity_type, entity_id, action, user_id, notes, created_at)
        SELECT id, entity_type, entity_id, action, user_id, notes, created_at
        FROM admin_audit_log_old_fk_fix
      `);
    } else {
      db.exec(`
        INSERT INTO admin_audit_log (entity_type, entity_id, action, user_id, notes, created_at)
        SELECT
          COALESCE(entity_type, 'system'),
          entity_id,
          COALESCE(action, 'MIGRATED_LOG'),
          user_id,
          notes,
          COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM admin_audit_log_old_fk_fix
      `);
    }

    db.exec(`DROP TABLE admin_audit_log_old_fk_fix`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user ON admin_audit_log(user_id)`);
    db.exec(`COMMIT`);
    db.pragma('foreign_keys = ON');

    console.log('[SAAS] Auditoria corrigida com sucesso.');
  }catch(err){
    try{ db.exec('ROLLBACK'); }catch(_){}
    try{ db.pragma('foreign_keys = ON'); }catch(_){}
    console.warn('[SAAS] Falha ao corrigir auditoria:', err.message);
  }
}
function tableCols(name){
  try { return db.prepare(`PRAGMA table_info(${name})`).all().map(c=>c.name); } catch (_) { return []; }
}
function addColumnIfMissing(table, col, ddl){
  try { const cols = tableCols(table); if (!cols.includes(col)) db.prepare(ddl).run(); } catch(err){ console.warn(`[SAAS] Falha coluna ${table}.${col}:`, err.message); }
}

function qIdent(name){ return '"' + String(name).replace(/"/g,'""') + '"'; }
function columnDefaultSql(value){
  if (value === null || value === undefined) return '';
  return ' DEFAULT ' + String(value);
}
function ensureUsersEmailPerCompany(){
  try{
    if(!hasTable('users')) return;
    const table = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`).get();
    const createSql = String(table?.sql || '');
    const cols = db.prepare(`PRAGMA table_info(users)`).all();
    if(!cols.length) return;

    let hasGlobalUniqueEmail = /email\s+[^,)]*unique/i.test(createSql);
    try{
      const indexes = db.prepare(`PRAGMA index_list(users)`).all();
      for(const idx of indexes){
        if(Number(idx.unique || 0) !== 1) continue;
        const idxCols = db.prepare(`PRAGMA index_info(${qIdent(idx.name)})`).all().map(c => c.name).filter(Boolean);
        if(idxCols.length === 1 && String(idxCols[0]).toLowerCase() === 'email') hasGlobalUniqueEmail = true;
      }
    }catch(_){}

    // Se já não existe UNIQUE global em email, só garante o índice correto por empresa.
    if(!hasGlobalUniqueEmail){
      try{ db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_company_unique ON users(email, company_id)`).run(); }catch(_){}
      return;
    }

    console.log('[SAAS] Ajustando users.email: removendo UNIQUE global e criando UNIQUE por empresa...');
    db.pragma('foreign_keys = OFF');
    const oldName = 'users_old_email_global_' + Date.now();
    const colDefs = cols.map(c => {
      const name = qIdent(c.name);
      if(Number(c.pk || 0) === 1 && String(c.name).toLowerCase() === 'id') return `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
      let def = `${name} ${c.type || 'TEXT'}`;
      if(Number(c.notnull || 0) === 1) def += ' NOT NULL';
      def += columnDefaultSql(c.dflt_value);
      return def;
    }).join(', ');
    const colList = cols.map(c => qIdent(c.name)).join(', ');

    db.exec('BEGIN');
    db.exec(`ALTER TABLE users RENAME TO ${qIdent(oldName)}`);
    db.exec(`CREATE TABLE users (${colDefs})`);
    db.exec(`INSERT INTO users (${colList}) SELECT ${colList} FROM ${qIdent(oldName)}`);
    db.exec(`DROP TABLE ${qIdent(oldName)}`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id)`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_company_unique ON users(email, company_id)`);
    db.exec('COMMIT');
    db.pragma('foreign_keys = ON');
    console.log('[SAAS] OK: o mesmo email agora pode existir em empresas diferentes.');
  }catch(err){
    try{ db.exec('ROLLBACK'); }catch(_){}
    try{ db.pragma('foreign_keys = ON'); }catch(_){}
    console.warn('[SAAS] Não foi possível ajustar UNIQUE de users.email:', err.message);
  }
}

function ensureSaasMigrations(){
  try{
    db.prepare(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        logo_url TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        plan_name TEXT DEFAULT 'BASIC',
        plan_status TEXT DEFAULT 'TRIAL',
        monthly_price REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        suspended_at TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    addColumnIfMissing('companies','slug',`ALTER TABLE companies ADD COLUMN slug TEXT`);
    addColumnIfMissing('companies','logo_url',`ALTER TABLE companies ADD COLUMN logo_url TEXT`);
    addColumnIfMissing('companies','contact_name',`ALTER TABLE companies ADD COLUMN contact_name TEXT`);
    addColumnIfMissing('companies','contact_email',`ALTER TABLE companies ADD COLUMN contact_email TEXT`);
    addColumnIfMissing('companies','contact_phone',`ALTER TABLE companies ADD COLUMN contact_phone TEXT`);
    addColumnIfMissing('companies','plan_name',`ALTER TABLE companies ADD COLUMN plan_name TEXT DEFAULT 'BASIC'`);
    addColumnIfMissing('companies','plan_status',`ALTER TABLE companies ADD COLUMN plan_status TEXT DEFAULT 'TRIAL'`);
    addColumnIfMissing('companies','monthly_price',`ALTER TABLE companies ADD COLUMN monthly_price REAL DEFAULT 0`);
    addColumnIfMissing('companies','active',`ALTER TABLE companies ADD COLUMN active INTEGER DEFAULT 1`);
    addColumnIfMissing('companies','suspended_at',`ALTER TABLE companies ADD COLUMN suspended_at TEXT`);
    addColumnIfMissing('companies','notes',`ALTER TABLE companies ADD COLUMN notes TEXT`);
    addColumnIfMissing('companies','updated_at',`ALTER TABLE companies ADD COLUMN updated_at TEXT`);
    addColumnIfMissing('companies','whatsapp_group_name',`ALTER TABLE companies ADD COLUMN whatsapp_group_name TEXT`);
    addColumnIfMissing('companies','whatsapp_group_ti_name',`ALTER TABLE companies ADD COLUMN whatsapp_group_ti_name TEXT`);
    addColumnIfMissing('companies','whatsapp_group_manutencao_name',`ALTER TABLE companies ADD COLUMN whatsapp_group_manutencao_name TEXT`);
    try { db.prepare(`UPDATE companies SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL OR TRIM(updated_at) = ''`).run(); } catch(_){}

    const firstCompany = db.prepare(`SELECT id FROM companies ORDER BY id LIMIT 1`).get();
    let defaultCompanyId = firstCompany?.id;
    if(!defaultCompanyId){
      const info = db.prepare(`INSERT INTO companies (name, slug, plan_name, plan_status, monthly_price, active, notes) VALUES (?, ?, 'PRO', 'ACTIVE', 0, 1, ?)`)
        .run('Guará Acqua Park', 'guara-park', 'Empresa padrão criada automaticamente para preservar os dados antigos.');
      defaultCompanyId = info.lastInsertRowid;
    }
    try { db.prepare(`UPDATE companies SET slug = lower(replace(replace(name,' ','-'),'á','a')) WHERE slug IS NULL OR TRIM(slug)=''`).run(); } catch(_){}

    if(hasTable('users')){
      addColumnIfMissing('users','company_id',`ALTER TABLE users ADD COLUMN company_id INTEGER`);
      addColumnIfMissing('users','is_super_admin',`ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0`);
      addColumnIfMissing('users','display_name',`ALTER TABLE users ADD COLUMN display_name TEXT`);
      addColumnIfMissing('users','theme',`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'`);
      addColumnIfMissing('users','notify_push',`ALTER TABLE users ADD COLUMN notify_push INTEGER DEFAULT 1`);
      addColumnIfMissing('users','notify_sound',`ALTER TABLE users ADD COLUMN notify_sound INTEGER DEFAULT 1`);
      addColumnIfMissing('users','notify_vibration',`ALTER TABLE users ADD COLUMN notify_vibration INTEGER DEFAULT 1`);
      addColumnIfMissing('users','compact_mode',`ALTER TABLE users ADD COLUMN compact_mode INTEGER DEFAULT 0`);
      ensureUsersEmailPerCompany();
      db.prepare(`UPDATE users SET company_id=? WHERE company_id IS NULL AND role <> 'SUPER_ADMIN'`).run(defaultCompanyId);
      const superUser = db.prepare(`SELECT id FROM users WHERE email=?`).get(SUPER_ADMIN_EMAIL);
      if(!superUser){
        db.prepare(`INSERT INTO users (name,email,password_hash,role,active,company_id,is_super_admin) VALUES (?,?,?,?,1,NULL,1)`).run(SUPER_ADMIN_NAME,SUPER_ADMIN_EMAIL,hashPassword(SUPER_ADMIN_PASSWORD),'SUPER_ADMIN');
      } else {
        db.prepare(`UPDATE users SET role='SUPER_ADMIN', active=1, company_id=NULL, is_super_admin=1 WHERE email=?`).run(SUPER_ADMIN_EMAIL);
      }
    }
    if(hasTable('units')){
      addColumnIfMissing('units','company_id',`ALTER TABLE units ADD COLUMN company_id INTEGER`);
      db.prepare(`UPDATE units SET company_id=? WHERE company_id IS NULL`).run(defaultCompanyId);
      const unit = db.prepare(`SELECT id FROM units WHERE company_id=? ORDER BY id LIMIT 1`).get(defaultCompanyId);
      if(!unit){ db.prepare(`INSERT INTO units (company_id,name,city,state) VALUES (?,?,?,?)`).run(defaultCompanyId,'Unidade principal','',''); }
    }
    if(hasTable('sectors')) addColumnIfMissing('sectors','company_id',`ALTER TABLE sectors ADD COLUMN company_id INTEGER`);
    if(hasTable('assets')) addColumnIfMissing('assets','company_id',`ALTER TABLE assets ADD COLUMN company_id INTEGER`);
    if(hasTable('tickets')) {
      addColumnIfMissing('tickets','company_id',`ALTER TABLE tickets ADD COLUMN company_id INTEGER`);
      // V-SERVICE-TICKET-FIX: guarda o serviço real do chamado sem precisar criar patrimônio fake.
      addColumnIfMissing('tickets','service_id',`ALTER TABLE tickets ADD COLUMN service_id INTEGER`);
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_service_company ON tickets(company_id, service_id)`).run(); } catch(_){}
    }
    if(hasTable('issue_types')) {
      addColumnIfMissing('issue_types','company_id',`ALTER TABLE issue_types ADD COLUMN company_id INTEGER`);
      // V-SERVICE-ID - vínculo exato do tipo de problema com serviço/equipamento, sem quebrar asset_name antigo.
      addColumnIfMissing('issue_types','asset_id',`ALTER TABLE issue_types ADD COLUMN asset_id INTEGER`);
      addColumnIfMissing('issue_types','service_id',`ALTER TABLE issue_types ADD COLUMN service_id INTEGER`);
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_service_company ON issue_types(company_id, service_id)`).run(); } catch(_){}
      try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_asset_company ON issue_types(company_id, asset_id)`).run(); } catch(_){}
    }
    if(hasTable('services')) {
      // V-SERVICE-DISPLAY-FIX: garante colunas usadas para exibir serviço no chamado/WhatsApp.
      addColumnIfMissing('services','category',`ALTER TABLE services ADD COLUMN category TEXT`);
      addColumnIfMissing('services','department',`ALTER TABLE services ADD COLUMN department TEXT`);
      addColumnIfMissing('services','legacy_asset_name',`ALTER TABLE services ADD COLUMN legacy_asset_name TEXT`);
      addColumnIfMissing('services','active',`ALTER TABLE services ADD COLUMN active INTEGER DEFAULT 1`);
      addColumnIfMissing('services','updated_at',`ALTER TABLE services ADD COLUMN updated_at TEXT`);
    }
    try { db.prepare(`UPDATE sectors SET company_id=(SELECT company_id FROM units WHERE units.id=sectors.unit_id) WHERE company_id IS NULL`).run(); } catch(_){}
    try { db.prepare(`UPDATE assets SET company_id=(SELECT company_id FROM sectors WHERE sectors.id=assets.sector_id) WHERE company_id IS NULL`).run(); } catch(_){}
    try { db.prepare(`UPDATE tickets SET company_id=(SELECT company_id FROM sectors WHERE sectors.id=tickets.sector_id) WHERE company_id IS NULL`).run(); } catch(_){}
    try { db.prepare(`UPDATE issue_types SET company_id=? WHERE company_id IS NULL`).run(defaultCompanyId); } catch(_){}
    try {
      if (tableCols('tickets').includes('service_id') && tableCols('issue_types').includes('service_id')) {
        db.prepare(`
          UPDATE tickets
          SET service_id = (SELECT service_id FROM issue_types WHERE issue_types.id = tickets.issue_type_id)
          WHERE service_id IS NULL
            AND asset_id IS NULL
            AND issue_type_id IS NOT NULL
            AND (SELECT service_id FROM issue_types WHERE issue_types.id = tickets.issue_type_id) IS NOT NULL
        `).run();
      }
    } catch(_){}

    // V149 - saneamento real dos serviços no banco.
    // Corrige issue_types sem service_id e tickets cujo service_id recebeu id de asset legado.
    try {
      if (hasTable('services') && hasTable('issue_types') && tableCols('issue_types').includes('service_id')) {
        db.prepare(`
          UPDATE issue_types
          SET service_id = (
            SELECT sv.id
            FROM services sv
            WHERE COALESCE(sv.company_id,0)=COALESCE(issue_types.company_id,0)
              AND COALESCE(sv.active,1)=1
              AND (
                UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(issue_types.asset_name,'')))
                OR UPPER(TRIM(COALESCE(sv.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(issue_types.asset_name,'')))
              )
            ORDER BY sv.id
            LIMIT 1
          )
          WHERE (service_id IS NULL OR service_id NOT IN (SELECT id FROM services))
            AND EXISTS (
              SELECT 1 FROM services sv
              WHERE COALESCE(sv.company_id,0)=COALESCE(issue_types.company_id,0)
                AND COALESCE(sv.active,1)=1
                AND (
                  UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(issue_types.asset_name,'')))
                  OR UPPER(TRIM(COALESCE(sv.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(issue_types.asset_name,'')))
                )
            )
        `).run();
      }
    } catch(err) { console.warn('Aviso V149 issue_types service_id:', err.message); }

    try {
      if (hasTable('services') && hasTable('tickets') && tableCols('tickets').includes('service_id')) {
        db.prepare(`
          UPDATE tickets
          SET service_id = (
            SELECT COALESCE(
              (SELECT ii.service_id FROM issue_types ii WHERE ii.id=tickets.issue_type_id AND ii.service_id IN (SELECT id FROM services) LIMIT 1),
              (SELECT sv.id
               FROM services sv
               JOIN assets aa ON aa.id=COALESCE(tickets.asset_id, tickets.service_id)
               WHERE COALESCE(sv.company_id,0)=COALESCE(tickets.company_id, aa.company_id,0)
                 AND UPPER(TRIM(COALESCE(aa.asset_kind,'')))='SERVICE'
                 AND (
                   UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(aa.name,'')))
                   OR UPPER(TRIM(COALESCE(sv.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(aa.name,'')))
                   OR UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(aa.patrimonio,'')))
                 )
               ORDER BY sv.id LIMIT 1)
            )
          )
          WHERE (service_id IS NULL OR service_id NOT IN (SELECT id FROM services))
            AND (
              issue_type_id IS NOT NULL
              OR asset_id IS NOT NULL
              OR service_id IS NOT NULL
            )
        `).run();
      }
    } catch(err) { console.warn('Aviso V149 tickets service_id:', err.message); }


    db.prepare(`
      CREATE TABLE IF NOT EXISTS saas_finance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        description TEXT,
        reference_date TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id)
      )
    `).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_saas_finance_company ON saas_finance(company_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_saas_finance_type ON saas_finance(type)`).run();

    // V92 - índices e colunas auxiliares para blindagem multiempresa.
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_sector ON tickets(company_id, sector_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_assets_company ON assets(company_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_assets_company_sector ON assets(company_id, sector_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_sectors_company_slug ON sectors(company_id, slug)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company ON issue_types(company_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_audit_company ON admin_audit_log(company_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_ticket_logs_company ON ticket_logs(company_id)`).run(); } catch(_){}

    // GF-PERF V1 - índices usados pelas telas mais pesadas: operação, dashboard e últimos eventos.
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_status_updated ON tickets(company_id, status, updated_at)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_updated ON tickets(company_id, updated_at)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_asset_updated ON tickets(company_id, asset_id, updated_at)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_action_created ON ticket_logs(ticket_id, action, created_at)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_assets_company_status_sector ON assets(company_id, status, sector_id)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_created ON tickets(company_id, created_at)`).run(); } catch(_){}
    try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_company_resolved ON tickets(company_id, resolved_at)`).run(); } catch(_){}

    console.log('[SAAS] Multiempresa/Super Admin pronto. Login:', SUPER_ADMIN_EMAIL, '/ senha:', SUPER_ADMIN_PASSWORD);
  }catch(err){ console.warn('[SAAS] Migração falhou:', err.message); }
}
function isSuperAdminUser(user){
  return Number(user?.is_super_admin || 0) === 1 || String(user?.role||'').toUpperCase()==='SUPER_ADMIN';
}

function requireSuperAdmin(req,res,next){
  try{
    const freshUser = db.prepare(`
      SELECT id, email, COALESCE(is_super_admin,0) AS is_super_admin, role
      FROM users
      WHERE id = ? AND active = 1
    `).get(req.user.id);

    if(!freshUser || !isSuperAdminUser(freshUser)){
      return res.status(403).json({ok:false,error:'Apenas Super Admin pode acessar'});
    }

    req.user.is_super_admin = freshUser.is_super_admin;
    req.user.role = freshUser.role;
    next();
  }catch(err){
    console.error('Erro requireSuperAdmin:', err);
    return res.status(500).json({ok:false,error:'Erro interno Super Admin'});
  }
}
function currentCompanyId(req){
  // SAAS: Super Admin pode atuar dentro de uma empresa quando entrou por /c/:slug.
  // Isso faz o painel normal filtrar setores/equipamentos/chamados pelo company_id correto.
  if (isSuperAdminUser(req.user)) {
    if (req.query.company_id) return Number(req.query.company_id);
    if (req.user?.session_company_id) return Number(req.user.session_company_id);
    return null;
  }
  return Number(req.user?.company_id || 0);
}
function companyWhere(req, alias=''){
  const cid = currentCompanyId(req);
  if(!cid) return {sql:'', params:[]};
  const p = alias ? `${alias}.company_id` : 'company_id';
  return {sql:`${p} = ?`, params:[cid]};
}
function requireCompanyScope(req, res) {
  const cid = currentCompanyId(req);
  if (!cid && !isSuperAdminUser(req.user)) {
    res.status(403).json({ ok:false, error:'Empresa não identificada na sessão' });
    return null;
  }
  return cid || null;
}
function addCompanyFilter(where, params, expr, cid) {
  if (cid) { where.push(expr); params.push(cid); }
}

// SAAS: setores podem ter o mesmo slug em empresas diferentes.
// Se o banco antigo tiver UNIQUE em sectors.slug, salvamos internamente com prefixo da empresa,
// mas o link público continua limpo: /c/empresa/s/pista.
function companyScopedSectorSlug(req, desiredSlug) {
  let base = slugify(desiredSlug);
  const cid = currentCompanyId(req);
  if (!cid) return base;
  const company = db.prepare(`SELECT slug FROM companies WHERE id=?`).get(cid);
  const companySlug = slugify(company?.slug || `empresa-${cid}`);

  const same = db.prepare(`SELECT id FROM sectors WHERE slug=? AND company_id=? LIMIT 1`).get(base, cid);
  if (same) return base;

  const other = db.prepare(`SELECT id FROM sectors WHERE slug=? AND COALESCE(company_id,0)<>? LIMIT 1`).get(base, cid);
  if (!other) return base;

  let scoped = `${companySlug}-${base}`;
  let n = 2;
  while (db.prepare(`SELECT id FROM sectors WHERE slug=? LIMIT 1`).get(scoped)) {
    scoped = `${companySlug}-${base}-${n++}`;
  }
  return scoped;
}

function publicSectorSlug(companySlug, sectorSlug) {
  const cs = slugify(companySlug || '');
  const ss = String(sectorSlug || '');
  if (cs && ss.startsWith(cs + '-')) {
    return ss.slice(cs.length + 1).replace(/-\d+$/, '');
  }
  return ss;
}

function sectorSlugCandidates(companySlug, rawSlug) {
  const base = slugify(rawSlug);
  const cs = slugify(companySlug || '');
  const out = [];
  const add = (v) => { v = slugify(v); if (v && !out.includes(v)) out.push(v); };
  add(base);
  if (cs) {
    // Aceita tanto /c/empresa/s/pista quanto /s/empresa-pista sem duplicar prefixo.
    const stripped = base.startsWith(cs + '-') ? base.slice(cs.length + 1) : base;
    add(stripped);
    add(`${cs}-${stripped}`);
    add(`${cs}-${base}`);
  }
  return out;
}


// SAAS FINAL: resolve setor público sem misturar empresas.
// Aceita:
//   /c/frango-americano/s/pista
//   /c/frango-americano/s/frango-americano-pista
//   /s/frango-americano-pista
// Mesmo se o setor foi salvo internamente como "pista" ou "frango-americano-pista".
function inferCompanyFromPublicSectorSlug(rawSlug) {
  const base = slugify(rawSlug || '');
  try {
    const companies = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE active=1 ORDER BY LENGTH(slug) DESC`).all();
    for (const c of companies) {
      const cs = slugify(c.slug || '');
      if (cs && (base === cs || base.startsWith(cs + '-'))) return c;
    }
  } catch(_){}
  return null;
}

function resolvePublicSector(companySlug, rawSlug) {
  const base = slugify(rawSlug || '');
  let company = null;
  let cs = slugify(companySlug || '');

  try {
    if (cs) company = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE slug=? AND active=1 LIMIT 1`).get(cs);
    if (!company) company = inferCompanyFromPublicSectorSlug(base);
    if (company) cs = slugify(company.slug || cs);

    const stripped = (cs && base.startsWith(cs + '-')) ? base.slice(cs.length + 1) : base;
    const candidates = [];
    const add = (v) => { v = slugify(v); if (v && !candidates.includes(v)) candidates.push(v); };
    add(base);
    add(stripped);
    if (cs) add(`${cs}-${stripped}`);

    const placeholders = candidates.map(() => '?').join(',');
    const sql = `
      SELECT s.id, s.name, s.slug, s.qr_token, s.active,
        u.id AS unit_id, u.name AS unit_name, u.city, u.state,
        c.id AS company_id, c.name AS company_name, c.slug AS company_slug, c.logo_url, c.plan_name, c.plan_status, c.active AS company_active
      FROM sectors s
      LEFT JOIN units u ON u.id = s.unit_id
      JOIN companies c ON c.id = COALESCE(s.company_id, u.company_id)
      WHERE s.slug IN (${placeholders})
        AND s.active = 1
        AND c.active = 1
        AND UPPER(COALESCE(c.plan_status,'')) <> 'SUSPENDED'
        ${company ? 'AND c.id = ?' : ''}
      ORDER BY CASE WHEN s.slug = ? THEN 0 ELSE 1 END, s.id ASC
      LIMIT 1
    `;
    const params = [...candidates];
    if (company) params.push(company.id);
    params.push(stripped);
    return db.prepare(sql).get(...params) || null;
  } catch (err) {
    console.warn('[SAAS] resolvePublicSector falhou:', err.message);
    return null;
  }
}

// V92 - BLINDAGEM 100% MULTIEMPRESA NAS ROTAS PÚBLICAS
// Rotas públicas antigas só podem resolver dados quando há contexto claro da empresa
// via /c/:slug, ?company=slug, cookie gf_company_slug ou Referer. Sem empresa, retorna 404
// para evitar enumeração por ID/slug usando o mesmo banco de dados.
function getPublicCompanyFromRequest(req) {
  try {
    const slug = getRequestedCompanySlug(req);
    if (!slug) return null;
    return db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, plan_status, active
      FROM companies
      WHERE slug = ? AND active = 1 AND UPPER(COALESCE(plan_status,'')) <> 'SUSPENDED'
      LIMIT 1
    `).get(slug) || null;
  } catch (_) {
    return null;
  }
}

function resolvePublicSectorForRequest(req, rawSlug) {
  const company = getPublicCompanyFromRequest(req);
  if (!company) return null;
  return resolvePublicSector(company.slug, rawSlug);
}

function publicNotFound(res, label) {
  return res.status(404).json({ ok:false, error: label || 'Não encontrado' });
}


// V-SERVICE-ACTIVE-SYNC - serviço inativo some também do QR antigo baseado em assets.
// Mantém compatibilidade: quando services.active=0, todos os assets SERVICE com o mesmo nome ficam INACTIVE.
function syncInactiveServicesToLegacyAssets(){
  try {
    if (!hasTable('services') || !hasTable('assets')) return;
    db.prepare(`
      UPDATE assets
      SET status='INACTIVE'
      WHERE COALESCE(NULLIF(TRIM(asset_kind),''),'EQUIPMENT')='SERVICE'
        AND EXISTS (
          SELECT 1
          FROM services sv
          WHERE COALESCE(sv.company_id, assets.company_id) = COALESCE(assets.company_id, sv.company_id)
            AND COALESCE(sv.active,1)=0
            AND (
              UPPER(TRIM(sv.name)) = UPPER(TRIM(assets.name))
              OR (sv.legacy_asset_name IS NOT NULL AND UPPER(TRIM(sv.legacy_asset_name)) = UPPER(TRIM(assets.name)))
            )
        )
    `).run();
  } catch (err) {
    console.warn('[SERVICES] Falha ao sincronizar serviços inativos com assets antigos:', err.message);
  }
}

ensureSaasMigrations();
fixBadServiceFinalOutcomeRows();
syncInactiveServicesToLegacyAssets();
repairAdminAuditLogFK();



// V17.2 - MIGRAÇÃO GARANTIDA DO TIPO DO EQUIPAMENTO
// Cria a coluna asset_department e coloca todos os equipamentos antigos como TI por padrão.
// Assim nada antigo some no QR. Só aparecerá em Manutenção quando você editar e marcar Manutenção.
function ensureAssetDepartmentMigration() {
  try {
    const cols = db.prepare(`PRAGMA table_info(assets)`).all().map(c => c.name);
    if (!cols.includes('asset_department')) {
      db.prepare(`ALTER TABLE assets ADD COLUMN asset_department TEXT`).run();
    }
    if (!cols.includes('asset_kind')) {
      db.prepare(`ALTER TABLE assets ADD COLUMN asset_kind TEXT`).run();
    }
    const updated = db.prepare(`
      UPDATE assets
      SET asset_department = 'TI'
      WHERE asset_department IS NULL OR TRIM(asset_department) = ''
    `).run().changes;
    db.prepare(`
      UPDATE assets
      SET asset_kind = CASE
        WHEN UPPER(TRIM(name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
        ELSE COALESCE(NULLIF(TRIM(asset_kind),''),'EQUIPMENT')
      END
      WHERE asset_kind IS NULL OR TRIM(asset_kind) = ''
    `).run();
    return { ok: true, updated };
  } catch (err) {
    console.warn('Aviso: falha na migração asset_department:', err.message);
    return { ok: false, error: err.message };
  }
}
ensureAssetDepartmentMigration();



// SAAS FINAL - remove UNIQUE global antigo de tickets.ticket_number.
// Motivo: em multiempresa, empresas diferentes podem ter o mesmo número público (#1, #2...).
// O único válido é por empresa: UNIQUE(company_id, ticket_number).
function ensureTicketNumberIsUniquePerCompanyOnly(){
  try {
    if (!hasTable('tickets')) return;
    const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='tickets'`).get();
    const createSql = String(row?.sql || '');
    if (!/ticket_number\s+INTEGER\s+UNIQUE/i.test(createSql)) return;

    console.warn('[SAAS] Corrigindo UNIQUE global antigo de tickets.ticket_number...');

    const colsInfo = db.prepare(`PRAGMA table_info(tickets)`).all();
    const colNames = colsInfo.map(c => c.name);
    const indexes = db.prepare(`
      SELECT name, sql
      FROM sqlite_master
      WHERE type='index'
        AND tbl_name='tickets'
        AND sql IS NOT NULL
    `).all();

    const q = (name) => '"' + String(name).replace(/"/g, '""') + '"';
    const colDefs = colsInfo.map(c => {
      if (c.pk && c.name === 'id') return `${q(c.name)} INTEGER PRIMARY KEY AUTOINCREMENT`;
      let def = `${q(c.name)} ${c.type || 'TEXT'}`;
      if (c.notnull) def += ' NOT NULL';
      if (c.dflt_value !== null && c.dflt_value !== undefined) def += ` DEFAULT ${c.dflt_value}`;
      return def;
    }).join(',\n          ');

    const backupName = `tickets_old_unique_${Date.now()}`;
    const colList = colNames.map(q).join(', ');

    db.pragma('foreign_keys = OFF');
    const migrate = db.transaction(() => {
      db.prepare(`ALTER TABLE tickets RENAME TO ${q(backupName)}`).run();
      db.prepare(`CREATE TABLE tickets (\n          ${colDefs}\n        )`).run();
      db.prepare(`INSERT INTO tickets (${colList}) SELECT ${colList} FROM ${q(backupName)}`).run();
      db.prepare(`DROP TABLE ${q(backupName)}`).run();
    });
    migrate();
    db.pragma('foreign_keys = ON');

    for (const idx of indexes) {
      const sql = String(idx.sql || '');
      if (/sqlite_autoindex/i.test(idx.name)) continue;
      if (/CREATE\s+UNIQUE\s+INDEX/i.test(sql) && /\(\s*ticket_number\s*\)/i.test(sql)) continue;
      try {
        db.prepare(sql).run();
      } catch (err) {
        console.warn(`[SAAS] Índice de tickets não recriado (${idx.name}):`, err.message);
      }
    }

    db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_company_ticket_number_unique
      ON tickets(company_id, ticket_number)
      WHERE ticket_number IS NOT NULL AND company_id IS NOT NULL
    `).run();

    console.warn('[SAAS] OK: tickets.ticket_number agora é único por empresa, não global.');
  } catch (err) {
    try { db.pragma('foreign_keys = ON'); } catch(_){}
    console.warn('[SAAS] Falha ao remover UNIQUE global de tickets.ticket_number:', err.message);
  }
}
ensureTicketNumberIsUniquePerCompanyOnly();

// V14.0 - garante número visível do chamado para bancos antigos.
function ensureTicketNumbers() {
  try {
    const cols = db.prepare(`PRAGMA table_info(tickets)`).all().map(c => c.name);
    if (!cols.includes('ticket_number')) {
      db.prepare(`ALTER TABLE tickets ADD COLUMN ticket_number INTEGER`).run();
    }

    // SAAS: bancos antigos podem ter chamado sem company_id. Primeiro herda do setor.
    try {
      db.prepare(`
        UPDATE tickets
        SET company_id = (SELECT company_id FROM sectors WHERE sectors.id = tickets.sector_id)
        WHERE company_id IS NULL
      `).run();
    } catch(_){}

    // SAAS: preenche apenas números vazios com contador separado por empresa.
    const missing = db.prepare(`
      SELECT id, company_id
      FROM tickets
      WHERE ticket_number IS NULL OR ticket_number = '' OR ticket_number <= 0
      ORDER BY COALESCE(company_id,0), datetime(COALESCE(created_at, '1970-01-01')), id
    `).all();
    const updateNumber = db.prepare(`UPDATE tickets SET ticket_number = ? WHERE id = ?`);
    for (const row of missing) {
      const next = nextTicketNumberForCompany(row.company_id);
      updateNumber.run(next, row.id);
    }

    // SAAS: evita repetir número dentro da mesma empresa, mas permite #1 em empresas diferentes.
    try {
      db.prepare(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_company_ticket_number_unique
        ON tickets(company_id, ticket_number)
        WHERE ticket_number IS NOT NULL AND company_id IS NOT NULL
      `).run();
    } catch (idxErr) {
      console.warn('[SAAS] Aviso: índice único de chamados por empresa não criado:', idxErr.message);
    }

    // Mantém histórico estável: não renumera chamados já criados ao iniciar o servidor.
    // Daqui pra frente, cada chamado novo recebe ticket_number = id logo após o INSERT.
    // repairTicketNumbersWhenCompanyStartedWithGlobalCounter();
  } catch (err) {
    console.warn("Aviso: não foi possível garantir ticket_number:", err.message);
  }
}

function nextTicketNumberForCompany(companyId) {
  const cid = Number(companyId || 0);
  const row = db.prepare(`
    SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_number
    FROM tickets
    WHERE (? = 0 AND company_id IS NULL) OR company_id = ?
  `).get(cid, cid);
  return Number(row?.next_number || 1);
}

function repairTicketNumbersWhenCompanyStartedWithGlobalCounter() {
  try {
    if (!hasTable('tickets')) return;
    const companies = db.prepare(`
      SELECT company_id, COUNT(*) AS total, MIN(ticket_number) AS min_number
      FROM tickets
      WHERE company_id IS NOT NULL AND ticket_number IS NOT NULL
      GROUP BY company_id
      HAVING total > 0 AND min_number > 1
    `).all();

    if (!companies.length) return;

    console.log('[SAAS] Ajustando contador de chamados por empresa isolada...');
    const update = db.prepare(`UPDATE tickets SET ticket_number = ? WHERE id = ?`);

    db.exec('BEGIN');
    for (const c of companies) {
      const rows = db.prepare(`
        SELECT id
        FROM tickets
        WHERE company_id = ?
        ORDER BY datetime(COALESCE(created_at, '1970-01-01')), id
      `).all(c.company_id);
      rows.forEach((r, idx) => update.run(idx + 1, r.id));
    }
    db.exec('COMMIT');
    console.log('[SAAS] Contador de chamados por empresa corrigido.');
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch(_){}
    console.warn('[SAAS] Aviso: não foi possível ajustar contador por empresa:', err.message);
  }
}
ensureTicketNumbers();

// =========================
// V80 - PUSH NOTIFICATIONS PWA POR EMPRESA
// Notificação bonita quando chega chamado novo.
// Segurança: cada subscription fica presa ao user_id + company_id.
// Não mistura empresas e funciona automaticamente para empresa nova.
// =========================
const PUSH_VAPID_FILE = path.join(__dirname, "push-vapid.json");

function pushBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateVapidKeysNative() {
  // Fallback nativo: permite entregar a chave pública mesmo quando o pacote web-push
  // ainda não foi instalado. Para enviar as notificações reais, instale web-push.
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    publicKey: pushBase64Url(ecdh.getPublicKey()),
    privateKey: pushBase64Url(ecdh.getPrivateKey())
  };
}

function ensurePushMigrations() {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(company_id) REFERENCES companies(id)
      )
    `).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_company ON push_subscriptions(company_id, active)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, company_id, active)`).run();

    // GF PUSH DEDUP: remove duplicados por endpoint e impede acumular inscrição antiga.
    try {
      db.prepare(`
        DELETE FROM push_subscriptions
        WHERE id NOT IN (
          SELECT MAX(id)
          FROM push_subscriptions
          GROUP BY endpoint
        )
      `).run();
    } catch(_){}

    try {
      db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_push_unique_endpoint ON push_subscriptions(endpoint)`).run();
    } catch(_){}

    try {
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_push_user_company_latest ON push_subscriptions(user_id, company_id, active, updated_at)`).run();
    } catch(_){}

    // GF PUSH STALE CLEANUP: remove inscrições inativas antigas para o banco não crescer sem limite.
    try {
      db.prepare(`
        DELETE FROM push_subscriptions
        WHERE active = 0
          AND datetime(COALESCE(updated_at, created_at)) < datetime('now','-30 days')
      `).run();
    } catch(_){}
  } catch (err) {
    console.warn("[PUSH] Falha ao criar tabela push_subscriptions:", err.message);
  }
}
ensurePushMigrations();

function getPushKeys() {
  try {
    let publicKey = String(process.env.VAPID_PUBLIC_KEY || "").trim();
    let privateKey = String(process.env.VAPID_PRIVATE_KEY || "").trim();

    if (publicKey && privateKey) return { publicKey, privateKey };

    if (fs.existsSync(PUSH_VAPID_FILE)) {
      const saved = JSON.parse(fs.readFileSync(PUSH_VAPID_FILE, "utf8"));
      if (saved.publicKey && saved.privateKey) return saved;
    }

    const keys = (webpush && typeof webpush.generateVAPIDKeys === "function")
      ? webpush.generateVAPIDKeys()
      : generateVapidKeysNative();
    fs.writeFileSync(PUSH_VAPID_FILE, JSON.stringify(keys, null, 2));
    return keys;
  } catch (err) {
    console.warn("[PUSH] Falha VAPID:", err.message);
    return null;
  }
}

function configureWebPush() {
  try {
    const keys = getPushKeys();
    if (!keys) return null;
    if (!webpush) {
      console.warn("[PUSH] web-push não instalado. A chave pública foi gerada, mas o envio real exige: npm install web-push");
      return keys;
    }
    const mail = String(process.env.VAPID_SUBJECT || process.env.SMTP_FROM || "mailto:admin@guarafacilities.local");
    const subject = mail.startsWith("mailto:") ? mail : `mailto:${mail.replace(/.*<|>.*/g, "").trim() || "admin@guarafacilities.local"}`;
    webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
    return keys;
  } catch (err) {
    console.warn("[PUSH] Falha ao configurar web-push:", err.message);
    return null;
  }
}

function pushIconUrl(companySlug) {
  const base = String(PUBLIC_QR_BASE || "").replace(/\/$/, "");
  return `${base}/c/${encodeURIComponent(companySlug || "app")}/icon-512.png`;
}

function pushTicketUrl(ticket) {
  const slug = String(ticket?.company_slug || "").trim().toLowerCase();
  const dbId = encodeURIComponent(ticket?.id || "");
  const number = encodeURIComponent(ticket?.ticket_number || ticket?.id || "");
  const base = String(PUBLIC_QR_BASE || "").replace(/\/$/, "");
  const query = dbId
    ? `ticket_id=${dbId}&ticket=${dbId}&ticket_number=${number}`
    : `ticket=${number}`;
  if (slug) return `${base}/c/${encodeURIComponent(slug)}/admin?${query}`;
  const fallback = adminTicketLink(ticket);
  return fallback;
}

function buildTicketPushPayload(ticket) {
  const _deptRaw = String(ticket.asset_department || "TI").toUpperCase();
  const dept = _deptRaw.includes("APOIO") ? "APOIO" : (_deptRaw.includes("MAN") ? "MANUTENÇÃO" : "TI");
  const setor = String(ticket.sector_name || "Setor não informado").trim();
  const equip = [ticket.asset_name, ticket.asset_brand, ticket.asset_model].filter(Boolean).join(" ").trim() || "Equipamento não informado";
  const problema = String(ticket.issue_name || ticket.description || "Chamado aberto").trim();
  const ticketNo = ticket.ticket_number || ticket.id || "";
  const title = `🔔 Chamado #${ticketNo} — ${dept}`;
  const body = `📍 ${setor}\n🧰 ${equip}\n⚠️ ${problema}`.slice(0, 230);
  const url = pushTicketUrl(ticket);
  const icon = pushIconUrl(ticket.company_slug);
  return {
    title,
    body,
    icon,
    badge: icon,
    // Não usar "image": no Android ela vira foto grande e corta a prévia do chamado.
    tag: `ticket-${ticket.company_id}-${ticket.ticket_number || ticket.id}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [160, 80, 160],
    data: {
      url,
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number || ticket.id,
      company_id: ticket.company_id,
      company_slug: ticket.company_slug || "",
      department: dept,
      sector: setor,
      equipment: equip,
      problem: problema
    },
    actions: [
      { action: "open", title: "Abrir chamado" }
    ]
  };
}

async function notifyPushTicketCreated(ticketId) {
  try {
    configureWebPush();
    if (!webpush) {
      console.warn("[PUSH] web-push não instalado; aparelho pode ativar, mas o envio real não acontece até instalar: npm install web-push");
      return;
    }

    const ticket = getTicketNotificationPayload(ticketId);
    if (!ticket || !ticket.company_id) return;

    const payload = buildTicketPushPayload(ticket);
    const rows = db.prepare(`
      SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.active = 1
        AND ps.company_id = ?
        AND u.active = 1
        AND (
          u.company_id = ?
          OR COALESCE(u.is_super_admin,0) = 1
          OR UPPER(COALESCE(u.role,'')) = 'SUPER_ADMIN'
        )
        AND UPPER(COALESCE(u.role,'')) IN ('ADMIN','TECH','SUPER_ADMIN')
    `).all(ticket.company_id, ticket.company_id);

    if (!rows.length) {
      console.warn("[PUSH] Nenhum aparelho ativo para empresa", ticket.company_id, ticket.company_slug || "");
      return;
    }

    console.log("[PUSH] Enviando notificação para", rows.length, "aparelho(s) da empresa", ticket.company_id, ticket.company_slug || "");
    console.log("[PUSH] Aparelhos ativos:", rows.map(r => r.id).join(", "));

    const body = JSON.stringify(payload);
    for (const row of rows) {
      try {
        await webpush.sendNotification({
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        }, body);
        console.log("[PUSH] Notificação enviada:", row.id);
      } catch (err) {
        const status = Number(err?.statusCode || err?.status || 0);
        if (status === 404 || status === 410) {
          db.prepare(`UPDATE push_subscriptions SET active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(row.id);
        } else {
          console.warn("[PUSH] Falha ao enviar push:", err.message || err);
        }
      }
    }
  } catch (err) {
    console.warn("[PUSH] Aviso: push não enviado:", err.message);
  }
}

async function notifyPushTicketRated(ticketId, rating) {
  try {
    configureWebPush();
    if (!webpush) {
      console.warn("[PUSH-RATING] web-push não instalado; não foi possível enviar push de avaliação");
      return;
    }

    const ticket = db.prepare(`
      SELECT
        t.id,
        COALESCE(t.ticket_number, t.id) AS ticket_number,
        t.company_id,
        t.assigned_to_user_id,
        c.slug AS company_slug,
        c.name AS company_name,
        s.name AS sector_name,
        ${ticketServiceSelectFields()}
        i.name AS issue_name,
        COALESCE((
          SELECT tl.user_id
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.user_id IS NOT NULL
            AND (
              tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
              OR UPPER(COALESCE(tl.action,'')) LIKE '%FINAL%'
              OR UPPER(COALESCE(tl.action,'')) LIKE '%RESOL%'
            )
          ORDER BY
            CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END,
            datetime(COALESCE(tl.created_at,t.updated_at,t.resolved_at,t.created_at)) DESC,
            tl.id DESC
          LIMIT 1
        ), t.assigned_to_user_id) AS responsible_user_id,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      LEFT JOIN companies c ON c.id=t.company_id
      LEFT JOIN sectors s ON s.id=t.sector_id
      LEFT JOIN assets a ON a.id=t.asset_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      LEFT JOIN users u ON u.id=t.assigned_to_user_id
      WHERE t.id=?
      LIMIT 1
    `).get(ticketId);

    if (!ticket || !ticket.company_id) return;

    const responsibleUserId = Number(ticket.responsible_user_id || ticket.assigned_to_user_id || 0);
    if (!responsibleUserId) {
      console.warn("[PUSH-RATING] Chamado avaliado sem usuário responsável por ID:", ticketId);
      return;
    }

    const stars = Number(rating && rating.stars || 0);
    const comment = String(rating && rating.comment || "").trim();
    const setor = String(ticket.sector_name || "Setor não informado").trim();
    const equip = [ticket.asset_name, ticket.asset_brand, ticket.asset_model].filter(Boolean).join(" ").trim() || "Chamado avaliado";
    const problema = String(ticket.issue_name || "").trim();
    const url = pushTicketUrl(ticket);
    const icon = pushIconUrl(ticket.company_slug);

    const payload = {
      title: `⭐ Chamado #${ticket.ticket_number || ticket.id} avaliado`,
      body: `${stars || "-"} estrela${stars === 1 ? "" : "s"} recebida${stars === 1 ? "" : "s"}\n📍 ${setor}${problema ? `\n⚠️ ${problema}` : ""}${comment ? `\n💬 ${comment}` : ""}`.slice(0, 240),
      icon,
      badge: icon,
      tag: `ticket-rating-${ticket.company_id}-${ticket.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [120, 60, 120],
      data: {
        url,
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number || ticket.id,
        company_id: ticket.company_id,
        company_slug: ticket.company_slug || "",
        rating_stars: stars,
        rating_comment: comment,
        responsible_user_id: responsibleUserId,
        sector: setor,
        equipment: equip,
        problem: problema
      },
      actions: [
        { action: "open", title: "Abrir chamado" }
      ]
    };

    const rows = db.prepare(`
      SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.active = 1
        AND ps.company_id = ?
        AND ps.user_id = ?
        AND u.active = 1
        AND COALESCE(u.company_id, ?) = ?
    `).all(ticket.company_id, responsibleUserId, ticket.company_id, ticket.company_id);

    if (!rows.length) {
      console.warn("[PUSH-RATING] Responsável sem aparelho ativo para avaliação:", responsibleUserId);
      return;
    }

    const body = JSON.stringify(payload);
    for (const row of rows) {
      try {
        await webpush.sendNotification({
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        }, body);
        console.log("[PUSH-RATING] Notificação de avaliação enviada:", row.id, "user:", responsibleUserId, "ticket:", ticket.id);
      } catch (err) {
        const status = Number(err?.statusCode || err?.status || 0);
        if (status === 404 || status === 410) {
          db.prepare(`UPDATE push_subscriptions SET active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(row.id);
        } else {
          console.warn("[PUSH-RATING] Falha ao enviar push:", err.message || err);
        }
      }
    }
  } catch (err) {
    console.warn("[PUSH-RATING] Aviso: push de avaliação não enviado:", err.message || err);
  }
}


function notifyRealtimeTicketRated(ticketId, rating) {
  try {
    const ticket = getTicketNotificationPayload(ticketId);
    if (!ticket || !ticket.company_id) return;

    const resp = db.prepare(`
      SELECT COALESCE((
        SELECT tl.user_id
        FROM ticket_logs tl
        WHERE tl.ticket_id=?
          AND tl.user_id IS NOT NULL
          AND (
            tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
            OR UPPER(COALESCE(tl.action,'')) LIKE '%FINAL%'
            OR UPPER(COALESCE(tl.action,'')) LIKE '%RESOL%'
          )
        ORDER BY
          CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END,
          datetime(COALESCE(tl.created_at, CURRENT_TIMESTAMP)) DESC,
          tl.id DESC
        LIMIT 1
      ), (
        SELECT assigned_to_user_id FROM tickets WHERE id=? LIMIT 1
      )) AS user_id
    `).get(ticket.id, ticket.id);

    const responsibleUserId = Number(resp && resp.user_id || 0);

    const payload = Object.assign({}, ticket, {
      event: 'ticket_rated',
      ticket_id: ticket.id,
      id: ticket.id,
      responsible_user_id: responsibleUserId,
      rating: rating || {},
      title: `⭐ Chamado #${ticket.ticket_number || ticket.id} avaliado`,
      message: `Chamado #${ticket.ticket_number || ticket.id} recebeu avaliação.`,
      at: Date.now()
    });

    for (const client of Array.from(gfRealtimeClients || [])) {
      if (
        Number(client.company_id) === Number(ticket.company_id)
        && (!responsibleUserId || Number(client.user_id) === Number(responsibleUserId))
      ) {
        gfRealtimeSend(client, 'ticket_rated', payload);
      }
    }
  } catch (err) {
    console.warn('[REALTIME] Falha ao enviar ticket_rated:', err.message || err);
  }
}


// =========================
// V30 - REALTIME ADMIN (SSE) PARA NOTIFICAÇÃO INSTANTÂNEA
// Causa raiz: depois das otimizações, o aviso visual dependia do próximo loadTickets/polling.
// Agora o servidor avisa os navegadores logados da mesma empresa no ato da criação do chamado.
// Não substitui o Push em segundo plano; apenas garante atualização imediata com a tela aberta.
// =========================
const gfRealtimeClients = new Set();

function gfUserCompanyId(user) {
  const cid = Number(user && (user.session_company_id || user.company_id || 0));
  return Number.isFinite(cid) && cid > 0 ? cid : null;
}

function gfRealtimeSend(client, event, payload) {
  try {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(payload || {})}\n\n`);
    return true;
  } catch (_) {
    try { gfRealtimeClients.delete(client); } catch(_){}
    return false;
  }
}

function notifyRealtimeTicketCreated(ticketId) {
  try {
    const ticket = getTicketNotificationPayload(ticketId);
    if (!ticket || !ticket.company_id) return;
    const payload = Object.assign({}, ticket, {
      event: 'ticket_created',
      ticket_id: ticket.id,
      id: ticket.id,
      at: Date.now()
    });
    for (const client of Array.from(gfRealtimeClients)) {
      if (Number(client.company_id) === Number(ticket.company_id)) {
        gfRealtimeSend(client, 'ticket_created', payload);
      }
    }
  } catch (err) {
    console.warn('[REALTIME] Falha ao enviar ticket_created:', err.message || err);
  }
}

app.get('/api/admin/realtime', requireAuth, (req, res) => {
  const companyId = gfUserCompanyId(req.user);
  if (!companyId && !isSuperAdminUser(req.user)) {
    return res.status(403).json({ ok:false, error:'Empresa não identificada para realtime' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const client = { res, company_id: companyId, user_id: req.user.id, created_at: Date.now() };
  gfRealtimeClients.add(client);
  gfRealtimeSend(client, 'ready', { ok:true, company_id: companyId, at: Date.now() });

  req.on('close', () => {
    try { gfRealtimeClients.delete(client); } catch(_){}
  });
});

setInterval(() => {
  for (const client of Array.from(gfRealtimeClients)) {
    gfRealtimeSend(client, 'ping', { at: Date.now() });
  }
}, 25000);





// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// ✅ GF FIX: libera CSS e JS separados antes de qualquer rota dinâmica.
// Sem isso, /css/admin.css ou /js/admin.js pode cair em uma página HTML,
// causando MIME errado e "Invalid or unexpected token" no navegador.
app.use("/css", express.static(path.join(FRONTEND_DIR, "css"), {
  setHeaders: (res) => res.setHeader("Content-Type", "text/css; charset=utf-8")
}));
app.use("/js", express.static(path.join(FRONTEND_DIR, "js"), {
  setHeaders: (res) => res.setHeader("Content-Type", "application/javascript; charset=utf-8")
}));

// 🔒 PROTEÇÃO GLOBAL API (SEM QUEBRAR QR)
app.use((req, res, next) => {

  // só protege /api
  if (!req.path.startsWith("/api/")) return next();

  // 🔓 ROTAS PÚBLICAS (QR + LOGIN)
  if (
    req.path.startsWith("/api/auth/login") ||
     req.path.startsWith("/api/auth/register") ||
      req.path.startsWith("/api/auth/forgot-password") ||
  req.path.startsWith("/api/auth/reset-password") ||

    // QR / solicitante (ESSENCIAL)
    req.path.startsWith("/api/public") ||
    req.path.startsWith("/api/qr") ||
    req.path.startsWith("/api/sector") ||
    req.path.startsWith("/api/assets") ||   // ⚠️ importante
    req.path.startsWith("/api/history")
  ) {
    return next();
  }

  // 🔒 resto protegido
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      ok: false,
      error: "Não autenticado"
    });
  }

  req.user = user;
  next();
});

// Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// Chamados pelo QR: somente fotos, no máximo 2 arquivos, para manter o sistema leve.
const PUBLIC_TICKET_MAX_PHOTOS = 2;
const PUBLIC_TICKET_MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB por foto
const PUBLIC_TICKET_ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const uploadPublicTicketPhotos = multer({
  storage,
  limits: {
    files: PUBLIC_TICKET_MAX_PHOTOS,
    fileSize: PUBLIC_TICKET_MAX_PHOTO_SIZE
  },
  fileFilter: function (req, file, cb) {
    const mime = String(file.mimetype || "").toLowerCase();
    const ext = path.extname(file.originalname || "").toLowerCase();
    const okMime = PUBLIC_TICKET_ALLOWED_IMAGE_MIMES.has(mime);
    const okExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    if (!okMime || !okExt) {
      return cb(new Error("Envie somente fotos JPG, PNG ou WEBP. Vídeos não são permitidos."));
    }
    cb(null, true);
  }
});

function cleanupUploadedFiles(files) {
  try {
    (Array.isArray(files) ? files : []).forEach(removeUploadedFileSafe);
  } catch(_){}
}

function handlePublicTicketPhotoUpload(req, res, next) {
  uploadPublicTicketPhotos.array("attachments", PUBLIC_TICKET_MAX_PHOTOS)(req, res, function (err) {
    if (!err) return next();

    cleanupUploadedFiles(req.files);

    let message = err.message || "Erro ao enviar fotos";
    if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT") {
      message = `Máximo de ${PUBLIC_TICKET_MAX_PHOTOS} fotos por chamado.`;
    } else if (err.code === "LIMIT_FILE_SIZE") {
      message = "Cada foto pode ter no máximo 5 MB.";
    }

    return res.status(400).json({ ok: false, error: message });
  });
}

function removeUploadedFileSafe(file) {
  try {
    if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch(_){}
}

function saveTicketResolutionPhoto(ticketId, file, req) {
  if (!file) return null;
  const mime = String(file.mimetype || "").toLowerCase();
  if (!mime.startsWith("image/")) {
    removeUploadedFileSafe(file);
    const err = new Error("Envie somente imagem na foto de resolução");
    err.statusCode = 400;
    throw err;
  }
  const fileUrl = `/uploads/${file.filename}`;
  db.prepare(`
    INSERT INTO ticket_attachments (ticket_id, file_url, file_type)
    VALUES (?, ?, ?)
  `).run(ticketId, fileUrl, file.mimetype || "image/jpeg");
  insertTicketLogSafe(ticketId, "RESOLUTION_PHOTO", req.user.id, `Foto da resolução: ${fileUrl}`, req);
  return fileUrl;
}

// Upload dedicado para logos das empresas.
// Mantém o app multiempresa automático, sem depender de link externo/CDN.
const companyLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, COMPANY_LOGOS_DIR);
  },
  filename: function (req, file, cb) {
    const extRaw = path.extname(file.originalname || "").toLowerCase();
    const ext = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(extRaw) ? extRaw : ".png";
    const base = slugify(req.body?.slug || req.body?.name || "empresa");
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const uploadCompanyLogo = multer({
  storage: companyLogoStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ok = /^image\//i.test(String(file.mimetype || ""));
    cb(ok ? null : new Error("Envie apenas imagem para a logo"), ok);
  },
});

function companyLogoPublicUrl(req, file) {
  if (!file) return "";
  // Salva como caminho interno para evitar http/https misturado no app Android/WebView.
  return `/uploads/company-logos/${encodeURIComponent(file.filename)}`;
}


function guessImageExtFromContentType(contentType, fallbackUrl) {
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("png")) return ".png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  if (ct.includes("gif")) return ".gif";
  if (ct.includes("svg")) return ".svg";
  try {
    const ext = path.extname(new URL(String(fallbackUrl || "")).pathname || "").toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) return ext;
  } catch(_){}
  return ".png";
}

function isExternalLogoUrl(value) {
  const raw = String(value || "").trim();
  return /^https?:\/\//i.test(raw) && !/\/uploads\/company-logos\//i.test(raw);
}

async function saveCompanyLogoFromLink(req, logoUrl, slugOrName) {
  const raw = String(logoUrl || "").trim();
  if (!isExternalLogoUrl(raw)) return raw;

  const response = await fetch(raw, {
    headers: {
      "User-Agent": "Mozilla/5.0 GuaraFacilitiesApp/1.0",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    console.warn("[EMPRESA] Não foi possível baixar logo externa:", response.status, raw);
    return raw;
  }

  const contentType = response.headers.get("content-type") || "image/png";
  if (!String(contentType).toLowerCase().startsWith("image/")) {
    console.warn("[EMPRESA] Link informado não parece imagem:", contentType, raw);
    return raw;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) return raw;

  const ext = guessImageExtFromContentType(contentType, raw);
  const safeBase = slugify(slugOrName || "empresa");
  const filename = `${safeBase}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const fullPath = path.join(COMPANY_LOGOS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);

  return `/uploads/company-logos/${encodeURIComponent(filename)}`;
}

async function resolveCompanyLogoUrl(req, fallbackCurrentLogo = "") {
  if (req.file) return companyLogoPublicUrl(req, req.file);
  const typed = String(req.body.logo_url || req.body.logo || "").trim();
  if (!typed) return String(fallbackCurrentLogo || "").trim();
  return await saveCompanyLogoFromLink(req, typed, req.body.slug || req.body.name || "");
}


function pickCompanyLogoUrl(req) {
  const uploaded = companyLogoPublicUrl(req, req.file);
  if (uploaded) return uploaded;
  return String(req.body.logo_url || req.body.logo || "").trim();
}


// PUSH PWA - usuário autenticado registra o aparelho nesta empresa.
app.get("/api/push/public-key", requireAuth, (req, res) => {
  const keys = configureWebPush();
  if (!keys || !keys.publicKey) {
    return res.status(500).json({
      ok:false,
      error:"Push não conseguiu gerar a chave VAPID. Verifique permissão de escrita na pasta do servidor e reinicie o Node."
    });
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.json({ ok:true, publicKey: keys.publicKey, webpushReady: !!webpush });
});

app.post("/api/push/subscribe", requireAuth, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    // Blindagem: usuário comum só registra na própria empresa.
    if (!isSuperAdminUser(req.user) && Number(req.user.company_id || 0) !== Number(cid)) {
      return res.status(403).json({ ok:false, error:"Empresa da sessão não confere" });
    }

    const sub = req.body && req.body.subscription ? req.body.subscription : req.body;
    const endpoint = String(sub?.endpoint || "").trim();
    const p256dh = String(sub?.keys?.p256dh || "").trim();
    const auth = String(sub?.keys?.auth || "").trim();
    if (!endpoint || !p256dh || !auth) return res.status(400).json({ ok:false, error:"Subscription inválida" });

    // GF PUSH MULTIDISPOSITIVO:
    // Não desativa PC/celular do mesmo usuário.
    // A proteção contra duplicidade é por endpoint único:
    // PC Chrome = 1 endpoint, Celular PWA = 1 endpoint, Notebook = 1 endpoint.
    // Se o mesmo endpoint registrar de novo, o UPDATE abaixo só renova o registro.


    // Compatível com bancos antigos: usa UPDATE + INSERT separado para aceitar bancos sem UNIQUE(endpoint).
    const updatedPush = db.prepare(`
      UPDATE push_subscriptions
      SET user_id = ?,
          company_id = ?,
          p256dh = ?,
          auth = ?,
          user_agent = ?,
          active = 1,
          updated_at = CURRENT_TIMESTAMP,
          last_seen_at = CURRENT_TIMESTAMP
      WHERE endpoint = ?
    `).run(req.user.id, cid, p256dh, auth, String(req.headers["user-agent"] || ""), endpoint);

    if (!updatedPush.changes) {
      db.prepare(`
        INSERT INTO push_subscriptions (user_id, company_id, endpoint, p256dh, auth, user_agent, active, created_at, updated_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(req.user.id, cid, endpoint, p256dh, auth, String(req.headers["user-agent"] || ""));
    }

    res.json({ ok:true });
  } catch (err) {
    console.error("[PUSH] Erro subscribe:", err);
    res.status(500).json({ ok:false, error:"Erro ao registrar notificações" });
  }
});



app.get("/api/push/devices", requireAuth, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    const rows = db.prepare(`
      SELECT id, user_id, company_id, active, user_agent, created_at, updated_at, last_seen_at,
             substr(endpoint, 1, 42) || '...' AS endpoint_preview
      FROM push_subscriptions
      WHERE user_id = ?
        AND company_id = ?
        AND active = 1
      ORDER BY datetime(COALESCE(last_seen_at, updated_at, created_at)) DESC, id DESC
      LIMIT 20
    `).all(req.user.id, cid);

    res.setHeader("Cache-Control", "no-store");
    res.json({ ok:true, devices:rows, count:rows.length, mode:"multi_device_endpoint_unique" });
  } catch (err) {
    console.error("[PUSH] Erro devices:", err);
    res.status(500).json({ ok:false, error:"Erro ao listar dispositivos" });
  }
});

app.get("/api/push/status", requireAuth, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    const endpoint = String(req.query.endpoint || "").trim();
    let active = false;
    let active_count = 0;

    if (endpoint) {
      const row = db.prepare(`
        SELECT id, active, updated_at, last_seen_at
        FROM push_subscriptions
        WHERE endpoint = ? AND user_id = ? AND company_id = ?
        ORDER BY id DESC
        LIMIT 1
      `).get(endpoint, req.user.id, cid);

      if (row && Number(row.active) === 1) {
        active = true;
        try {
          db.prepare(`UPDATE push_subscriptions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?`).run(row.id);
        } catch(_){}
      }
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM push_subscriptions
      WHERE user_id = ? AND company_id = ? AND active = 1
    `).get(req.user.id, cid);

    active_count = Number((countRow && countRow.total) || 0);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.json({ ok:true, active:active, active_count:active_count });
  } catch (err) {
    console.error("[PUSH] Erro status:", err);
    res.status(500).json({ ok:false, error:"Erro ao consultar notificações" });
  }
});


app.post("/api/push/cleanup-duplicates", requireAuth, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    if (!isAdminUser(req.user) && !isSuperAdminUser(req.user)) {
      return res.status(403).json({ ok:false, error:"Sem permissão" });
    }

    const before = db.prepare(`
      SELECT COUNT(*) AS total
      FROM push_subscriptions
      WHERE company_id = ? AND active = 1
    `).get(cid);

    // Limpa somente endpoints realmente duplicados.
    // Não derruba PC + celular do mesmo usuário.
    db.prepare(`
      UPDATE push_subscriptions
      SET active = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
        AND id NOT IN (
          SELECT MAX(id)
          FROM push_subscriptions
          WHERE company_id = ?
          GROUP BY endpoint
        )
    `).run(cid, cid);

    const after = db.prepare(`
      SELECT COUNT(*) AS total
      FROM push_subscriptions
      WHERE company_id = ? AND active = 1
    `).get(cid);

    res.json({ ok:true, before:Number(before?.total || 0), after:Number(after?.total || 0), mode:"endpoint_unique_multi_device" });
  } catch (err) {
    console.error("[PUSH] Erro cleanup duplicates:", err);
    res.status(500).json({ ok:false, error:"Erro ao limpar inscrições duplicadas" });
  }
});


app.post("/api/push/unsubscribe", requireAuth, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    const endpoint = String(req.body?.endpoint || "").trim();

    if (endpoint) {
      db.prepare(`
        UPDATE push_subscriptions
        SET active=0, updated_at=CURRENT_TIMESTAMP
        WHERE endpoint=? AND user_id=? AND company_id=?
      `).run(endpoint, req.user.id, cid);
    } else {
      // Segurança multiaparelho: sem endpoint não desativa todos os aparelhos.
      // O navegador precisa enviar o endpoint para remover somente este PC/celular/app.
      return res.json({ ok:true, skipped:true, reason:"endpoint ausente" });
    }

    res.json({ ok:true });
  } catch (err) {
    console.error("[PUSH] Erro unsubscribe:", err);
    res.status(500).json({ ok:false, error:"Erro ao remover notificação" });
  }
});


app.post("/api/push/test", requireAuth, async (req, res) => {
  try {
    const cid = requireCompanyScope(req, res);
    if (!cid) return;

    const company = db.prepare(`SELECT id, name, slug FROM companies WHERE id=? LIMIT 1`).get(cid);
    const fake = {
      id: 0,
      ticket_number: "TESTE",
      company_id: cid,
      company_slug: company?.slug || req.user.session_company_slug || "",
      company_name: company?.name || "Empresa",
      asset_department: "TI",
      sector_name: "Teste",
      asset_name: "Notificação do app",
      asset_brand: "",
      asset_model: "",
      issue_name: "Teste de notificação push",
      description: "Teste de notificação push"
    };

    const payload = buildTicketPushPayload(fake);
    const rows = db.prepare(`
      SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.active = 1
        AND ps.company_id = ?
        AND u.active = 1
        AND (
          u.company_id = ?
          OR COALESCE(u.is_super_admin,0) = 1
          OR UPPER(COALESCE(u.role,'')) = 'SUPER_ADMIN'
        )
        AND UPPER(COALESCE(u.role,'')) IN ('ADMIN','TECH','SUPER_ADMIN')
    `).all(cid, cid);

    if (!rows.length) return res.status(404).json({ ok:false, error:"Nenhum aparelho inscrito para esta empresa" });

    configureWebPush();
    if (!webpush) return res.status(500).json({ ok:false, error:"web-push não instalado no servidor. Rode: npm install web-push e reinicie o Node." });
    for (const row of rows) {
      await webpush.sendNotification({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      }, JSON.stringify(payload));
    }

    res.json({ ok:true, sent: rows.length });
  } catch (err) {
    console.error("[PUSH] Teste falhou:", err);
    res.status(500).json({ ok:false, error: err.message || "Erro no teste push" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, name: "Guará Facilities API", version: "8.0.0-enterprise" });
});


// =========================
// V70 - APP SAAS IDENTIFICA EMPRESA AUTOMATICAMENTE
// IMPORTANTE: APK baixado puro não herda cookies/localStorage do navegador.
// Para identificar sem escolher empresa, o botão do painel leva para /c/:slug/app.
// Essa rota salva o slug e instala/abre o app pela empresa correta.
// /app só reaproveita o slug já salvo dentro do WebView/PWA; se não houver, manda voltar ao link da empresa.
// =========================
function gfEscapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function gfAppBaseUrl(req){
  try { return `${req.protocol}://${req.get('host')}`; } catch (_) { return String(PUBLIC_QR_BASE || '').replace(/\/$/, ''); }
}


function gfCompanyLogoSrc(company) {
  const logo = String(company?.logo_url || "").trim();
  if (!logo) return "";
  const slug = String(company?.slug || "").trim();

  // Se já está salvo localmente, usa caminho interno. Isso evita bloqueio http/https no WebView.
  if (logo.startsWith("/uploads/company-logos/")) return logo;

  // Se o banco ainda tiver URL completa do próprio domínio, converte para caminho interno.
  try {
    const u = new URL(logo);
    if (/facilities\.requisicoesguara93783j8934hgd993k\.uk$/i.test(u.host) && u.pathname.startsWith("/uploads/company-logos/")) {
      return u.pathname;
    }
  } catch(_){}

  if (logo.startsWith("/")) return logo;

  // Logos externas antigas passam pela rota proxy interna.
  return slug ? `/c/${encodeURIComponent(slug)}/logo` : logo;
}

function gfAppLandingHtml(company, targetPath, req) {
  const safeSlug = gfEscapeHtml(company.slug || "");
  const safeName = gfEscapeHtml(company.name || "Empresa");
  const safeLogo = gfEscapeHtml(gfCompanyLogoSrc(company));
  const safeTarget = gfEscapeHtml(targetPath || (`/c/${company.slug}/admin`));
  const manifestUrl = `/c/${encodeURIComponent(company.slug)}/manifest.webmanifest`;
  const iconUrl = `/c/${encodeURIComponent(company.slug)}/icon-512.png?v=${Date.now()}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${safeName}</title>
<link rel="manifest" href="${manifestUrl}">
<link rel="apple-touch-icon" href="${iconUrl}">
<meta name="theme-color" content="#07152f">
<meta name="background-color" content="#07152f">
<style>
*{box-sizing:border-box}
html,body{
  margin:0;
  width:100%;
  min-width:100%;
  min-height:100%;
  font-family:Arial,Helvetica,sans-serif;
  background:#07152f;
  color:#fff;
}
body{
  min-height:100vh;
  min-height:100dvh;
  display:grid;
  place-items:center;
  padding:24px;
  overflow:hidden;
  background:
    radial-gradient(circle at 50% 22%,rgba(34,126,255,.22),transparent 38%),
    radial-gradient(circle at 84% 88%,rgba(0,181,255,.14),transparent 38%),
    linear-gradient(180deg,#06142d 0%,#071d3f 48%,#062653 100%);
}
body:before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(135deg,rgba(255,255,255,.045),transparent 32%),
    repeating-linear-gradient(135deg,rgba(255,255,255,.026) 0 1px,transparent 1px 54px);
  opacity:.75;
}
.gfAppCard{
  width:min(86vw,420px);
  min-height:min(74vh,680px);
  border-radius:34px;
  padding:42px 24px 34px;
  background:
    radial-gradient(circle at 50% 12%,rgba(28,112,255,.16),transparent 38%),
    linear-gradient(180deg,#06214a 0%,#061938 100%);
  border:1px solid rgba(255,255,255,.12);
  box-shadow:0 24px 80px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08);
  text-align:center;
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  overflow:hidden;
}
.gfAppCard:before,.gfAppCard:after{
  content:"";
  position:absolute;
  width:180px;
  height:180px;
  border:1px solid rgba(42,154,255,.10);
  border-radius:34px;
  transform:rotate(28deg);
  pointer-events:none;
}
.gfAppCard:before{left:-96px;top:-70px}
.gfAppCard:after{right:-100px;bottom:-74px}
.gfAppLogo{
  width:192px;
  height:192px;
  margin:0 auto 16px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:visible;
  background:transparent;
  position:relative;
  z-index:2;
}
.gfAppLogo img{
  width:100%;
  max-width:100%;
  height:100%;
  object-fit:contain!important;
  object-position:center!important;
  border-radius:0!important;
  transform:none!important;
  filter:drop-shadow(0 10px 22px rgba(0,0,0,.36));
}
.gfAppLogo.no:before{
  content:'G';
  width:150px;
  height:150px;
  border-radius:36px;
  display:grid;
  place-items:center;
  font-size:72px;
  font-weight:1000;
  color:#fff;
  background:linear-gradient(135deg,#0b66b2,#062653);
  box-shadow:0 18px 48px rgba(0,0,0,.34);
}
h1{
  margin:0;
  color:#fff;
  font-size:44px;
  line-height:1.02;
  font-weight:1000;
  letter-spacing:-.05em;
  text-shadow:0 5px 18px rgba(0,0,0,.28);
}
.gfAppLoader{
  width:52px;
  height:52px;
  margin:86px auto 0;
  border-radius:999px;
  border:5px solid rgba(255,255,255,.14);
  border-top-color:#1c8cff;
  animation:gfSpin .86s linear infinite;
  transition:.18s ease;
}
.gfAppLoader.done{display:none!important}
.gfAppReady{
  display:none;
  margin:74px auto 0;
  width:max-content;
  max-width:100%;
  padding:10px 15px;
  border-radius:999px;
  background:rgba(32,185,109,.16);
  border:1px solid rgba(32,185,109,.34);
  color:#bdfad8;
  font-size:13px;
  font-weight:1000;
  box-shadow:0 10px 24px rgba(0,0,0,.14);
}
.gfAppReady.show{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.gfAppActions{display:grid;gap:10px;margin-top:18px;width:100%;max-width:320px;position:relative;z-index:3}
.gfAppBtn{min-height:50px;border-radius:18px;border:0;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:15px;font-weight:1000;cursor:pointer}
.gfAppBtn.primary{background:linear-gradient(135deg,#18b6ff,#0b66b2);color:#fff;box-shadow:0 12px 28px rgba(0,0,0,.20)}
.gfAppBtn.secondary{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.16)}
.gfAppHint{display:block;margin-top:13px;color:rgba(255,255,255,.60);font-size:12px;font-weight:800;line-height:1.35;max-width:330px}
body.gfStandalone .gfAppActions,body.gfStandalone .gfAppHint,body.gfStandalone .gfAppReady{display:none!important}
body.gfStandalone{padding:0}
body.gfStandalone .gfAppCard{
  width:100vw;
  height:100vh;
  height:100dvh;
  min-height:100vh;
  border-radius:0;
  border:0;
  box-shadow:none;
}
.gfHidden{display:none!important}
@keyframes gfSpin{to{transform:rotate(360deg)}}
@media(max-width:420px){
  body{padding:0}
  .gfAppCard{width:100vw;height:100vh;height:100dvh;min-height:100vh;border-radius:0;border:0;box-shadow:none}
  .gfAppLogo{width:176px;height:176px}
  h1{font-size:40px}
  .gfAppLoader{margin-top:72px}
}
</style>
</head>
<body>
<div class="gfAppCard" aria-label="${safeName}">
  <div class="gfAppLogo ${safeLogo ? "" : "no"}">${safeLogo ? `<img src="${safeLogo}" alt="${safeName}">` : ""}</div>
  <h1>${safeName}</h1>
  <div class="gfAppLoader" id="gfAppLoader"></div>
  <div class="gfAppReady" id="gfAppReady">✅ Instalação disponível</div>
  <div class="gfAppActions">
    <button class="gfAppBtn primary" id="installBtn" type="button" style="display:none">📲 Instalar aplicativo</button>
    <a class="gfAppBtn secondary" href="${safeTarget}">Entrar no painel agora</a>
  </div>
  <small class="gfAppHint">No Android/Chrome, toque em instalar aplicativo. No iPhone, use Safari &gt; Compartilhar &gt; Adicionar à Tela de Início.</small>
</div>
<script>
(function(){
  var slug=${JSON.stringify(company.slug || "")};
  var target=${JSON.stringify(targetPath || (`/c/${company.slug}/admin`))};
  try{ localStorage.setItem('gf_company_slug', slug); }catch(e){}
  try{ localStorage.setItem('GF_COMPANY_SLUG', slug); }catch(e){}
  try{ sessionStorage.setItem('GF_COMPANY_SLUG', slug); }catch(e){}
  try{ document.cookie='gf_company_slug='+encodeURIComponent(slug)+'; Path=/; SameSite=Lax; Max-Age='+(60*60*24*365); }catch(e){}

  var standalone=false;
  try{ standalone=!!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) || !!window.navigator.standalone; }catch(e){}
  if(standalone){
    document.body.classList.add('gfStandalone');
    setTimeout(function(){ location.replace(target); }, 250);
    return;
  }

  var deferredPrompt=null;
  var btn=document.getElementById('installBtn');
  var loader=document.getElementById('gfAppLoader');
  var ready=document.getElementById('gfAppReady');
  var hint=document.querySelector('.gfAppHint');

  function showPreparing(){
    if(loader) loader.classList.remove('done');
    if(ready) ready.classList.remove('show');
    if(btn) btn.style.display='none';
    if(hint) hint.textContent='Preparando instalação segura do app desta empresa...';
  }

  function showInstallReady(){
    if(loader) loader.classList.add('done');
    if(ready){
      ready.textContent='✅ Pronto para instalar';
      ready.classList.add('show');
    }
    if(btn){
      btn.disabled=false;
      btn.style.display='flex';
      btn.textContent='📲 Instalar aplicativo';
    }
    if(hint) hint.textContent='Agora toque em Instalar aplicativo. Depois o app abrirá direto nesta empresa.';
  }

  function showNotReady(){
    if(loader) loader.classList.remove('done');
    if(ready) ready.classList.remove('show');
    if(btn) btn.style.display='none';
    if(hint) hint.textContent='Preparando instalação direta. Mantenha esta tela aberta por alguns segundos...';
  }

  async function preparePwa(){
    showPreparing();
    try{
      if('serviceWorker' in navigator){
        await navigator.serviceWorker.register('/sw.js', { scope:'/' });
        await navigator.serviceWorker.ready;
      }
    }catch(e){
      console.warn('PWA Service Worker falhou:', e);
    }

    // Se o Chrome realmente puder instalar, ele dispara beforeinstallprompt.
    // Se não disparar, não mostramos botão falso.
    setTimeout(function(){
      if(!deferredPrompt) showNotReady();
    }, 2200);
    setTimeout(function(){
      if(!deferredPrompt && hint) hint.textContent='Ainda preparando instalação direta. Se o app já estiver instalado, remova o antigo e abra esta tela novamente pelo Chrome.';
    }, 7000);
  }

  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt=e;
    showInstallReady();
  });

  window.addEventListener('appinstalled', function(){
    if(btn){
      btn.textContent='✅ App instalado';
      btn.disabled=true;
    }
    setTimeout(function(){ location.replace(target); }, 600);
  });

  if(btn){
    btn.addEventListener('click', async function(){
      if(!deferredPrompt){
        showNotReady();
        return;
      }
      try{
        btn.disabled=true;
        btn.textContent='⏳ Instalando...';
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      }catch(e){}
      deferredPrompt=null;
      setTimeout(function(){ location.replace(target); }, 500);
    });
  }

  preparePwa();
})();
</script>
</body>
</html>`;
}

function gfAppIconSvg(company) {
  const safeName = gfEscapeHtml(company.name || "Guará");
  const logo = gfEscapeHtml(company.logo_url || "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#062653"/>
      <stop offset="1" stop-color="#06142d"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity=".38"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <circle cx="122" cy="92" r="136" fill="#1c8cff" opacity=".12"/>
  <circle cx="420" cy="420" r="155" fill="#00b6ff" opacity=".09"/>
  ${logo ? `<image href="${logo}" x="86" y="104" width="340" height="250" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>` : `<text x="256" y="292" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="190" font-weight="900" fill="#ffffff" filter="url(#shadow)">G</text>`}
  <text x="256" y="394" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="900" fill="#ffffff" filter="url(#shadow)">${safeName}</text>
</svg>`;
}


async function gfCompanyLogoBuffer(company) {
  try {
    const raw = String(company?.logo_url || "").trim();
    if (!raw) return null;

    if (raw.startsWith("/uploads/company-logos/")) {
      const filename = decodeURIComponent(raw.split("/uploads/company-logos/")[1] || "");
      const full = path.join(COMPANY_LOGOS_DIR, path.basename(filename));
      if (fs.existsSync(full)) return fs.readFileSync(full);
    }

    try {
      const u = new URL(raw);
      if (/facilities\.requisicoesguara93783j8934hgd993k\.uk$/i.test(u.host) && u.pathname.startsWith("/uploads/company-logos/")) {
        const filename = decodeURIComponent(u.pathname.split("/uploads/company-logos/")[1] || "");
        const full = path.join(COMPANY_LOGOS_DIR, path.basename(filename));
        if (fs.existsSync(full)) return fs.readFileSync(full);
      }
    } catch(_){}

    if (/^https?:\/\//i.test(raw)) {
      const response = await fetch(raw, {
        headers: {
          "User-Agent": "Mozilla/5.0 GuaraFacilitiesApp/1.0",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    }
  } catch (err) {
    console.warn("[PWA-ICON] Falha ao carregar logo:", err.message);
  }
  return null;
}

function gfIconBgSvg(company) {
  const safeName = gfEscapeHtml(company.name || "Empresa");
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071044"/>
      <stop offset="44%" stop-color="#0047b8"/>
      <stop offset="100%" stop-color="#00b7ef"/>
    </linearGradient>
    <linearGradient id="waveA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4c63ff" stop-opacity=".72"/>
      <stop offset="100%" stop-color="#00d4ff" stop-opacity=".38"/>
    </linearGradient>
    <linearGradient id="waveB" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020832" stop-opacity=".64"/>
      <stop offset="100%" stop-color="#005fc9" stop-opacity=".34"/>
    </linearGradient>
    <radialGradient id="shine" cx="36%" cy="18%" r="74%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".32"/>
      <stop offset="52%" stop-color="#ffffff" stop-opacity=".08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx="84%" cy="80%" r="62%">
      <stop offset="0%" stop-color="#00e5ff" stop-opacity=".40"/>
      <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="txtShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity=".36"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#shine)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <path d="M-70 184 C72 248 154 142 272 84 C386 28 454 92 586 24 L586 -30 L-70 -30 Z" fill="url(#waveA)" opacity=".88"/>
  <path d="M-74 374 C54 300 168 404 282 348 C386 296 448 314 586 238 L586 560 L-74 560 Z" fill="url(#waveB)" opacity=".86"/>
  <path d="M-52 104 C88 66 174 120 298 58 C402 5 474 34 560 -18" fill="none" stroke="#ffffff" stroke-width="12" opacity=".12"/>
  <path d="M-42 432 C82 350 174 392 286 348 C392 306 456 276 566 198" fill="none" stroke="#ffffff" stroke-width="10" opacity=".11"/>
  <text x="256" y="360" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" letter-spacing=".3" fill="#ffffff" filter="url(#txtShadow)">${safeName}</text>
  <line x1="154" y1="392" x2="358" y2="392" stroke="#ffffff" stroke-width="2" opacity=".42"/>
  <text x="256" y="422" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="800" letter-spacing=".7" fill="#e8f6ff" opacity=".98">Gestão de Patrimônio</text>
</svg>`);
}

async function gfCompanyIconPng(company) {
  if (!sharp) return null;

  const bg = await sharp(gfIconBgSvg(company)).png().toBuffer();
  const logoBuffer = await gfCompanyLogoBuffer(company);
  if (!logoBuffer) return bg;

  let meta = null;
  let logoPng = null;
  try {
    const image = sharp(logoBuffer, { animated: false });
    meta = await image.metadata();

    // Logos retangulares ficam centralizadas e maiores, sem caixa branca.
    logoPng = await image
      .resize({ width: 286, height: 142, fit: "inside", withoutEnlargement: false })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn("[PWA-ICON] Logo não convertida:", err.message);
    return bg;
  }

  const info = await sharp(logoPng).metadata().catch(() => ({ width: 310, height: 168 }));
  const left = Math.round((512 - Number(info.width || 310)) / 2);
  const top = 104;

  return await sharp(bg)
    .composite([{ input: logoPng, left, top }])
    .png()
    .toBuffer();
}

app.get("/c/:slug/icon-512.png", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(slug);

    if (!company) return res.status(404).send("Empresa não encontrada");

    const png = await gfCompanyIconPng(company);
    if (png) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      return res.send(png);
    }

    // Fallback sem Sharp: devolve um SVG próprio em vez de redirecionar para JPG/WEBP externo.
    // Assim o PWA sempre tem um ícone válido da empresa, mesmo antes de instalar sharp.
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res.send(gfCompanyIconSvg(company));
  } catch (err) {
    console.warn("[PWA-ICON] Falha icon-512.png:", err.message);
    return res.status(500).send("Erro ao gerar ícone");
  }
});


app.get("/c/:slug/icon.svg", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const company = db.prepare(`
    SELECT id, name, slug, logo_url, active
    FROM companies
    WHERE slug = ? AND active = 1
    LIMIT 1
  `).get(slug);
  if (!company) return res.status(404).send("Empresa não encontrada");
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(gfAppIconSvg(company));
});


app.get("/c/:slug/logo", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(slug);

    if (!company || !String(company.logo_url || "").trim()) {
      return res.status(404).send("Logo não cadastrada");
    }

    const logoUrl = String(company.logo_url || "").trim();

    if (logoUrl.startsWith("/")) return res.redirect(logoUrl);
    try {
      const u = new URL(logoUrl);
      if (/facilities\.requisicoesguara93783j8934hgd993k\.uk$/i.test(u.host) && u.pathname.startsWith("/uploads/company-logos/")) {
        return res.redirect(u.pathname);
      }
    } catch(_){}

    // Se já é do próprio domínio/uploads, redireciona direto.
    if (/\/uploads\/company-logos\//i.test(logoUrl)) return res.redirect(logoUrl);

    const response = await fetch(logoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 GuaraFacilitiesApp/1.0",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(502).send("Não foi possível carregar a logo da empresa");
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.warn("[APP] Falha no proxy da logo:", err.message);
    return res.status(500).send("Erro ao carregar logo");
  }
});


// PWA: Service Worker obrigatório para o Chrome liberar instalação.
app.get(["/sw.js", "/c/:slug/sw.js", "/c/:slug/admin/sw.js"], (req, res) => {
  // Chrome/Android exige SW no escopo correto para liberar Push.
  // Service-Worker-Allowed evita falha de escopo quando o app abre em /c/:slug/admin.
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Service-Worker-Allowed", "/");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.send(`
self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event){
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e){}
  var title = data.title || 'Novo chamado';
  var options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || data.icon || '/favicon.ico',
    // Não exibir imagem grande para não cortar o texto da prévia.
    tag: data.tag || ('ticket-' + Date.now()),
    renotify: data.renotify !== false,
    vibrate: data.vibrate || [160,80,160],
    data: data.data || {},
    actions: data.actions || [{ action:'open', title:'Abrir chamado' }]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var data = (event.notification && event.notification.data) || {};
  var url = data.url || '/';
  var ticketId = data.ticketId || data.ticket_id || data.id || '';
  try {
    var u = new URL(url, self.location.origin);
    ticketId = ticketId || u.searchParams.get('ticket_id') || u.searchParams.get('db_id') || u.searchParams.get('id') || u.searchParams.get('ticket') || u.searchParams.get('chamado') || u.searchParams.get('open') || '';
  } catch(e){}
  event.waitUntil((async function(){
    var allClients = await clients.matchAll({ type:'window', includeUncontrolled:true });
    for (var i=0; i<allClients.length; i++) {
      var client = allClients[i];
      try {
        var clientUrl = new URL(client.url);
        var targetUrl = new URL(url, self.location.origin);
        if (clientUrl.origin === targetUrl.origin) {
          if ('focus' in client) await client.focus();
          try { client.postMessage({ type:'GF_OPEN_TICKET', url:url, ticketId:ticketId }); } catch(e){}
          return;
        }
      } catch(e){}
    }
    return clients.openWindow(url);
  })());
});

self.addEventListener('fetch', function(event){
  // Online-first: não interfere nas rotas do sistema.
});
`);
});

app.get("/c/:slug/manifest.webmanifest", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const company = db.prepare(`
    SELECT id, name, slug, logo_url, active
    FROM companies
    WHERE slug = ? AND active = 1
    LIMIT 1
  `).get(slug);
  if (!company) return res.status(404).json({ error: "Empresa não encontrada" });
  const iconVer = encodeURIComponent(String(company.logo_url || "") + "-" + Math.floor(Date.now() / 60000));
  const iconUrl = `/c/${encodeURIComponent(company.slug)}/icon-512.png?v=${iconVer}`;
  const iconSvgUrl = `/c/${encodeURIComponent(company.slug)}/icon.svg?v=${iconVer}`;
    const appName = String(company.name || "Guará").trim();
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  return res.json({
    name: appName,
    short_name: appName.slice(0, 18),
    description: appName,
    id: `/c/${company.slug}/app`,
    start_url: `/c/${company.slug}/app`,
    scope: `/`,
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#07152f",
    theme_color: "#07152f",
    // Necessário para Chrome/Android registrar Push sem cair em "Registration failed - push service error".
    // É o sender padrão oficial usado por Web Push no Chromium.
    gcm_sender_id: "103953800507",
    icons: [
      { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: iconSvgUrl, sizes: "512x512", type: "image/svg+xml", purpose: "any" }
    ]
  });
});

app.get("/c/:slug/app", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const company = db.prepare(`
    SELECT id, name, slug, logo_url, plan_name, plan_status, active
    FROM companies
    WHERE slug = ? AND active = 1
    LIMIT 1
  `).get(slug);
  if (!company) return res.status(404).send("Empresa não encontrada ou inativa");
  setCompanyCookie(res, company.slug);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(gfAppLandingHtml(company, `/c/${company.slug}/admin`, req));
});

app.get("/app", (req, res) => {
  const cookies = parseCookies(req);
  let slug = String(req.query.company || req.query.slug || cookies.gf_company_slug || "").trim().toLowerCase();

  if (!slug) {
    try {
      const ref = String(req.headers.referer || req.headers.referrer || "");
      const u = ref ? new URL(ref, PUBLIC_QR_BASE) : null;
      const m = u && String(u.pathname || "").match(/^\/c\/([^\/]+)/i);
      if (m) slug = decodeURIComponent(m[1] || "").toLowerCase();
    } catch(_){}
  }

  if (slug) {
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, plan_status, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(slug);
    if (company) {
      setCompanyCookie(res, company.slug);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(gfAppLandingHtml(company, `/c/${company.slug}/admin`, req));
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Facilities App</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f8fd;color:#06123a;min-height:100vh;display:grid;place-items:center;padding:22px}.card{background:#fff;border:1px solid #e3ebf5;border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(8,19,71,.12);max-width:520px;text-align:center}h1{margin:0 0 10px;font-size:24px}p{color:#667085;font-weight:800;line-height:1.45}.warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:16px;padding:12px;font-weight:900;margin-top:14px}</style></head><body><div class="card"><h1>Empresa não identificada</h1><p>Para o app abrir certo, instale pelo botão dentro do painel da empresa ou acesse o link da empresa primeiro.</p><div class="warn">Exemplo: /c/nome-da-empresa/app</div></div></body></html>`);
});

// Login por empresa (rota amigável SaaS)
app.get("/c/:slug", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) return res.redirect("/login");
  return res.redirect(`/login?company=${encodeURIComponent(slug)}`);
});

app.get("/c/:slug/login", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) return res.redirect("/login");
  return res.redirect(`/login?company=${encodeURIComponent(slug)}`);
});

app.get("/c/:slug/admin", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const company = db.prepare(`
    SELECT id, name, slug, logo_url, plan_name, plan_status, active
    FROM companies
    WHERE slug = ? AND active = 1
    LIMIT 1
  `).get(slug);
  if (!company) return res.status(404).send("Empresa não encontrada ou inativa");
  setCompanyCookie(res, company.slug);
  return sendCompanyHtml(req, res, "admin.html", company);
});

// Login page
app.get("/login", (req, res) => {
  const cookies = parseCookies(req);
  let companySlug = String(req.query.company || "").trim().toLowerCase();

  // SAAS FINAL: /login solto NÃO existe mais.
  // O login sempre precisa vir assinado pela empresa: /login?company=slug ou /c/slug.
  // Se ainda existe cookie de empresa, corrige a URL automaticamente.
  if (!companySlug) {
    const cookieCompanySlug = String(cookies.gf_company_slug || "").trim().toLowerCase();
    if (cookieCompanySlug) {
      return res.redirect(`/login?company=${encodeURIComponent(cookieCompanySlug)}`);
    }

    return res.status(403).send(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acesso da empresa obrigatório</title>
<style>
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#061a3d;color:#fff;min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:560px;background:#fff;color:#06123a;border-radius:22px;padding:28px;box-shadow:0 18px 60px rgba(0,0,0,.25)}h1{margin:0 0 10px;font-size:24px}p{line-height:1.45;color:#465674;font-weight:700}.btn{display:inline-block;margin-top:12px;background:#06123a;color:#fff;text-decoration:none;border-radius:14px;padding:12px 16px;font-weight:900}
</style>
</head>
<body>
  <div class="card">
    <h1>Use o link da empresa</h1>
    <p>Este login não funciona sozinho. Acesse pelo link da empresa, por exemplo: <b>/c/nome-da-empresa</b>.</p>
    <p>Isso evita misturar dados, usuários, setores, chamados e tipos de problema entre empresas diferentes.</p>
  </div>
</body>
</html>`);
  }

  setCompanyCookie(res, companySlug);

  try {
    const requestedCompany = db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, plan_status, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(companySlug);

    if (!requestedCompany) {
      res.append("Set-Cookie", "gf_company_slug=; Path=/; SameSite=Lax; Max-Age=0");
      return res.status(404).send("Empresa não encontrada ou inativa");
    }

    const loginCookieName = sessionCookieName(companySlug);
    const token = cookies[loginCookieName] || cookies.gf_session;
    const session = token ? sessions.get(token) : null;

    if (token && session) {
      const currentUser = db.prepare(`
        SELECT id, company_id, COALESCE(is_super_admin,0) AS is_super_admin, role
        FROM users
        WHERE id = ? AND active = 1
        LIMIT 1
      `).get(session.userId);

      const isSuper = currentUser && isSuperAdminUser(currentUser);
      const sessionCompanyId = Number(session.companyId || currentUser?.company_id || 0);
      const requestedId = Number(requestedCompany.id || 0);

      // Derruba qualquer sessão que não seja exatamente desta empresa.
      // Assim sair/entrar ou trocar /c/empresa nunca reaproveita sessão de outra base.
      if (!currentUser || isSuper || sessionCompanyId !== requestedId) {
        sessions.delete(token);
        deletePersistentSession(token);
        for (const h of sessionCookieClearHeaders(companySlug)) res.append("Set-Cookie", h);
      }
    }
  } catch (err) {
    console.warn("[SAAS] Aviso ao validar sessão da empresa no login:", err.message);
  }

  const loginPath = path.join(FRONTEND_DIR, "login.html");
  if (fs.existsSync(loginPath)) {
    const company = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE slug=? LIMIT 1`).get(companySlug);
    return sendCompanyHtml(req, res, "login.html", company);
  }
  return res.send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login</title></head><body><h1>Login da empresa</h1><form method="post" action="/api/auth/login"><input name="email" placeholder="email"><input name="password" placeholder="senha" type="password"><input type="hidden" name="company_slug" value="${companySlug}"><button>Entrar</button></form></body></html>`);
});

app.post("/api/auth/login", (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ ok: false, error: "Informe email e senha" });

    const requestedCompany = getRequestedCompany(req);
    if (requestedCompany && (Number(requestedCompany.active || 0) !== 1 || String(requestedCompany.plan_status || "").toUpperCase() === "SUSPENDED")) {
      return res.status(403).json({ ok: false, error: "Empresa suspensa ou inativa" });
    }

    let user = null;

    // SAAS FINAL: login pelo link da empresa precisa validar a empresa certa.
    // Revisão mobile: separa claramente 3 erros diferentes:
    // 1) usuário não existe na empresa, 2) usuário existe mas está inativo, 3) senha incorreta.
    // Antes senha errada também retornava "usuário não cadastrado", confundindo o teste no celular.
    if (requestedCompany) {
      user = db.prepare(`
        SELECT id, name, email, role, active, password_hash, company_id, COALESCE(is_super_admin,0) AS is_super_admin
        FROM users
        WHERE email = ?
          AND company_id = ?
        LIMIT 1
      `).get(email, requestedCompany.id);

      if (!user) {
        const sameEmail = db.prepare(`
          SELECT u.id, u.email, u.company_id, c.name AS company_name, c.slug AS company_slug
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.email = ?
          LIMIT 1
        `).get(email);

        if (sameEmail && Number(sameEmail.company_id || 0) !== Number(requestedCompany.id || 0)) {
          return res.status(401).json({
            ok: false,
            error: `Este email existe em outra empresa (${sameEmail.company_name || sameEmail.company_slug || 'sem nome'}). Para entrar aqui, crie ou vincule este usuário na empresa ${requestedCompany.name}.`
          });
        }

        return res.status(401).json({
          ok: false,
          error: `Usuário não cadastrado na empresa ${requestedCompany.name}. Confira o email ou crie a conta por este link da empresa.`
        });
      }

      if (Number(user.active || 0) !== 1) {
        return res.status(403).json({ ok: false, error: "Usuário inativo nesta empresa. Ative o usuário no painel ou no banco." });
      }

      if (user.password_hash !== hashPassword(password)) {
        return res.status(401).json({ ok: false, error: "Senha incorreta para este usuário nesta empresa." });
      }
    } else {
      // Login normal sem empresa continua funcionando para Super Admin e painel antigo.
      user = db.prepare(`
        SELECT id, name, email, role, active, password_hash, company_id, COALESCE(is_super_admin,0) AS is_super_admin
        FROM users
        WHERE email = ? AND active = 1
        LIMIT 1
      `).get(email);

      if (!user || user.password_hash !== hashPassword(password)) {
        return res.status(401).json({ ok: false, error: "Email ou senha inválidos" });
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;

    // V85 - não derruba outras sessões do mesmo usuário.
    // Assim site e app podem ficar logados ao mesmo tempo.
    const sessionData = {
      userId: user.id,
      expiresAt,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      // SAAS: guarda a empresa acessada por /c/:slug dentro da sessão.
      // Assim até Super Admin, ao clicar em "Painel da Empresa", vê dados desta empresa.
      companyId: requestedCompany?.id || user.company_id || null,
      companySlug: requestedCompany?.slug || "",
      userAgent: String(req.headers["user-agent"] || ""),
      ip: String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || ""),
    };

    sessions.set(token, sessionData);
    savePersistentSession(token, sessionData);

    const cookiesToSet = [
      buildSessionCookie(sessionCookieName(requestedCompany?.slug || ''), token)
    ];
    if (requestedCompany?.slug) {
      cookiesToSet.push(`gf_company_slug=${encodeURIComponent(requestedCompany.slug)}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
      cookiesToSet.push('gf_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
    }
    res.setHeader("Set-Cookie", cookiesToSet);

    return res.json({
      ok: true,
      redirect_url: requestedCompany?.slug ? `/c/${encodeURIComponent(requestedCompany.slug)}/admin` : "/admin.html",
      company: requestedCompany ? { id: requestedCompany.id, name: requestedCompany.name, slug: requestedCompany.slug } : null,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id, session_company_id: requestedCompany?.id || user.company_id || null, is_super_admin: Number(user.is_super_admin || 0) },
    });
  } catch (err) {
    console.error("Erro login:", err);
    res.status(500).json({ ok: false, error: "Erro interno no login" });
  }
});


// V10.19 - Cadastro público controlado por código interno e tipo selecionado
// A conta só é criada se o código bater com o perfil permitido.
app.post("/api/auth/register", (req, res) => {
  try {
    const name = String(current.name || "").trim();
    const email = String(req.body.email || current.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const code = String(req.body.internal_code || req.body.code || "").trim();
    const selectedRole = String(req.body.role || req.body.account_type || "").trim().toUpperCase();
    const role = roleFromRegisterCode(code);

    if (!name) return res.status(400).json({ ok: false, error: "Nome completo não encontrado" });
    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (!password || password.length < 6) return res.status(400).json({ ok: false, error: "Senha precisa ter pelo menos 6 caracteres" });
    if (!selectedRole || !["ADMIN", "TECH", "VIEWER"].includes(selectedRole)) {
      return res.status(400).json({ ok: false, error: "Escolha o tipo de cadastro: Administrador, Técnico ou Visualizador" });
    }
    if (!role) return res.status(403).json({ ok: false, error: "Código interno inválido" });
    if (role !== selectedRole) {
      return res.status(403).json({
        ok: false,
        error: `Código não pertence ao cadastro ${roleLabelBR(selectedRole)}. Confira o tipo selecionado e o código interno.`
      });
    }

    const requestedCompany = getRequestedCompany(req);
    if (!requestedCompany) {
      return res.status(400).json({ ok: false, error: "Empresa não identificada. Abra pelo link da empresa, exemplo: /c/nome-da-empresa" });
    }
    if (requestedCompany && (Number(requestedCompany.active || 0) !== 1 || String(requestedCompany.plan_status || "").toUpperCase() === "SUSPENDED")) {
      return res.status(403).json({ ok: false, error: "Empresa suspensa ou inativa" });
    }
    const targetCompanyId = requestedCompany.id;

    // SAAS FINAL: o cadastro é separado por empresa.
    // O mesmo email pode existir em outra empresa, mas não duplicado dentro da mesma empresa.
    const exists = db.prepare(`SELECT id FROM users WHERE email = ? AND company_id = ?`).get(email, targetCompanyId);
    if (exists) return res.status(409).json({ ok: false, error: "Já existe uma conta com esse email nesta empresa" });

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, active, company_id)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(name, email, hashPassword(password), role, targetCompanyId);

    try {
      db.prepare(`
        INSERT INTO admin_audit_log (entity_type, entity_id, action, notes)
        VALUES (?, ?, ?, ?)
      `).run("user", result.lastInsertRowid, "USER_SELF_REGISTERED", `Cadastro pela tela de login: ${name} (${email}) Perfil: ${role}`);
    } catch(_){}

    res.status(201).json({ ok: true, message: "Conta criada com sucesso", role });
  } catch (err) {
    console.error("Erro register:", err);
    if (String(err && err.message || '').toLowerCase().includes('unique')) {
      return res.status(409).json({ ok: false, error: "Este email já existe nesta empresa. Se ele só existe em outra empresa, reinicie o servidor para aplicar a migração SaaS e tente novamente." });
    }
    res.status(500).json({ ok: false, error: "Erro interno ao criar conta" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const cookies = parseCookies(req);
  const companySlug = getRequestedCompanySlug(req);
  const cookieName = sessionCookieName(companySlug);
  const token = cookies[cookieName] || cookies.gf_session;
  if (token) {
    sessions.delete(token);
    deletePersistentSession(token);
  }

  const headers = sessionCookieClearHeaders(companySlug);
  // Mantém gf_company_slug apenas para voltar ao login assinado da mesma empresa.
  res.setHeader("Set-Cookie", headers);
  res.json({
    ok: true,
    redirect_url: companySlug ? `/login?company=${encodeURIComponent(companySlug)}` : "/"
  });
});

app.get("/api/admin/me", requireAuth, (req, res) => {
  // Retorna o usuário atual já com preferências da conta.
  const cid = currentCompanyId(req) || req.user.company_id;
  const company = cid ? db.prepare(`SELECT id,name,slug,logo_url,plan_name,plan_status,monthly_price,active FROM companies WHERE id=?`).get(cid) : null;
  const freshUser = db.prepare(`
    SELECT id, name, COALESCE(display_name,'') AS display_name, email, role, active, company_id,
           COALESCE(theme,'light') AS theme,
           COALESCE(notify_push,1) AS notify_push,
           COALESCE(notify_sound,1) AS notify_sound,
           COALESCE(notify_vibration,1) AS notify_vibration,
           COALESCE(compact_mode,0) AS compact_mode
    FROM users WHERE id = ? LIMIT 1
  `).get(req.user.id) || req.user;
  res.json({ ok: true, user: freshUser, company, session_hours: SESSION_HOURS });
});



// =========================
// V217 - IA Guará Facilities / MiniAI / OpenAI / Gemini
// SOMENTE VISUALIZAÇÃO: não altera banco, não executa ações e não chama rotas internas de edição.
// Aceita chaves no .env:
// GF_AI_API_KEY, MINIAI_API_KEY, GBP_MINIAI_TOKEN, GBP_MINIAI_API_KEY,
// GEMINI_API_KEY, GOOGLE_AI_API_KEY, OPENAI_API_KEY, AI_API_KEY
// Opcional: GF_AI_API_URL / MINIAI_API_URL / GBP_MINIAI_API_URL / AI_API_URL / GF_AI_MODEL
// =========================
function gfAiEnv(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}
function gfAiPickAnswer(data) {
  try {
    return String(
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map(p => p?.text || "").join("\n") ||
      data?.candidates?.[0]?.text ||
      data?.message?.content || data?.answer || data?.response || data?.text || ""
    ).trim();
  } catch (_) { return ""; }
}
function gfAiProvider(apiKey, apiUrl) {
  const forced = gfAiEnv("GF_AI_PROVIDER", "MINIAI_PROVIDER", "AI_PROVIDER").toLowerCase();
  if (forced) return forced;
  const url = String(apiUrl || "").toLowerCase();
  if (url.includes("generativelanguage.googleapis.com") || url.includes("gemini")) return "gemini";
  if (String(apiKey || "").startsWith("AIza")) return "gemini";
  return "openai";
}

function gfAiBuildDbContext(req) {
  // SOMENTE LEITURA: este contexto dá acesso amplo à IA, mas sem dados sensíveis.
  // Não inclui senha, hash, token, sessão, código de recuperação, email de usuário ou cookie.
  try {
    const cid = currentCompanyId(req) || req.user?.company_id || null;
    const oneParam = cid ? [cid] : [null];
    const twoParams = cid ? [cid, cid] : [null, null];
    const safeAll = (sql, params = []) => { try { return db.prepare(sql).all(...params); } catch (_) { return []; } };
    const safeGet = (sql, params = []) => { try { return db.prepare(sql).get(...params) || {}; } catch (_) { return {}; } };
    const n = (v) => Number(v || 0);
    const kindExpr = `COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
      WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
      ELSE 'EQUIPMENT'
    END)`;

    const sectors = safeAll(`
      SELECT id, name, slug, COALESCE(active,1) AS active
      FROM sectors
      WHERE (? IS NULL OR company_id=?)
      ORDER BY name ASC
      LIMIT 300
    `, twoParams);

    const assetRows = safeAll(`
      SELECT a.id, a.name, COALESCE(a.patrimonio,'') AS patrimonio,
             COALESCE(a.brand,'') AS brand, COALESCE(a.model,'') AS model,
             COALESCE(a.status,'ACTIVE') AS status,
             ${kindExpr} AS asset_kind,
             COALESCE(a.asset_department,'') AS asset_department,
             s.id AS sector_id, COALESCE(s.name,'Sem setor') AS setor
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE (? IS NULL OR COALESCE(a.company_id, s.company_id)=?)
      ORDER BY a.id DESC
      LIMIT 600
    `, twoParams);

    const assetsBySector = safeAll(`
      SELECT COALESCE(s.name,'Sem setor') AS setor,
             COUNT(*) AS total_itens,
             SUM(CASE WHEN ${kindExpr}='EQUIPMENT' THEN 1 ELSE 0 END) AS equipamentos_fisicos,
             SUM(CASE WHEN ${kindExpr}='SERVICE' THEN 1 ELSE 0 END) AS servicos_vinculados,
             SUM(CASE WHEN COALESCE(a.status,'ACTIVE')='ACTIVE' THEN 1 ELSE 0 END) AS ativos
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE (? IS NULL OR COALESCE(a.company_id, s.company_id)=?)
      GROUP BY COALESCE(s.name,'Sem setor')
      ORDER BY total_itens DESC, setor ASC
      LIMIT 120
    `, twoParams);

    const assetCounts = safeGet(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN ${kindExpr}='EQUIPMENT' THEN 1 ELSE 0 END) AS equipamentos_fisicos,
             SUM(CASE WHEN ${kindExpr}='SERVICE' THEN 1 ELSE 0 END) AS servicos_vinculados,
             SUM(CASE WHEN COALESCE(a.status,'ACTIVE')='ACTIVE' THEN 1 ELSE 0 END) AS ativos,
             SUM(CASE WHEN COALESCE(a.status,'ACTIVE')<>'ACTIVE' THEN 1 ELSE 0 END) AS inativos
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE (? IS NULL OR COALESCE(a.company_id, s.company_id)=?)
    `, twoParams);

    const serviceGroups = (typeof listServiceGroups === 'function' ? listServiceGroups(req) : []).slice(0,120).map(s => ({
      servico: s.name,
      setores_vinculados: s.active_count || s.sectors?.length || 0,
      setores: (s.sectors || []).map(x => x.name).slice(0,80),
      registros_antigos_agrupados: s.total_assets || 0
    }));

    const issueTypes = safeAll(`
      SELECT i.id, i.name AS problema, COALESCE(i.priority,'') AS prioridade,
             COALESCE(i.active,1) AS active, COALESCE(NULLIF(TRIM(i.asset_name),''), a.name, 'Geral') AS item
      FROM issue_types i
      LEFT JOIN assets a ON a.id=i.asset_id
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE (? IS NULL OR COALESCE(i.company_id, a.company_id, s.company_id)=?)
      ORDER BY i.id DESC
      LIMIT 300
    `, twoParams);

    const ticketRows = safeAll(`
      SELECT
        t.id, COALESCE(t.ticket_number,t.id) AS numero, t.status, t.priority,
        t.description, t.created_at, t.updated_at, t.resolved_at,
        s.name AS setor,
        COALESCE(a.name,'') AS equipamento,
        COALESCE(a.patrimonio,'') AS patrimonio,
        ${kindExpr} AS asset_kind,
        COALESCE(i.name,'') AS problema,
        COALESCE(u.name,'') AS responsavel,
        COALESCE(t.maintenance_value,0) AS maintenance_value
      FROM tickets t
      JOIN sectors s ON s.id=t.sector_id
      LEFT JOIN assets a ON a.id=t.asset_id
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      LEFT JOIN users u ON u.id=t.assigned_to_user_id
      WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
      ORDER BY t.id DESC
      LIMIT 160
    `, twoParams);

    const open = ticketRows.filter(t => !['DONE','CANCELED'].includes(String(t.status||'')));
    const done = ticketRows.filter(t => String(t.status||'') === 'DONE');
    const critical = open.filter(t => String(t.priority||'').toUpperCase() === 'HIGH');
    const group = (rows, field) => {
      const map = new Map();
      for (const r of rows) {
        const k = String(r[field] || 'Não informado').trim() || 'Não informado';
        map.set(k, (map.get(k) || 0) + 1);
      }
      return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([nome,total])=>({nome,total}));
    };

    const costs = safeGet(`
      SELECT COUNT(*) AS chamados_com_valor,
             SUM(COALESCE(maintenance_value,0)) AS total_manutencao,
             AVG(NULLIF(maintenance_value,0)) AS media_manutencao
      FROM tickets t
      JOIN sectors s ON s.id=t.sector_id
      WHERE COALESCE(maintenance_value,0) > 0
      AND (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
    `, twoParams);

    return {
      fonte: 'banco_sqlite_somente_leitura_sem_dados_sensiveis',
      aviso: 'Contexto não inclui senhas, tokens, sessões, códigos de recuperação nem emails de usuários.',
      setores: {
        total: sectors.length,
        lista: sectors.map(s => ({id:s.id, nome:s.name, slug:s.slug, ativo:!!s.active})).slice(0,200)
      },
      equipamentos_e_servicos: {
        total_registros_assets: n(assetCounts.total),
        equipamentos_fisicos: n(assetCounts.equipamentos_fisicos),
        servicos_vinculados_registros_antigos: n(assetCounts.servicos_vinculados),
        ativos: n(assetCounts.ativos),
        inativos: n(assetCounts.inativos),
        por_setor: assetsBySector.map(r => ({
          setor:r.setor, total_itens:n(r.total_itens), equipamentos_fisicos:n(r.equipamentos_fisicos), servicos_vinculados:n(r.servicos_vinculados), ativos:n(r.ativos)
        })),
        lista_recente: assetRows.slice(0,250).map(a => ({
          id:a.id, nome:a.name, tipo:a.asset_kind === 'SERVICE' ? 'SERVIÇO' : 'EQUIPAMENTO FÍSICO', setor:a.setor,
          patrimonio:a.patrimonio, marca:a.brand, modelo:a.model, status:a.status, departamento:a.asset_department
        }))
      },
      servicos_agrupados: serviceGroups,
      tipos_de_problema: {
        total_consultado: issueTypes.length,
        lista: issueTypes.map(i => ({problema:i.problema, item:i.item, prioridade:i.prioridade, ativo:!!i.active})).slice(0,200)
      },
      chamados: {
        total_consultado: ticketRows.length,
        abertos: open.length,
        resolvidos: done.length,
        criticos_prioridade_alta: critical.length,
        setores_mais_ocorrencias: group(ticketRows, 'setor'),
        equipamentos_mais_ocorrencias: group(ticketRows, 'equipamento'),
        ultimos_chamados: ticketRows.slice(0,40).map(r => ({
          numero:r.numero, status:statusLabelBR(r.status), prioridade:r.priority,
          setor:r.setor, item:r.equipamento, tipo_item:r.asset_kind === 'SERVICE' ? 'SERVIÇO' : 'EQUIPAMENTO FÍSICO', patrimonio:r.patrimonio,
          problema:r.problema, descricao:r.description,
          responsavel:r.responsavel, criado:formatDateBR(r.created_at), atualizado:formatDateBR(r.updated_at), resolvido:formatDateBR(r.resolved_at)
        })),
        chamados_abertos: open.slice(0,40).map(r => ({numero:r.numero,status:statusLabelBR(r.status),prioridade:r.priority,setor:r.setor,item:r.equipamento,problema:r.problema,descricao:r.description,criado:formatDateBR(r.created_at)})),
        chamados_criticos: critical.slice(0,40).map(r => ({numero:r.numero,status:statusLabelBR(r.status),prioridade:r.priority,setor:r.setor,item:r.equipamento,problema:r.problema,descricao:r.description,criado:formatDateBR(r.created_at)}))
      },
      custos_manutencao: {
        chamados_com_valor: n(costs.chamados_com_valor),
        total_manutencao: n(costs.total_manutencao),
        media_manutencao: n(costs.media_manutencao)
      }
    };
  } catch (err) {
    return { fonte:'banco_sqlite_somente_leitura_sem_dados_sensiveis', erro:String(err.message || err) };
  }
}

async function gfAiChatHandler(req, res) {
  try {
    const apiKey = gfAiEnv(
      "GF_AI_API_KEY", "MINIAI_API_KEY", "GBP_MINIAI_TOKEN", "GBP_MINIAI_API_KEY",
      "GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "AI_API_KEY"
    );
    let apiUrl = gfAiEnv("GF_AI_API_URL", "MINIAI_API_URL", "GBP_MINIAI_URL", "GBP_MINIAI_API_URL", "AI_API_URL");
    let model = gfAiEnv("GF_AI_MODEL", "MINIAI_MODEL", "GBP_MINIAI_MODEL", "AI_MODEL");
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
    const panelContext = req.body?.panel_context || null;
    const dbContext = gfAiBuildDbContext(req);
    if (!message) return res.status(400).json({ ok:false, error:"Digite uma pergunta para a IA." });
    if (!apiKey) return res.status(503).json({ ok:false, error:"IA sem token no .env. Coloque GF_AI_API_KEY, MINIAI_API_KEY, GBP_MINIAI_TOKEN, GEMINI_API_KEY ou OPENAI_API_KEY e rode: pm2 restart guara-facilities --update-env" });

    const safeSystem = `Você é a IA do Guará Facilities. Responda em português do Brasil, de forma natural, curta e útil.
Você está em modo SOMENTE VISUALIZAÇÃO: não pode apagar, editar, cadastrar, finalizar, assumir, transferir ou executar ações no sistema.
Se o usuário pedir alteração, explique que só pode orientar e que a ação precisa ser feita manualmente por usuário autorizado.
REGRA PRINCIPAL DO SISTEMA:
- Equipamento físico é asset_kind=EQUIPMENT: monitor, impressora, computador, TV, nobreak, catraca, balança etc.
- Serviço é asset_kind=SERVICE: Limber, Internet, Marcenaria, Passagem de Cabo, Requisição, Manutenção Predial, Vidraçaria etc.
- Tipo de problema é issue_types.name: NÃO LIGA, SEM IMAGEM, LENTIDÃO, FALHA DE REDE, SOLICITAÇÃO GERAL etc.
Nunca chame serviço de equipamento. Quando asset_kind for SERVICE, diga “Serviço”.
Quando responder sobre chamados, combine: setor + Serviço/Equipamento + problema + status + prioridade.
Quando o usuário perguntar quantidade, resumo, críticos, setores, equipamentos ou serviços, use primeiro o CONTEXTO DO PAINEL e o CONTEXTO DO BANCO abaixo.
Entenda a intenção: perguntas sobre equipamentos/serviços devem usar equipamentos_e_servicos e servicos_agrupados; perguntas sobre chamados devem usar chamados; perguntas sobre problemas devem usar tipos_de_problema.
Não responda que não há chamados quando a pergunta for sobre equipamentos ou serviços. Não diga que não consegue acessar o painel se houver dados no contexto.`;
    const liveContextText = `CONTEXTO DO PAINEL/FRONTEND (somente leitura):
${JSON.stringify(panelContext || {}, null, 2).slice(0, 12000)}

CONTEXTO DO BANCO (somente leitura):
${JSON.stringify(dbContext || {}, null, 2).slice(0, 30000)}`;
    const messages = [{ role:"system", content:safeSystem }, { role:"system", content:liveContextText }];
    for (const h of history) {
      const role = h?.role === "assistant" ? "assistant" : "user";
      const content = String(h?.content || "").slice(0, 2500).trim();
      if (content) messages.push({ role, content });
    }
    messages.push({ role:"user", content:message });
    const provider = gfAiProvider(apiKey, apiUrl);
    let response;
    if (provider === "gemini") {
      model = model || "gemini-1.5-flash";
      apiUrl = apiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const sep = apiUrl.includes("?") ? "&" : "?";
      response = await fetch(`${apiUrl}${sep}key=${encodeURIComponent(apiKey)}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:safeSystem }] },
          contents:messages.filter(m=>m.role!=="system").map(m=>({ role:m.role==="assistant"?"model":"user", parts:[{ text:m.content }] })),
          generationConfig:{ temperature:0.3 }
        })
      });
    } else {
      model = model || "gpt-4o-mini";
      apiUrl = apiUrl || "https://api.openai.com/v1/chat/completions";
      response = await fetch(apiUrl, {
        method:"POST", headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}`, "x-api-key":apiKey },
        body:JSON.stringify({ model, messages, temperature:0.3 })
      });
    }
    const raw = await response.text();
    let data = null; try { data = JSON.parse(raw); } catch (_) { data = { text: raw }; }
    if (!response.ok) {
      const detail = data?.error?.message || data?.error?.status || data?.error || raw || response.statusText;
      return res.status(502).json({ ok:false, error:`Falha ao consultar a IA (${provider}): ${detail}` });
    }
    return res.json({ ok:true, answer:gfAiPickAnswer(data) || "A IA respondeu, mas não retornou texto.", provider });
  } catch (err) {
    return res.status(500).json({ ok:false, error:"Erro interno na IA: " + (err.message || err) });
  }
}
app.post("/api/admin/ai-chat", requireAuth, gfAiChatHandler);
app.post("/api/ai-chat", requireAuth, gfAiChatHandler);

// =========================
// V10.16 - USUÁRIOS / ADM / RECUPERAÇÃO DE SENHA
// =========================

app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, COALESCE(display_name,'') AS display_name, email, role, active, company_id, COALESCE(theme,'light') AS theme, COALESCE(notify_push,1) AS notify_push, COALESCE(notify_sound,1) AS notify_sound, COALESCE(notify_vibration,1) AS notify_vibration, COALESCE(compact_mode,0) AS compact_mode
      FROM users
      WHERE role <> 'SUPER_ADMIN' AND (? IS NULL OR company_id = ?)
      ORDER BY active DESC, name ASC, id ASC
    `).all(isSuperAdminUser(req.user)?null:req.user.company_id, isSuperAdminUser(req.user)?null:req.user.company_id);
    res.json({ ok: true, users });
  } catch (err) {
    console.error("Erro GET users:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao buscar usuários" });
  }
});

app.post("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "TECH").trim().toUpperCase();
    const active = req.body.active === false || String(req.body.active) === "0" ? 0 : 1;
    const displayName = String(req.body.display_name || '').trim();

    if (!name) return res.status(400).json({ ok: false, error: "Nome completo não encontrado" });
    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (!password || password.length < 6) return res.status(400).json({ ok: false, error: "Senha precisa ter pelo menos 6 caracteres" });
    if (!["ADMIN", "TECH", "VIEWER"].includes(role)) return res.status(400).json({ ok: false, error: "Perfil inválido" });

    const cid = isSuperAdminUser(req.user) ? (Number(req.body.company_id || 0) || null) : currentCompanyId(req);
    const exists = db.prepare(`SELECT id FROM users WHERE email = ? AND company_id = ?`).get(email, cid, cid);
    if (exists) return res.status(409).json({ ok: false, error: "Já existe usuário com esse email nesta empresa" });

    const result = db.prepare(`
      INSERT INTO users (name, display_name, email, password_hash, role, active, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, displayName || name.split(/\s+/).slice(0,2).join(' '), email, hashPassword(password), role, active, cid);

    auditAdmin(req, "user", result.lastInsertRowid, "USER_CREATED", `Usuário criado: ${name} (${email}) Perfil: ${role}`);
    res.status(201).json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Erro POST users:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao criar usuário" });
  }
});

app.put("/api/admin/users/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const cid = currentCompanyId(req);
    const current = db.prepare(`
      SELECT id, email, company_id, COALESCE(is_super_admin,0) AS is_super_admin, role
      FROM users
      WHERE id = ?
        AND role <> 'SUPER_ADMIN'
        AND (? IS NULL OR company_id = ?)
      LIMIT 1
    `).get(id, cid, cid);
    if (!current) return res.status(404).json({ ok: false, error: "Usuário não encontrado nesta empresa" });

    const name = String(current.name || "").trim();
    const email = String(req.body.email || current.email || "").trim().toLowerCase();
    const role = String(req.body.role || "TECH").trim().toUpperCase();
    const active = req.body.active === false || String(req.body.active) === "0" ? 0 : 1;
    const displayName = String(req.body.display_name || '').trim();

    if (!name) return res.status(400).json({ ok: false, error: "Nome completo não encontrado" });
    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (!["ADMIN", "TECH", "VIEWER"].includes(role)) return res.status(400).json({ ok: false, error: "Perfil inválido" });

    const exists = db.prepare(`
      SELECT id
      FROM users
      WHERE email = ?
        AND id <> ?
        AND ((? IS NULL AND company_id IS NULL) OR company_id = ?)
      LIMIT 1
    `).get(email, id, current.company_id || null, current.company_id || null);
    if (exists) return res.status(409).json({ ok: false, error: "Outro usuário já usa esse email nesta empresa" });

    if (id === req.user.id && active === 0) {
      return res.status(400).json({ ok: false, error: "Você não pode desativar seu próprio usuário" });
    }

    const info = db.prepare(`
      UPDATE users
      SET display_name = ?, email = ?, role = ?, active = ?
      WHERE id = ?
        AND role <> 'SUPER_ADMIN'
        AND (? IS NULL OR company_id = ?)
    `).run(displayName || name.split(/\s+/).slice(0,2).join(' '), email, role, active, id, cid, cid);

    if (!info.changes) return res.status(404).json({ ok: false, error: "Usuário não encontrado nesta empresa" });

    auditAdmin(req, "user", id, "USER_UPDATED", `Usuário atualizado: ${name} (${email}) Perfil: ${role} Ativo: ${active ? "sim" : "não"}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro PUT users:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao atualizar usuário" });
  }
});

app.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const cid = currentCompanyId(req);
    const password = String(req.body.password || "");
    if (!password || password.length < 6) return res.status(400).json({ ok: false, error: "Nova senha precisa ter pelo menos 6 caracteres" });

    const user = db.prepare(`
      SELECT id, name, email, company_id
      FROM users
      WHERE id = ?
        AND role <> 'SUPER_ADMIN'
        AND (? IS NULL OR company_id = ?)
      LIMIT 1
    `).get(id, cid, cid);
    if (!user) return res.status(404).json({ ok: false, error: "Usuário não encontrado nesta empresa" });

    const info = db.prepare(`
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
        AND role <> 'SUPER_ADMIN'
        AND (? IS NULL OR company_id = ?)
    `).run(hashPassword(password), id, cid, cid);
    if (!info.changes) return res.status(404).json({ ok: false, error: "Usuário não encontrado nesta empresa" });

    auditAdmin(req, "user", id, "USER_PASSWORD_RESET", `Senha redefinida pelo administrador para ${user.email}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro reset admin password:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao redefinir senha" });
  }
});

app.put("/api/admin/me/profile", requireAuth, (req, res) => {
  try {
    const currentUser = db.prepare(`SELECT name FROM users WHERE id = ? LIMIT 1`).get(req.user.id);
    const name = String(currentUser?.name || req.user.name || "").trim();
    const displayName = String(req.body.display_name || "").trim();
    const theme = ["light","dark","blue","green","slate"].includes(String(req.body.theme || "light")) ? String(req.body.theme || "light") : "light";
    const notifyPush = req.body.notify_push === false || String(req.body.notify_push) === "0" ? 0 : 1;
    const notifySound = req.body.notify_sound === false || String(req.body.notify_sound) === "0" ? 0 : 1;
    const notifyVibration = req.body.notify_vibration === false || String(req.body.notify_vibration) === "0" ? 0 : 1;
    const compactMode = req.body.compact_mode === true || String(req.body.compact_mode) === "1" ? 1 : 0;
    if (!name) return res.status(400).json({ ok:false, error:"Nome completo não encontrado" });
    db.prepare(`
      UPDATE users
      SET display_name = ?, theme = ?, notify_push = ?, notify_sound = ?, notify_vibration = ?, compact_mode = ?
      WHERE id = ? AND active = 1
    `).run(displayName || name.split(/\s+/).slice(0,2).join(' '), theme, notifyPush, notifySound, notifyVibration, compactMode, req.user.id);
    res.json({ ok:true });
  } catch (err) {
    console.error("Erro update me profile:", err);
    res.status(500).json({ ok:false, error:"Erro interno ao salvar configurações" });
  }
});

app.post("/api/admin/change-password", requireAuth, (req, res) => {
  try {
    const currentPassword = String(req.body.current_password || "");
    const newPassword = String(req.body.new_password || "");
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ ok: false, error: "Nova senha precisa ter pelo menos 6 caracteres" });

    const user = db.prepare(`SELECT id, password_hash FROM users WHERE id = ? AND active = 1`).get(req.user.id);
    if (!user || user.password_hash !== hashPassword(currentPassword)) {
      return res.status(401).json({ ok: false, error: "Senha atual incorreta" });
    }

    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(newPassword), req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro change password:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao trocar senha" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Informe um email válido" });

    const requestedCompany = getRequestedCompany(req);
    const cid = requestedCompany ? requestedCompany.id : null;
    const user = db.prepare(`
      SELECT id, name, email, active, password_hash, company_id
      FROM users
      WHERE email = ?
        AND (? IS NULL OR company_id = ?)
      ORDER BY id DESC
      LIMIT 1
    `).get(email, cid, cid);

if (!user || user.active !== 1 || !user.password_hash) {
  return res.status(404).json({
    ok: false,
    error: "Este email não está cadastrado no sistema. Solicite seu cadastro ao administrador."
  });
}
    db.prepare(`UPDATE password_reset_codes SET used_at = ? WHERE user_id = ? AND used_at IS NULL`).run(Date.now(), user.id);

    const code = makeResetCode();
    const expiresAt = Date.now() + RESET_CODE_MINUTES * 60 * 1000;
    db.prepare(`
      INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, user.email, hashPassword(code), expiresAt);

    const emailResult = await sendResetCodeEmail(user.email, code, user.name);
    res.json({
      ok: true,
      message: emailResult.sent ? "Código enviado para o email cadastrado." : "Código gerado. Configure RESEND_API_KEY no .env para envio real por email; por enquanto veja o console do servidor.",
      email_sent: !!emailResult.sent,
      provider: emailResult.provider || null,
    });
  } catch (err) {
    console.error("Erro forgot password:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao solicitar código" });
  }
});

app.post("/api/auth/reset-password", (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").replace(/\D/g, "");
    const password = String(req.body.password || "");

    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (!code || code.length !== 6) return res.status(400).json({ ok: false, error: "Código inválido" });
    if (!password || password.length < 6) return res.status(400).json({ ok: false, error: "Senha precisa ter pelo menos 6 caracteres" });

    const requestedCompany = getRequestedCompany(req);
    const cid = requestedCompany ? requestedCompany.id : null;
    const user = db.prepare(`
      SELECT id, email, active, company_id
      FROM users
      WHERE email = ?
        AND (? IS NULL OR company_id = ?)
      ORDER BY id DESC
      LIMIT 1
    `).get(email, cid, cid);
    if (!user || user.active !== 1) return res.status(400).json({ ok: false, error: "Código inválido ou expirado" });

    const row = db.prepare(`
      SELECT id, code_hash, expires_at
      FROM password_reset_codes
      WHERE user_id = ? AND email = ? AND used_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `).get(user.id, email);

    if (!row || row.expires_at < Date.now() || row.code_hash !== hashPassword(code)) {
      return res.status(400).json({ ok: false, error: "Código inválido ou expirado" });
    }

    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(password), user.id);
    db.prepare(`UPDATE password_reset_codes SET used_at = ? WHERE id = ?`).run(Date.now(), row.id);
    res.json({ ok: true, message: "Senha redefinida com sucesso" });
  } catch (err) {
    console.error("Erro reset password:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao redefinir senha" });
  }
});



// Empresa pública para login/tema antes de autenticar.
app.get('/api/public/companies/:companySlug', (req, res) => {
  try {
    const companySlug = String(req.params.companySlug || '').trim().toLowerCase();
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, plan_status, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(companySlug);
    if (!company || String(company.plan_status || '').toUpperCase() === 'SUSPENDED') {
      return res.status(404).json({ ok:false, error:'Empresa não encontrada ou inativa' });
    }
    return res.json({ ok:true, company: companyPublicPayload(company) });
  } catch (err) {
    console.error('Erro empresa pública:', err);
    return res.status(500).json({ ok:false, error:'Erro ao buscar empresa' });
  }
});

// =========================
// ROTAS PÚBLICAS QR
// =========================


// SAAS - dados públicos da empresa para aplicar logo/nome em login, painel e QR
app.get('/api/public/company/:slug', (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) return res.status(400).json({ ok:false, error:'Empresa não informada' });
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, plan_status, active
      FROM companies
      WHERE slug = ? AND active = 1
      LIMIT 1
    `).get(slug);
    if (!company) return res.status(404).json({ ok:false, error:'Empresa não encontrada' });
    return res.json({ ok:true, company });
  } catch (err) {
    console.error('Erro GET public company:', err);
    return res.status(500).json({ ok:false, error:'Erro ao buscar empresa' });
  }
});



app.get("/api/public/companies/:companySlug/sectors/:slug", (req, res) => {
  try {
    const companySlug = String(req.params.companySlug || "").toLowerCase();
    const slug = String(req.params.slug || "").toLowerCase();
    const sector = resolvePublicSector(companySlug, slug);
    if (!sector) return res.status(404).json({ ok:false, error:"Setor ou empresa não encontrado/ativo" });
    res.json({ ok:true, setor: sector, sector, company:{id:sector.company_id,name:sector.company_name,slug:sector.company_slug,logo_url:sector.logo_url,plan_name:sector.plan_name,plan_status:sector.plan_status} });
  } catch (err) { console.error("Erro GET public company sector:", err); res.status(500).json({ ok:false, error:"Erro ao buscar setor" }); }
});
app.get("/api/public/companies/:companySlug/sectors/:slug/assets", (req, res) => {
  try{
    const companySlug=String(req.params.companySlug||"").toLowerCase(); const slug=String(req.params.slug||"").toLowerCase();
    // V53: normaliza departamento igual ao cadastro/admin.
    // Aceita MANUTENÇÃO, manutencao, MANUTENCAO, etc. sem prender o QR em TI.
    const department=normalizeAssetDepartment(req.query.department || req.query.tipo || req.query.area || '');
    const sector=resolvePublicSector(companySlug, slug);
    if(!sector) return res.status(404).json({ok:false,error:'Setor não encontrado'});
    const where=[`a.sector_id=?`,`COALESCE(a.company_id, ?) = ?`,`a.status='ACTIVE'`]; const params=[sector.id, sector.company_id, sector.company_id];
    if (hasTable('services')) {
      where.push(`NOT EXISTS (SELECT 1 FROM services sv WHERE COALESCE(sv.company_id, a.company_id, ?) = COALESCE(a.company_id, ?, sv.company_id) AND COALESCE(sv.active,1)=0 AND (UPPER(TRIM(sv.name))=UPPER(TRIM(a.name)) OR (sv.legacy_asset_name IS NOT NULL AND UPPER(TRIM(sv.legacy_asset_name))=UPPER(TRIM(a.name)))))`);
      params.push(sector.company_id, sector.company_id);
    }
    if(department){ where.push(`UPPER(COALESCE(NULLIF(TRIM(a.asset_department),''),'TI'))=?`); params.push(department); }
    let assets=db.prepare(`
      SELECT
        a.*,
        COALESCE(NULLIF(TRIM(a.asset_department),''),'TI') AS asset_department,
        COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
          WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
          ELSE 'EQUIPMENT'
        END) AS asset_kind
      FROM assets a
      WHERE ${where.join(' AND ')}
      ORDER BY CASE WHEN COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT')='SERVICE' THEN 1 ELSE 0 END, a.name ASC, a.patrimonio ASC
    `).all(...params);
    assets = mergePublicAssetAndServiceItems(assets.map(normalizePublicItemDisplay), publicServiceItemsForSector(sector, department));
    res.json({ok:true,assets,department});
  }catch(err){ console.error('Erro public company assets:',err); res.status(500).json({ok:false,error:'Erro ao listar equipamentos'}); }
});
app.get("/api/public/companies/:companySlug/sectors/:slug/history", (req, res) => {
  try{
    const companySlug=String(req.params.companySlug||"").toLowerCase(); const slug=String(req.params.slug||"").toLowerCase();
    const sector=resolvePublicSector(companySlug, slug);
    if(!sector) return res.status(404).json({ok:false,error:'Setor não encontrado'});
    let tickets=db.prepare(`
      SELECT
        t.id,t.ticket_number,t.status,t.priority,t.description,t.created_at,t.resolved_at,t.final_outcome,t.sector_id,
${ticketServiceSelectFields()}
        i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        COALESCE((
          SELECT tl.created_at
          FROM ticket_logs tl
          WHERE tl.ticket_id = t.id
            AND (
              tl.action IN ('TICKET_ASSIGNED','TICKET_REOPENED','TICKET_REOPENED_FOR_SWAP','TICKET_SWAP_PENDING')
              OR UPPER(COALESCE(tl.action,'')) LIKE '%ASSIGN%'
              OR UPPER(COALESCE(tl.action,'')) LIKE '%ASSUM%'
              OR UPPER(COALESCE(tl.notes,'')) LIKE 'CHAMADO ASSUMIDO%'
            )
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ), CASE WHEN t.assigned_to_user_id IS NOT NULL THEN t.updated_at ELSE NULL END) AS assigned_at,
        (
          SELECT tl.created_at
          FROM ticket_logs tl
          WHERE tl.ticket_id = t.id
            AND tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
            AND tl.user_id IS NOT NULL
          ORDER BY CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END, tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS resolved_by_at,
        (
          SELECT COALESCE(NULLIF(u2.display_name,''), u2.name)
          FROM ticket_logs tl
          LEFT JOIN users u2 ON u2.id = tl.user_id AND COALESCE(u2.company_id, ?) = ?
          WHERE tl.ticket_id = t.id
            AND tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
            AND tl.user_id IS NOT NULL
          ORDER BY CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END, tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS resolved_by_name,
        (SELECT notes FROM ticket_logs tl WHERE tl.ticket_id=t.id AND tl.action='PUBLIC_NOTE' AND COALESCE(TRIM(tl.notes),'')<>'' ORDER BY tl.created_at DESC,tl.id DESC LIMIT 1) AS public_note,
        (SELECT created_at FROM ticket_logs tl WHERE tl.ticket_id=t.id AND tl.action='PUBLIC_NOTE' AND COALESCE(TRIM(tl.notes),'')<>'' ORDER BY tl.created_at DESC,tl.id DESC LIMIT 1) AS public_note_at,
        (SELECT COALESCE(NULLIF(u3.display_name,''), u3.name) FROM ticket_logs tl LEFT JOIN users u3 ON u3.id=tl.user_id AND COALESCE(u3.company_id, ?) = ? WHERE tl.ticket_id=t.id AND tl.action='PUBLIC_NOTE' AND COALESCE(TRIM(tl.notes),'')<>'' ORDER BY tl.created_at DESC,tl.id DESC LIMIT 1) AS public_note_by_name,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_created_at
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id AND COALESCE(a.company_id, ?) = ?
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id=t.issue_type_id AND COALESCE(i.company_id, ?) = ?
      LEFT JOIN users u ON u.id=t.assigned_to_user_id AND COALESCE(u.company_id, ?) = ?
      WHERE t.sector_id=? AND COALESCE(t.company_id, ?) = ?
      AND (
        UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO')
        OR (
          UPPER(TRIM(COALESCE(t.status,''))) IN ('DONE','FINALIZADO','RESOLVIDO')
          AND datetime(COALESCE(t.resolved_at, t.updated_at, t.created_at)) >= datetime('now','-30 days')
        )
      )
      ORDER BY
        CASE
          WHEN UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO') THEN 0
          ELSE 1
        END,
        datetime(COALESCE(t.resolved_at,t.updated_at,t.created_at)) DESC,
        t.id DESC
    `).all(sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.id, sector.company_id, sector.company_id).map(t=>({
      ...t,
      requester_update:t.public_note||'',
      public_note_by_name: t.public_note_by_name || t.assigned_to_name || '',
      public_note_at_br: formatDateBR(t.public_note_at),
      rating_created_at_br: formatDateBR(t.rating_created_at),
      technical_notes: getQrTechnicalNotes(t.id, sector.company_id),
      description:t.description,
      assigned_at_br: formatDateBR(t.assigned_at),
      resolved_by_at_br: formatDateBR(t.resolved_by_at),
      resolved_at_br: formatDateBR(t.resolved_at),
      created_at_br: formatDateBR(t.created_at),
      updated_at_br: formatDateBR(t.updated_at),
      status_label: statusLabelBR(t.status),
    }));
    gfShortenTicketListNames(tickets);
    res.json({ok:true,tickets});
  }catch(err){ res.status(500).json({ok:false,error:'Erro ao carregar histórico'}); }
});

app.get("/api/public/sectors/:slug", (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const sector = resolvePublicSectorForRequest(req, slug);

    if (!sector) return publicNotFound(res, "Setor não encontrado");
    res.json({ ok: true, sector, company:{id:sector.company_id,name:sector.company_name,slug:sector.company_slug,logo_url:sector.logo_url,plan_name:sector.plan_name,plan_status:sector.plan_status} });
  } catch (err) {
    console.error("Erro GET sector:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao buscar setor" });
  }
});

// V15.3 - QR público precisa receber sp_responsavel/sp_identificacao.
// Mantém SELECT * para não quebrar campos antigos usados no front.
app.get("/api/public/sectors/:slug/assets", (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const sector = resolvePublicSectorForRequest(req, slug);
    if (!sector) return publicNotFound(res, "Setor não encontrado");

    const department = normalizeAssetDepartment(req.query.department || req.query.tipo || req.query.area || '');

    const params = [sector.id, sector.company_id];
    let departmentSql = '';

    if (department) {
      departmentSql = ` AND UPPER(COALESCE(NULLIF(TRIM(a.asset_department),''),'TI')) = ?`;
      params.push(department);
    }

    let assets = db.prepare(`
      SELECT
        a.*,
        COALESCE(NULLIF(TRIM(a.asset_department),''),'TI') AS asset_department,
        COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
          WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
          ELSE 'EQUIPMENT'
        END) AS asset_kind
      FROM assets a
      WHERE a.sector_id = ?
        AND COALESCE(a.company_id, ?) = ?
        AND a.status = 'ACTIVE'
        ${hasTable('services') ? `AND COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
          WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS','LIMPEZA','LIMPEZA OPERACIONAL') THEN 'SERVICE'
          ELSE 'EQUIPMENT'
        END) <> 'SERVICE'` : ''}
        ${departmentSql}
      ORDER BY CASE WHEN COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT')='SERVICE' THEN 1 ELSE 0 END, a.name ASC, a.patrimonio ASC
    `).all(sector.id, sector.company_id, sector.company_id, ...(department ? [department] : []));

    assets = mergePublicAssetAndServiceItems(assets.map(normalizePublicItemDisplay), publicServiceItemsForSector(sector, department));
    return res.json({ ok: true, sector, assets, department });
  } catch (err) {
    console.error("Erro GET assets:", err);
    return res.status(500).json({ ok: false, error: "Erro interno ao buscar equipamentos" });
  }
});
app.get("/api/public/assets/:id/issues", (req, res) => {
  try {
    const { id } = req.params;
    const company = getPublicCompanyFromRequest(req);
    if (!company) return publicNotFound(res, "Equipamento não encontrado");

    const asset = db.prepare(`
      SELECT a.id, a.sector_id, a.patrimonio, a.name, a.brand, a.model, COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
        WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
        ELSE 'EQUIPMENT'
      END) AS asset_kind, COALESCE(a.company_id,s.company_id) AS company_id
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE a.id = ?
        AND a.status = 'ACTIVE'
        AND COALESCE(a.company_id, s.company_id) = ?
      LIMIT 1
    `).get(id, company.id);

    let publicItem = asset;
    const publicService = getPublicServiceByIdForCompany(Number(id), company.id);
    const serviceIssues = publicService ? listIssuesForAssetSafe(publicService) : [];

    // Quando serviço e equipamento têm o mesmo ID, o QR pode mandar apenas o número.
    // Se existir serviço com tipos vinculados, prioriza o serviço para não cair no equipamento errado.
    if (publicService && serviceIssues.length) {
      publicItem = publicService;
    }

    if (!publicItem) publicItem = publicService;
    if (!publicItem) return publicNotFound(res, "Equipamento/serviço não encontrado");

    const issues = publicItem === publicService ? serviceIssues : listIssuesForAssetSafe(publicItem);

    res.json({ ok: true, asset: publicItem, issues });
  } catch (err) {
    console.error("Erro GET issues:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao buscar problemas" });
  }
});


// GF QR RATING - salvar avaliação pública do chamado.
// Isolamento obrigatório: sempre valida company_id + ticket_id.
app.post("/api/public/tickets/:ticketId/rating", (req, res) => {
  try {
    const ticketId = Number(req.params.ticketId || 0);
    const stars = Number(req.body?.stars || 0);
    const comment = String(req.body?.comment || "").trim().slice(0, 600);

    if (!ticketId) return res.status(400).json({ ok:false, error:"Chamado inválido" });
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ ok:false, error:"Escolha uma nota de 1 a 5 estrelas" });
    }

    const company = getPublicCompanyFromRequest(req);
    if (!company) return publicNotFound(res, "Empresa não encontrada");

    const ticket = db.prepare(`
      SELECT id, ticket_number, status, company_id
      FROM tickets
      WHERE id = ? AND COALESCE(company_id, ?) = ?
      LIMIT 1
    `).get(ticketId, company.id, company.id);

    if (!ticket) return publicNotFound(res, "Chamado não encontrado");
    if (String(ticket.status || "").toUpperCase() !== "DONE") {
      return res.status(400).json({ ok:false, error:"Só é possível avaliar chamado resolvido" });
    }

    const existing = db.prepare(`
      SELECT id, stars, comment, created_at
      FROM ticket_ratings
      WHERE ticket_id = ? AND company_id = ?
      LIMIT 1
    `).get(ticket.id, company.id);

    if (existing) {
      return res.status(409).json({
        ok:false,
        already_rated:true,
        error:"Este chamado já foi avaliado",
        rating:{ stars:existing.stars, comment:existing.comment || "", created_at:existing.created_at, created_at_br:formatDateBR(existing.created_at) }
      });
    }

    db.prepare(`
      INSERT INTO ticket_ratings (ticket_id, company_id, stars, comment)
      VALUES (?, ?, ?, ?)
    `).run(ticket.id, company.id, stars, comment);

    const rating = db.prepare(`
      SELECT stars, comment, created_at
      FROM ticket_ratings
      WHERE ticket_id = ? AND company_id = ?
      LIMIT 1
    `).get(ticket.id, company.id);

    const ratingPayload = { stars:rating.stars, comment:rating.comment || "", created_at:rating.created_at, created_at_br:formatDateBR(rating.created_at) };

    // Notifica quem resolveu/assumiu o chamado avaliado. A notificação abre o chamado certo pelo ticket_id.
    Promise.resolve(notifyPushTicketRated(ticket.id, ratingPayload)).catch(()=>{});
    try { notifyRealtimeTicketRated(ticket.id, ratingPayload); } catch(_){}

    return res.json({
      ok:true,
      rating: ratingPayload
    });
  } catch (err) {
    if (String(err && err.message || "").includes("UNIQUE")) {
      return res.status(409).json({ ok:false, already_rated:true, error:"Este chamado já foi avaliado" });
    }
    console.error("Erro POST public rating:", err);
    return res.status(500).json({ ok:false, error:"Erro ao salvar avaliação" });
  }
});

app.post("/api/public/tickets", handlePublicTicketPhotoUpload, (req, res) => {
  try {
    const { sector_id, asset_id, issue_type_id, description, opened_by_name, opened_by_phone } = req.body;
    if (req.files && req.files.length > PUBLIC_TICKET_MAX_PHOTOS) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({ ok: false, error: `Máximo de ${PUBLIC_TICKET_MAX_PHOTOS} fotos por chamado.` });
    }
    if (!sector_id) return res.status(400).json({ ok: false, error: "sector_id é obrigatório" });

    const company = getPublicCompanyFromRequest(req);
    if (!company) return publicNotFound(res, "Setor não encontrado");

    const sector = db.prepare(`
      SELECT id, unit_id, name, company_id
      FROM sectors
      WHERE id = ? AND active = 1 AND company_id = ?
      LIMIT 1
    `).get(sector_id, company.id);
    if (!sector) return publicNotFound(res, "Setor não encontrado");

    let selectedAsset = null;
    let selectedAssetId = asset_id || null;
    let selectedServiceId = null;

    // Se o tipo de problema escolhido pertence a um serviço, usa o serviço mesmo que exista asset com o mesmo ID.
    // Isso blinda o QR quando services.id e assets.id colidem.
    let issueServiceIdHint = null;
    if (issue_type_id && tableCols('issue_types').includes('service_id')) {
      try {
        const hint = db.prepare(`
          SELECT service_id
          FROM issue_types
          WHERE id = ? AND active = 1 AND (? IS NULL OR company_id = ?)
          LIMIT 1
        `).get(issue_type_id, sector.company_id, sector.company_id);
        issueServiceIdHint = hint && hint.service_id ? Number(hint.service_id) : null;
      } catch(_){}
    }

    if (asset_id && issueServiceIdHint && Number(asset_id) === issueServiceIdHint) {
      const publicService = getPublicServiceByIdForCompany(issueServiceIdHint, sector.company_id, sector.id);
      if (publicService) {
        selectedAsset = { ...publicService, effective_company_id: sector.company_id, asset_kind: 'SERVICE' };
        selectedServiceId = publicService.service_id || publicService.id;
        selectedAssetId = null;
      }
    }

    if (asset_id && !selectedAsset) {
      selectedAsset = db.prepare(`
        SELECT a.*, COALESCE(a.company_id, s.company_id) AS effective_company_id
        FROM assets a
        LEFT JOIN sectors s ON s.id=a.sector_id
        WHERE a.id = ? AND a.sector_id = ? AND a.status='ACTIVE'
          AND (? IS NULL OR COALESCE(a.company_id, s.company_id) = ?)
      `).get(asset_id, sector.id, sector.company_id, sector.company_id);

      // V149 - se o QR ainda mandar um asset legado marcado como SERVICE,
      // converte para o service.id real da tabela services. Isso evita salvar
      // tickets.service_id com id de assets e resolve o filtro TI/Manutenção/Apoio.
      if (selectedAsset && String(selectedAsset.asset_kind || '').toUpperCase() === 'SERVICE') {
        const mappedService = db.prepare(`
          SELECT sv.id AS service_id, sv.name, sv.category, sv.department, sv.legacy_asset_name
          FROM services sv
          WHERE COALESCE(sv.company_id,0)=COALESCE(?,0)
            AND COALESCE(sv.active,1)=1
            AND (
              UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(?,'')))
              OR UPPER(TRIM(COALESCE(sv.legacy_asset_name,''))) = UPPER(TRIM(COALESCE(?,'')))
              OR UPPER(TRIM(COALESCE(sv.name,''))) = UPPER(TRIM(COALESCE(?,'')))
            )
          ORDER BY sv.id
          LIMIT 1
        `).get(sector.company_id, selectedAsset.name || '', selectedAsset.name || '', selectedAsset.patrimonio || '');
        if (mappedService && mappedService.service_id) {
          selectedAsset = {
            ...selectedAsset,
            ...mappedService,
            id: mappedService.service_id,
            asset_kind: 'SERVICE',
            effective_company_id: sector.company_id
          };
          selectedServiceId = Number(mappedService.service_id);
          selectedAssetId = null;
        }
      }

      // Modelo novo: serviços vêm da tabela services/service_sectors, não da tabela assets.
      // Assim o QR pode abrir chamado de serviço sem precisar criar patrimônio fake.
      if (!selectedAsset) {
        const publicService = getPublicServiceByIdForCompany(Number(asset_id), sector.company_id, sector.id);
        if (publicService) {
          selectedAsset = {
            ...publicService,
            effective_company_id: sector.company_id,
            asset_kind: 'SERVICE'
          };
          selectedServiceId = publicService.service_id || publicService.id;
          selectedAssetId = null;
        }
      }

      if (!selectedAsset) return res.status(404).json({ ok: false, error: "Equipamento/serviço não encontrado neste setor" });
    }

    let priority = "MEDIUM";
    let selectedIssueName = "";
    let selectedIssue = null;

    if (issue_type_id) {
      selectedIssue = db.prepare(`
        SELECT id, asset_name, name, priority${tableCols('issue_types').includes('service_id') ? ', service_id' : ''}${tableCols('issue_types').includes('asset_id') ? ', asset_id' : ''}
        FROM issue_types
        WHERE id = ? AND active = 1 AND (? IS NULL OR company_id = ?)
      `).get(issue_type_id, sector.company_id, sector.company_id);

      if (!selectedIssue) {
        return res.status(404).json({ ok: false, error: "Tipo de problema não encontrado" });
      }

      // Blindagem: o problema escolhido precisa pertencer ao item selecionado,
      // salvo tipos globais com asset_name = GERAL. Isso evita chamado cair em tipo errado.
      if (selectedAsset) {
        const issueAssetKey = normServiceKey(selectedIssue.asset_name);
        const assetKey = normServiceKey(selectedAsset.name);
        const legacyKey = normServiceKey(selectedAsset.legacy_asset_name || '');
        const selectedKind = String(selectedAsset.asset_kind || '').toUpperCase();
        const issueServiceId = Number(selectedIssue.service_id || 0);
        const issueAssetId = Number(selectedIssue.asset_id || 0);
        const selectedService = selectedKind === 'SERVICE' ? Number(selectedServiceId || selectedAsset.service_id || selectedAsset.id || 0) : 0;
        const selectedPhysicalAsset = selectedKind !== 'SERVICE' ? Number(selectedAssetId || selectedAsset.id || 0) : 0;
        const exactOk =
          (issueServiceId && selectedService && issueServiceId === selectedService) ||
          (issueAssetId && selectedPhysicalAsset && issueAssetId === selectedPhysicalAsset);
        const nameOk = issueAssetKey === assetKey || (legacyKey && issueAssetKey === legacyKey) || issueAssetKey === 'GERAL';
        if (!exactOk && !nameOk) {
          return res.status(400).json({ ok:false, error:"Tipo de problema não pertence a este equipamento/serviço" });
        }
      }

      priority = selectedIssue.priority || "MEDIUM";
      selectedIssueName = selectedIssue.name || "";
    }
    const ticketNumber = nextTicketNumberForCompany(sector.company_id);
    const isSelectedService = selectedAsset && String(selectedAsset.asset_kind || '').toUpperCase() === 'SERVICE';
    const hasTicketServiceId = tableCols('tickets').includes('service_id');
    const result = hasTicketServiceId ? db.prepare(`
      INSERT INTO tickets (
        ticket_number, unit_id, sector_id, asset_id, service_id, issue_type_id, description,
        status, priority, opened_by_name, opened_by_phone, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?)
    `).run(
      ticketNumber,
      sector.unit_id,
      sector.id,
      selectedAssetId || null,
      isSelectedService ? (selectedServiceId || asset_id || null) : null,
      issue_type_id || null,
      description || "",
      priority,
      opened_by_name || "",
      opened_by_phone || "",
      sector.company_id || null
    ) : db.prepare(`
      INSERT INTO tickets (
        ticket_number, unit_id, sector_id, asset_id, issue_type_id, description,
        status, priority, opened_by_name, opened_by_phone, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?, ?)
    `).run(
      ticketNumber,
      sector.unit_id,
      sector.id,
      selectedAssetId || null,
      issue_type_id || null,
      description || "",
      priority,
      opened_by_name || "",
      opened_by_phone || "",
      sector.company_id || null
    );

    const ticketId = Number(result.lastInsertRowid);

    // SAAS: mantém ticket_number separado por empresa.
    // Não sobrescreve com id global, pois cada empresa pode ter seu próprio #1, #2, #3...

    const ticket = db.prepare(`SELECT * FROM tickets WHERE id = ?`).get(ticketId);

    if (req.files && req.files.length > 0) {
      const attachmentCols = tableCols('ticket_attachments');
      const hasAttachmentCompany = attachmentCols.includes('company_id');
      const insertAttachment = hasAttachmentCompany ? db.prepare(`
        INSERT INTO ticket_attachments (ticket_id, company_id, file_url, file_type)
        VALUES (?, ?, ?, ?)
      `) : db.prepare(`
        INSERT INTO ticket_attachments (ticket_id, file_url, file_type)
        VALUES (?, ?, ?)
      `);
      for (const file of req.files) {
        if (hasAttachmentCompany) insertAttachment.run(ticketId, sector.company_id || null, `/uploads/${file.filename}`, file.mimetype || "application/octet-stream");
        else insertAttachment.run(ticketId, `/uploads/${file.filename}`, file.mimetype || "application/octet-stream");
      }
    }

    insertTicketLogSafe(ticketId, "TICKET_CREATED", null, `Chamado aberto pelo QR do setor ${sector.name}`, null);

    // V21.1 - dispara aviso no grupo sem travar a abertura do chamado.
    void notifyFacilitiesBot("ticket_created", ticketId);
    void notifyPushTicketCreated(ticketId);
    void notifyRealtimeTicketCreated(ticketId);

    res.status(201).json({
      ok: true,
      message: "Chamado criado com sucesso",
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number || ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
      },
    });
  } catch (err) {
    console.error("Erro POST ticket:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao criar chamado" });
  }
});

// =========================
// ROTAS ADMIN PROTEGIDAS
// =========================

app.get("/api/admin/tickets", requireAuth, (req, res) => {
  try {
    // GF PERFORMANCE V2: lista leve para o painel.
    // Evita trazer histórico completo e anexos de todos os chamados a cada atualização.
    // O detalhe completo continua disponível nas rotas /tickets/:id e /history-smart.
    if (String(req.query.light || '') === '1') {
      const cid = currentCompanyId(req);
      const tickets = db.prepare(`
        SELECT
          t.id,
          t.ticket_number,
          COALESCE(t.status,'NEW') AS status,
          t.priority,
          t.description,
          t.created_at,
          t.updated_at,
          CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
            t.resolved_at,
            (SELECT tl.created_at FROM ticket_logs tl WHERE tl.ticket_id=t.id AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE') ORDER BY tl.created_at DESC, tl.id DESC LIMIT 1)
          ) ELSE NULL END AS resolved_at,
          t.assigned_to_user_id,
          t.final_outcome,
          (
            SELECT tr.stars
            FROM ticket_ratings tr
            WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
            LIMIT 1
          ) AS rating_stars,
          (
            SELECT tr.comment
            FROM ticket_ratings tr
            WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
            LIMIT 1
          ) AS rating_comment,
          (
            SELECT tr.created_at
            FROM ticket_ratings tr
            WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
            LIMIT 1
          ) AS rating_created_at,
          t.technical_observation,
          t.maintenance_value,
          t.maintenance_description,
          t.maintenance_type,
          t.part_name,
          t.supplier_name AS ticket_supplier_name,
          (SELECT COALESCE(SUM(COALESCE(am.cost,0)),0) FROM asset_maintenance am WHERE am.ticket_id=t.id) AS ticket_maintenance_total,
          t.asset_id,
          s.name AS sector_name,
          ${ticketServiceSelectFields()}
          i.name AS issue_name,
          COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
          (
            SELECT tl.notes
            FROM ticket_logs tl
            WHERE tl.ticket_id=t.id
              AND tl.action='PUBLIC_NOTE'
              AND COALESCE(TRIM(tl.notes),'') <> ''
            ORDER BY datetime(COALESCE(tl.created_at, t.updated_at, t.created_at)) DESC, tl.id DESC
            LIMIT 1
          ) AS public_note,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id=t.id
              AND tl.action='PUBLIC_NOTE'
              AND COALESCE(TRIM(tl.notes),'') <> ''
            ORDER BY datetime(COALESCE(tl.created_at, t.updated_at, t.created_at)) DESC, tl.id DESC
            LIMIT 1
          ) AS public_note_at,
          (
            SELECT COALESCE(NULLIF(u2.display_name,''), u2.name)
            FROM ticket_logs tl
            LEFT JOIN users u2 ON u2.id=tl.user_id
            WHERE tl.ticket_id=t.id
              AND tl.action='PUBLIC_NOTE'
              AND COALESCE(TRIM(tl.notes),'') <> ''
            ORDER BY datetime(COALESCE(tl.created_at, t.updated_at, t.created_at)) DESC, tl.id DESC
            LIMIT 1
          ) AS public_note_by_name,
          NULL AS solution_note,
          '[]' AS attachments,
          '[]' AS logs
        FROM tickets t
        JOIN sectors s ON s.id = t.sector_id
        LEFT JOIN assets a ON a.id = t.asset_id
        ${ticketServiceJoinSql('t')}
        LEFT JOIN issue_types i ON i.id = t.issue_type_id
        LEFT JOIN users u ON u.id = t.assigned_to_user_id
        WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
        ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
        LIMIT 500
      `).all(cid, cid);
      const stats = db.prepare(`
        SELECT
          SUM(CASE WHEN effective_status='NEW' THEN 1 ELSE 0 END) AS open,
          SUM(CASE WHEN effective_status='IN_PROGRESS' THEN 1 ELSE 0 END) AS progress,
          SUM(CASE WHEN effective_status='DONE' THEN 1 ELSE 0 END) AS done,
          SUM(CASE WHEN effective_status<>'DONE' AND datetime(created_at) <= datetime('now','-2 days') THEN 1 ELSE 0 END) AS critical
        FROM (
          SELECT CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS effective_status, t.created_at
          FROM tickets t
          JOIN sectors s ON s.id = t.sector_id
          WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
        ) x
      `).get(cid, cid) || {};
      res.setHeader('Cache-Control','private, max-age=3');
      gfShortenTicketListNames(tickets);
      return res.json({ok:true,tickets,pagination:{limit:tickets.length,offset:0,total:tickets.length,has_more:false},stats:{open:Number(stats.open||0),progress:Number(stats.progress||0),critical:Number(stats.critical||0),done:Number(stats.done||0)}});
    }
    const tickets = db.prepare(`
      SELECT 
        t.id,
        t.ticket_number,
        COALESCE(t.status,'NEW') AS status,
        t.priority,
        t.description,
        t.created_at,
        t.updated_at,
CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
          t.resolved_at,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id = t.id
              AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE')
            ORDER BY tl.created_at DESC, tl.id DESC
            LIMIT 1
          )
        ) ELSE NULL END AS resolved_at,
        t.assigned_to_user_id,
        t.final_outcome,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_created_at,
        t.technical_observation,
        t.maintenance_value,
        t.maintenance_description,
        t.maintenance_type,
        t.part_name,
        t.supplier_name AS ticket_supplier_name,
        (SELECT COALESCE(SUM(COALESCE(am.cost,0)),0) FROM asset_maintenance am WHERE am.ticket_id=t.id) AS ticket_maintenance_total,
        t.asset_id,
        s.name AS sector_name,
        ${ticketServiceSelectFields()}
                i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='RESOLUTION_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS solution_note,
        (
          SELECT json_group_array(json_object('id', ta.id, 'file_url', ta.file_url, 'file_type', ta.file_type))
          FROM ticket_attachments ta
          WHERE ta.ticket_id = t.id
        ) AS attachments,
        (
          SELECT json_group_array(json_object(
            'id', x.id,
            'action', x.action,
            'notes', x.notes,
            'created_at', x.created_at,
            'user_name', x.user_name
          ))
          FROM (
            SELECT tl.id, tl.action, tl.notes, tl.created_at, COALESCE(NULLIF(usr.display_name,''), usr.name) AS user_name
            FROM ticket_logs tl
            LEFT JOIN users usr ON usr.id = tl.user_id
            WHERE tl.ticket_id = t.id
            ORDER BY tl.created_at ASC, tl.id ASC
          ) x
        ) AS logs
      FROM tickets t
      JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
      ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
      ${req.query.limit ? 'LIMIT ? OFFSET ?' : ''}
    `).all(...(() => {
      const cid = currentCompanyId(req);
      if (!req.query.limit) return [cid, cid];
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      return [cid, cid, limit, offset];
    })());

    const cid = currentCompanyId(req);
    const totalRow = db.prepare(`
      SELECT COUNT(1) AS total
      FROM tickets t
      JOIN sectors s ON s.id = t.sector_id
      WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
    `).get(cid, cid) || { total: 0 };

    const stats = db.prepare(`
      SELECT
        SUM(CASE WHEN effective_status='NEW' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN effective_status='IN_PROGRESS' THEN 1 ELSE 0 END) AS progress,
        SUM(CASE WHEN effective_status='DONE' THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN effective_status<>'DONE' AND datetime(created_at) <= datetime('now','-2 days') THEN 1 ELSE 0 END) AS critical
      FROM (
        SELECT
          CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS effective_status,
          t.created_at
        FROM tickets t
        JOIN sectors s ON s.id = t.sector_id
        WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id)=?)
      ) x
    `).get(cid, cid) || {};

    gfShortenTicketListNames(tickets);
    res.json({
      ok: true,
      tickets,
      pagination: {
        limit: req.query.limit ? Math.min(Math.max(Number(req.query.limit) || 10, 1), 100) : tickets.length,
        offset: req.query.limit ? Math.max(Number(req.query.offset) || 0, 0) : 0,
        total: Number(totalRow.total || tickets.length),
        has_more: req.query.limit ? (Math.max(Number(req.query.offset) || 0, 0) + tickets.length < Number(totalRow.total || 0)) : false
      },
      stats: {
        open: Number(stats.open || 0),
        progress: Number(stats.progress || 0),
        critical: Number(stats.critical || 0),
        done: Number(stats.done || 0)
      }
    });
  } catch (err) {
    console.error("Erro GET admin tickets:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao buscar chamados" });
  }
});



// =========================
// V20.3 - EXPORTAÇÃO DASHBOARD/CHAMADOS (EXCEL + PDF/IMPRESSÃO)
// Não altera rotas antigas. Usa dados das rotas/tabelas atuais e inclui links dos anexos/fotos.
// =========================
function gfExportEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gfExportAbsoluteUrl(req, fileUrl) {
  const raw = String(fileUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
  return base + (raw.startsWith('/') ? raw : '/' + raw);
}

function gfExportStatusLabel(status) { return statusLabelBR(status); }
function gfExportPriorityLabel(priority) {
  const p = String(priority || '').toUpperCase();
  if (p === 'HIGH') return 'Alta';
  if (p === 'LOW') return 'Baixa';
  return 'Média';
}

function gfExportParseAttachments(value, req) {
  try {
    const arr = JSON.parse(value || '[]');
    return (Array.isArray(arr) ? arr : [])
      .map(a => gfExportAbsoluteUrl(req, a.file_url || a.url || ''))
      .filter(Boolean);
  } catch (_) { return []; }
}

function gfExportTicketsRows(req) {
  const start = String(req.query.start || '').trim();
  const end = String(req.query.end || '').trim();
  const mode = String(req.query.mode || '').trim().toUpperCase();
  const cid = currentCompanyId(req);

  const rows = db.prepare(`
    SELECT
      t.id,
      COALESCE(t.ticket_number, t.id) AS ticket_number,
      CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS status,
      t.priority,
      t.description,
      t.created_at,
      t.updated_at,
      t.resolved_at,
      t.opened_by_name,
      t.opened_by_phone,
      t.final_outcome,
      t.technical_observation,
      t.maintenance_value,
      t.maintenance_description,
      t.part_name,
      t.supplier_name AS maintenance_supplier_name,
      s.name AS sector_name,
      a.patrimonio,
      a.name AS asset_name,
      a.brand AS asset_brand,
      a.model AS asset_model,
      a.sp_responsavel AS asset_sp_responsavel,
      a.sp_local AS asset_sp_local,
      a.sp_identificacao AS asset_sp_identificacao,
      i.name AS issue_name,
      COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
      (
        SELECT notes
        FROM ticket_logs tl
        WHERE tl.ticket_id=t.id
          AND tl.action='RESOLUTION_NOTE'
          AND COALESCE(TRIM(tl.notes),'') <> ''
        ORDER BY tl.created_at DESC, tl.id DESC
        LIMIT 1
      ) AS solution_note,
      (
        SELECT json_group_array(json_object('id', ta.id, 'file_url', ta.file_url, 'file_type', ta.file_type))
        FROM ticket_attachments ta
        WHERE ta.ticket_id = t.id
      ) AS attachments
    FROM tickets t
    JOIN sectors s ON s.id=t.sector_id
    JOIN companies c ON c.id = COALESCE(t.company_id, s.company_id)
    LEFT JOIN assets a ON a.id=t.asset_id
    LEFT JOIN issue_types i ON i.id=t.issue_type_id
    LEFT JOIN users u ON u.id=t.assigned_to_user_id
    WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id,a.company_id)=?)
    ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
  `).all(cid, cid);

  return rows.filter(r => {
    if (mode === 'ALL') return true;
    const key = dayKeyBR(r.created_at);
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  });
}

function gfExportPeriodLabel(req) {
  const start = String(req.query.start || '').trim();
  const end = String(req.query.end || '').trim();
  const mode = String(req.query.mode || '').trim().toUpperCase();
  const br = v => v ? v.split('-').reverse().join('/') : '';
  if (mode === 'ALL' || (!start && !end)) return 'Todos os chamados';
  if (start && end && start === end) return br(start);
  return `${br(start)} até ${br(end)}`;
}

function gfExportTicketTableHtml(rows, req, compact = false) {
  const headers = [
    'Chamado', 'Status', 'Prioridade', 'Setor', 'Patrimônio', 'Equipamento', 'Marca', 'Modelo',
    'Problema', 'Descrição', 'Solicitante', 'Telefone', 'Responsável', 'Criado em', 'Atualizado em',
    'Resolvido em', 'Resultado final', 'Solução/observação', 'Valor manutenção', 'Peça', 'Fornecedor', 'Links das fotos/anexos'
  ];
  const body = rows.map(r => {
    const links = gfExportParseAttachments(r.attachments, req);
    const linkHtml = links.length
      ? links.map((url, idx) => `<a href="${gfExportEscape(url)}">Anexo ${idx + 1}</a>`).join('<br>')
      : '';
    const vals = [
      `#${r.ticket_number || r.id}`,
      gfExportStatusLabel(r.status),
      gfExportPriorityLabel(r.priority),
      r.sector_name,
      r.patrimonio || r.asset_sp_identificacao || 'Sem patrimônio',
      r.asset_name,
      r.asset_brand,
      r.asset_model,
      r.issue_name,
      r.description,
      r.opened_by_name,
      r.opened_by_phone,
      r.assigned_to_name || 'Área administrativa',
      formatDateBR(r.created_at),
      formatDateBR(r.updated_at),
      formatDateBR(r.resolved_at),
      finalOutcomeLabelBR(r.final_outcome || 'RESOLVED'),
      r.solution_note || r.technical_observation,
      r.maintenance_value ? Number(r.maintenance_value).toFixed(2).replace('.', ',') : '',
      r.part_name,
      r.maintenance_supplier_name,
      linkHtml
    ];
    return '<tr>' + vals.map((v, idx) => idx === vals.length - 1 ? `<td>${v}</td>` : `<td>${gfExportEscape(v)}</td>`).join('') + '</tr>';
  }).join('');
  return `<table><thead><tr>${headers.map(h => `<th>${gfExportEscape(h)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}">Sem dados no período.</td></tr>`}</tbody></table>`;
}


function gfExportTicketCardsHtml(rows, req) {
  if (!rows.length) return '<div class="emptyPdf">Sem dados no período.</div>';
  return rows.map(r => {
    const links = gfExportParseAttachments(r.attachments, req);
    const linkHtml = links.length
      ? links.map((url, idx) => `<a href="${gfExportEscape(url)}" target="_blank">Anexo ${idx + 1}</a>`).join(' &nbsp;•&nbsp; ')
      : '<span class="mutedText">Sem anexos</span>';
    const problem = [r.issue_name, r.description].filter(Boolean).join(' — ');
    const solution = r.solution_note || r.technical_observation || '';
    const money = r.maintenance_value ? 'R$ ' + Number(r.maintenance_value).toFixed(2).replace('.', ',') : '-';
    return `
      <section class="ticketCardPdf">
        <div class="ticketTopPdf">
          <div><strong>#${gfExportEscape(r.ticket_number || r.id)}</strong><span>${gfExportEscape(gfExportStatusLabel(r.status))}</span><span>${gfExportEscape(gfExportPriorityLabel(r.priority))}</span></div>
          <small>Atualizado: ${gfExportEscape(formatDateBR(r.updated_at))}</small>
        </div>
        <div class="pdfGrid">
          <div><b>Setor</b><p>${gfExportEscape(r.sector_name)}</p></div>
          <div><b>Patrimônio</b><p>${gfExportEscape(r.patrimonio || r.asset_sp_identificacao || 'Sem patrimônio')}</p></div>
          <div><b>Equipamento</b><p>${gfExportEscape(r.asset_name || '-')}</p></div>
          <div><b>Marca / Modelo</b><p>${gfExportEscape([r.asset_brand, r.asset_model].filter(Boolean).join(' / ') || '-')}</p></div>
          <div><b>Solicitante</b><p>${gfExportEscape(r.opened_by_name || '-')}</p></div>
          <div><b>Responsável</b><p>${gfExportEscape(r.assigned_to_name || 'Área administrativa')}</p></div>
          <div><b>Criado em</b><p>${gfExportEscape(formatDateBR(r.created_at))}</p></div>
          <div><b>Resolvido em</b><p>${gfExportEscape(formatDateBR(r.resolved_at) || '-')}</p></div>
        </div>
        <div class="pdfBlock"><b>Problema / descrição</b><p>${gfExportEscape(problem || '-')}</p></div>
        <div class="pdfGrid three">
          <div><b>Resultado final</b><p>${gfExportEscape(finalOutcomeLabelBR(r.final_outcome || 'RESOLVED'))}</p></div>
          <div><b>Valor manutenção</b><p>${gfExportEscape(money)}</p></div>
          <div><b>Peça / fornecedor</b><p>${gfExportEscape([r.part_name, r.maintenance_supplier_name].filter(Boolean).join(' / ') || '-')}</p></div>
        </div>
        <div class="pdfBlock"><b>Solução / observação</b><p>${gfExportEscape(solution || '-')}</p></div>
        <div class="pdfBlock links"><b>Fotos / anexos</b><p>${linkHtml}</p></div>
      </section>`;
  }).join('');
}

function gfCsvEscape(value) {
  const text = String(value == null ? '' : value).replace(/\r?\n/g, ' ').trim();
  return '"' + text.replace(/"/g, '""') + '"';
}

function gfExportTicketsCsv(rows, req, period) {
  const headers = [
    'Chamado','Status','Prioridade','Setor','Patrimônio','Equipamento','Marca','Modelo',
    'Problema','Descrição','Solicitante','Telefone','Responsável','Criado em','Atualizado em',
    'Resolvido em','Resultado final','Solução/observação','Valor manutenção','Peça','Fornecedor','Links das fotos/anexos'
  ];
  const lines = [];
  // Ajuda o Excel em PT-BR a abrir separado em colunas, sem alerta de formato/extensão.
  lines.push('sep=;');
  lines.push(headers.map(gfCsvEscape).join(';'));
  for (const r of rows) {
    const links = gfExportParseAttachments(r.attachments, req).join(' | ');
    const vals = [
      '#' + (r.ticket_number || r.id),
      gfExportStatusLabel(r.status),
      gfExportPriorityLabel(r.priority),
      r.sector_name,
      r.patrimonio || r.asset_sp_identificacao || 'Sem patrimônio',
      r.asset_name,
      r.asset_brand,
      r.asset_model,
      r.issue_name,
      r.description,
      r.opened_by_name,
      r.opened_by_phone,
      r.assigned_to_name || 'Área administrativa',
      formatDateBR(r.created_at),
      formatDateBR(r.updated_at),
      formatDateBR(r.resolved_at),
      finalOutcomeLabelBR(r.final_outcome || 'RESOLVED'),
      r.solution_note || r.technical_observation,
      r.maintenance_value ? Number(r.maintenance_value).toFixed(2).replace('.', ',') : '',
      r.part_name,
      r.maintenance_supplier_name,
      links
    ];
    lines.push(vals.map(gfCsvEscape).join(';'));
  }
  if (!rows.length) lines.push(gfCsvEscape('Sem dados no período.') + ';'.repeat(headers.length - 1));
  return '\ufeff' + lines.join('\r\n');
}


function gfExcelText(value) {
  return String(value == null ? '' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


// V20.6 - XLSX real, sem alerta do Excel.
// Não usa pacote externo e mantém a mesma rota /api/admin/export/tickets-excel.
function gfXlsxXmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
}

function gfXlsxColName(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function gfXlsxCrcTable() {
  if (global.__gfXlsxCrcTable) return global.__gfXlsxCrcTable;
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  global.__gfXlsxCrcTable = table;
  return table;
}

function gfXlsxCrc32(buf) {
  const table = gfXlsxCrcTable();
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ (-1)) >>> 0;
}

function gfXlsxZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(String(file.data), 'utf8');
    const crc = gfXlsxCrc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8
    local.writeUInt16LE(0, 8); // sem compressão para máxima compatibilidade
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}


// V51 - Nome da empresa nas exportações (Excel/PDF), sem texto fixo Guará.
function gfExportCompanyName(req){
  try {
    const cid = currentCompanyId(req);
    if (cid) {
      const c = db.prepare(`SELECT name FROM companies WHERE id=? LIMIT 1`).get(cid);
      if (c && String(c.name || '').trim()) return String(c.name).trim();
    }

    const slug = getRequestedCompanySlug(req);
    if (slug) {
      const c = db.prepare(`SELECT name FROM companies WHERE slug=? LIMIT 1`).get(slug);
      if (c && String(c.name || '').trim()) return String(c.name).trim();
    }

    const userCompanyId = Number(req?.user?.company_id || req?.user?.session_company_id || 0);
    if (userCompanyId) {
      const c = db.prepare(`SELECT name FROM companies WHERE id=? LIMIT 1`).get(userCompanyId);
      if (c && String(c.name || '').trim()) return String(c.name).trim();
    }
  } catch(_){}
  return 'Empresa';
}

function gfExportFileSlug(req){
  return gfExportCompanyName(req)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'empresa';
}

function gfExportTicketsXlsx(rows, req, period) {
  const exportCompanyName = gfExportCompanyName(req);
  const exportCompanyXml = gfXlsxXmlEscape(exportCompanyName);
  const headers = [
    'Chamado','Status','Prioridade','Setor','Patrimônio','Equipamento','Marca','Modelo',
    'Problema','Descrição','Solicitante','Telefone','Responsável','Criado em','Atualizado em',
    'Resolvido em','Resultado final','Solução/observação','Valor manutenção','Peça','Fornecedor','Links das fotos/anexos'
  ];

  const bodyRows = rows.map(r => {
    const links = gfExportParseAttachments(r.attachments, req).join('\n');
    return [
      '#' + (r.ticket_number || r.id),
      gfExportStatusLabel(r.status),
      gfExportPriorityLabel(r.priority),
      r.sector_name,
      r.patrimonio || r.asset_sp_identificacao || 'Sem patrimônio',
      r.asset_name,
      r.asset_brand,
      r.asset_model,
      r.issue_name,
      r.description,
      r.opened_by_name,
      r.opened_by_phone,
      r.assigned_to_name || 'Área administrativa',
      formatDateBR(r.created_at),
      formatDateBR(r.updated_at),
      formatDateBR(r.resolved_at),
      finalOutcomeLabelBR(r.final_outcome || 'RESOLVED'),
      r.solution_note || r.technical_observation,
      r.maintenance_value ? Number(r.maintenance_value).toFixed(2).replace('.', ',') : '',
      r.part_name,
      r.maintenance_supplier_name,
      links
    ];
  });

  if (!bodyRows.length) bodyRows.push(['Sem dados no período.']);
  const allRows = [headers, ...bodyRows];
  const maxCols = headers.length;

  const sheetRows = allRows.map((row, rIdx) => {
    const cells = [];
    for (let cIdx = 0; cIdx < maxCols; cIdx++) {
      const ref = gfXlsxColName(cIdx + 1) + (rIdx + 1);
      const value = row[cIdx] == null ? '' : String(row[cIdx]);
      const style = rIdx === 0 ? 1 : 0;
      cells.push(`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${gfXlsxXmlEscape(value)}</t></is></c>`);
    }
    return rIdx === 0
      ? `<row r="1" ht="24" customHeight="1">${cells.join('')}</row>`
      : `<row r="${rIdx + 1}">${cells.join('')}</row>`;
  }).join('');

  const cols = headers.map((_, idx) => {
    const w = idx === 9 || idx === 17 || idx === 21 ? 42 : (idx === 5 ? 24 : 18);
    return `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`;
  }).join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${gfXlsxColName(maxCols)}${allRows.length}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A1:${gfXlsxColName(maxCols)}${allRows.length}"/>
</worksheet>`;

  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>` },
    { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Relatório de Chamados - ${exportCompanyXml}</dc:title><dc:creator>${exportCompanyXml}</dc:creator><cp:lastModifiedBy>${exportCompanyXml}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified></cp:coreProperties>` },
    { name: 'docProps/app.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>${exportCompanyXml}</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>${exportCompanyXml}</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>20.7</AppVersion></Properties>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Chamados" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF073763"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml }
  ];

  return gfXlsxZip(files);
}

function gfExportTicketsExcelHtml(rows, req, period) {
  const exportCompanyName = gfExportCompanyName(req);
  const exportCompanyHtml = gfExportEscape(exportCompanyName);
  const headers = [
    'Chamado','Status','Prioridade','Setor','Patrimônio','Equipamento','Marca','Modelo',
    'Problema','Descrição','Solicitante','Telefone','Responsável','Criado em','Atualizado em',
    'Resolvido em','Resultado final','Solução/observação','Valor manutenção','Peça','Fornecedor','Links das fotos/anexos'
  ];
  const trs = rows.map(r => {
    const links = gfExportParseAttachments(r.attachments, req);
    const linkCell = links.length
      ? links.map((url, idx) => `<a href="${gfExportEscape(url)}">Anexo ${idx + 1}</a>`).join(' | ')
      : '';
    const vals = [
      '#' + (r.ticket_number || r.id),
      gfExportStatusLabel(r.status),
      gfExportPriorityLabel(r.priority),
      r.sector_name,
      r.patrimonio || r.asset_sp_identificacao || 'Sem patrimônio',
      r.asset_name,
      r.asset_brand,
      r.asset_model,
      r.issue_name,
      r.description,
      r.opened_by_name,
      r.opened_by_phone,
      r.assigned_to_name || 'Área administrativa',
      formatDateBR(r.created_at),
      formatDateBR(r.updated_at),
      formatDateBR(r.resolved_at),
      finalOutcomeLabelBR(r.final_outcome || 'RESOLVED'),
      r.solution_note || r.technical_observation,
      r.maintenance_value ? Number(r.maintenance_value).toFixed(2).replace('.', ',') : '',
      r.part_name,
      r.maintenance_supplier_name
    ];
    return '<tr>' + vals.map(v => `<td style="mso-number-format:'\\@';">${gfExportEscape(gfExcelText(v))}</td>`).join('') + `<td>${linkCell}</td></tr>`;
  }).join('') || `<tr><td colspan="${headers.length}">Sem dados no período.</td></tr>`;

  return '\ufeff' + `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=UTF-8">
  <title>Relatório de Chamados - ${exportCompanyHtml}</title>
  <style>
    table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;color:#06123a}
    th{background:#073763;color:#fff;font-weight:900;border:1px solid #b8c7da;padding:8px;white-space:nowrap}
    td{border:1px solid #d6e2f0;padding:7px;vertical-align:top;mso-number-format:'\\@';}
    a{color:#0b66b2;font-weight:800;text-decoration:underline}
    .meta{font-family:Arial,sans-serif;margin-bottom:12px;color:#06123a;font-weight:800}
  </style>
</head>
<body>
  <div class="meta">${exportCompanyHtml} - Relatório de chamados<br>Período: ${gfExportEscape(period)} | Total: ${rows.length} | Gerado em: ${gfExportEscape(formatDateBR(new Date()))}</div>
  <table>
    <thead><tr>${headers.map(h => `<th>${gfExportEscape(h)}</th>`).join('')}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</body>
</html>`;
}

app.get('/api/admin/export/tickets-excel', requireAuth, (req, res) => {
  try {
    const rows = gfExportTicketsRows(req);
    const period = gfExportPeriodLabel(req);
    const buffer = gfExportTicketsXlsx(rows, req, period);
    // XLSX real: remove o aviso do Excel de formato/extensão e mantém acentos em UTF-8.
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${gfExportFileSlug(req)}-chamados.xlsx"`);
    res.end(buffer);
  } catch (err) {
    console.error('Erro export Excel:', err);
    res.status(500).json({ ok:false, error:'Erro ao exportar Excel' });
  }
});

app.get('/api/admin/export/tickets-pdf', requireAuth, (req, res) => {
  try {
    const rows = gfExportTicketsRows(req);
    const period = gfExportPeriodLabel(req);
    const exportCompanyName = gfExportCompanyName(req);
    const exportCompanyHtml = gfExportEscape(exportCompanyName);
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Chamados - ${exportCompanyHtml}</title><style>@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#06123a;margin:0;background:#eef3f8}.pagePdf{max-width:980px;margin:0 auto;background:#fff;min-height:100vh;padding:22px}.head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:4px solid #073763;padding-bottom:14px;margin-bottom:16px}h1{font-size:24px;margin:0;line-height:1.1}.muted{color:#526783;font-weight:800;font-size:13px;margin-top:6px}.print{border:0;border-radius:14px;background:#073763;color:#fff;padding:12px 16px;font-weight:900;cursor:pointer;white-space:nowrap}.ticketCardPdf{border:1px solid #d6e2f0;border-radius:18px;padding:14px;margin:0 0 14px;background:#fff;break-inside:avoid;page-break-inside:avoid}.ticketTopPdf{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#f4f8fd;border:1px solid #e0e9f5;border-radius:14px;padding:10px 12px;margin-bottom:12px}.ticketTopPdf strong{font-size:18px;margin-right:8px}.ticketTopPdf span{display:inline-flex;border-radius:999px;background:#e9f0ff;color:#2457d6;padding:5px 9px;font-size:12px;font-weight:900;margin-right:4px}.ticketTopPdf small{color:#526783;font-weight:900}.pdfGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}.pdfGrid.three{grid-template-columns:1fr 1fr 1fr}.pdfGrid>div,.pdfBlock{border:1px solid #e0e9f5;border-radius:12px;padding:9px;background:#fbfdff}b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:#60708c;margin-bottom:4px}p{margin:0;font-size:13px;line-height:1.35;font-weight:800;color:#06123a;word-break:break-word}.pdfBlock{margin-bottom:10px}.pdfBlock p{font-weight:700}.links a{color:#0b66b2;font-weight:900;text-decoration:underline}.mutedText{color:#7a879d;font-weight:800}.emptyPdf{border:1px dashed #d6e2f0;border-radius:18px;padding:28px;text-align:center;color:#60708c;font-weight:900}@media(max-width:700px){.pagePdf{padding:14px}.head{flex-direction:column}.print{width:100%}.pdfGrid,.pdfGrid.three{grid-template-columns:1fr 1fr}.ticketTopPdf{align-items:flex-start;flex-direction:column}}@media print{body{background:#fff}.pagePdf{max-width:none;min-height:0;padding:0}.print{display:none}.ticketCardPdf{border-color:#b8c7da;margin-bottom:10px}.head{break-after:avoid}.pdfGrid>div,.pdfBlock,.ticketTopPdf{background:#fff}a{color:#000}}</style></head><body><main class="pagePdf"><div class="head"><div><h1>${exportCompanyHtml} - Relatório de chamados</h1><div class="muted">Período: ${gfExportEscape(period)} • Total: ${rows.length} • Gerado em ${gfExportEscape(formatDateBR(new Date()))}</div></div><button class="print" onclick="window.print()">Salvar / Imprimir PDF</button></div>${gfExportTicketCardsHtml(rows, req)}<script>document.title='Relatório de Chamados - ${exportCompanyHtml}';setTimeout(()=>window.print(),650)</script></main></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Erro export PDF:', err);
    res.status(500).json({ ok:false, error:'Erro ao exportar PDF' });
  }
});

// V14.0 - ROTA ROBUSTA PARA ABRIR CHAMADO POR ID OU NÚMERO
// Mantém /api/admin/tickets antigo e adiciona busca direta usada pelo painel.
function getTicketDetailByKey(key, req) {
  const raw = String(key || '').trim().replace(/^#/, '');
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  return db.prepare(`
      SELECT 
        t.id,
        COALESCE(t.ticket_number, t.id) AS ticket_number,
        CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS status,
        t.priority,
        t.description,
        t.created_at,
        t.updated_at,
CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
          t.resolved_at,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id = t.id
              AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE')
            ORDER BY tl.created_at DESC, tl.id DESC
            LIMIT 1
          )
        ) ELSE NULL END AS resolved_at,
        t.assigned_to_user_id,
        t.final_outcome,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_created_at,
        t.technical_observation,
        t.asset_id,
        s.name AS sector_name,
        ${ticketServiceSelectFields()}
        i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='RESOLUTION_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS solution_note,
        (
          SELECT json_group_array(json_object('id', ta.id, 'file_url', ta.file_url, 'file_type', ta.file_type))
          FROM ticket_attachments ta
          WHERE ta.ticket_id = t.id
        ) AS attachments,
        (
          SELECT json_group_array(json_object(
            'id', x.id,
            'action', x.action,
            'notes', x.notes,
            'created_at', x.created_at,
            'user_name', x.user_name
          ))
          FROM (
            SELECT tl.id, tl.action, tl.notes, tl.created_at, COALESCE(NULLIF(usr.display_name,''), usr.name) AS user_name
            FROM ticket_logs tl
            LEFT JOIN users usr ON usr.id = tl.user_id
            WHERE tl.ticket_id = t.id
            ORDER BY tl.created_at ASC, tl.id ASC
          ) x
        ) AS logs
      FROM tickets t
      JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      WHERE ((t.ticket_number = ?) OR (t.id = ? AND NOT EXISTS (
          SELECT 1 FROM tickets tx
          WHERE tx.ticket_number = ?
            AND (? IS NULL OR tx.company_id = ?)
        )))
        AND (? IS NULL OR COALESCE(t.company_id,s.company_id,a.company_id)=?)
      ORDER BY CASE WHEN t.ticket_number = ? THEN 0 ELSE 1 END, t.id DESC
      LIMIT 1
    `).get(
      numeric,
      numeric,
      numeric,
      req ? currentCompanyId(req) : null,
      req ? currentCompanyId(req) : null,
      req ? currentCompanyId(req) : null,
      req ? currentCompanyId(req) : null,
      numeric
    );
}

function sendTicketByKey(req, res) {
  try {
    const ticket = getTicketDetailByKey(req.params.id || req.params.key, req);
    if (!ticket) return res.status(404).json({ ok: false, error: "Chamado não encontrado" });
    gfShortenTicketPersonNames(ticket);
    return res.json({ ok: true, ticket });
  } catch (err) {
    console.error("Erro GET ticket detalhe:", err);
    return res.status(500).json({ ok: false, error: "Erro interno ao abrir chamado" });
  }
}


// V50 - rota exata por ID interno do banco.
// Evita abrir chamado errado quando id interno e ticket_number têm o mesmo número.
function getTicketDetailByDbId(dbId, req) {
  const numeric = Number(dbId);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return db.prepare(`
      SELECT 
        t.id,
        COALESCE(t.ticket_number, t.id) AS ticket_number,
        CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS status,
        t.priority,
        t.description,
        t.created_at,
        t.updated_at,
CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
          t.resolved_at,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id = t.id
              AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE')
            ORDER BY tl.created_at DESC, tl.id DESC
            LIMIT 1
          )
        ) ELSE NULL END AS resolved_at,
        t.assigned_to_user_id,
        t.final_outcome,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_created_at,
        t.technical_observation,
        t.asset_id,
        s.name AS sector_name,
        ${ticketServiceSelectFields()}
        i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='RESOLUTION_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS solution_note,
        (
          SELECT json_group_array(json_object('id', ta.id, 'file_url', ta.file_url, 'file_type', ta.file_type))
          FROM ticket_attachments ta
          WHERE ta.ticket_id = t.id
        ) AS attachments,
        (
          SELECT json_group_array(json_object(
            'id', x.id,
            'action', x.action,
            'notes', x.notes,
            'created_at', x.created_at,
            'user_name', x.user_name
          ))
          FROM (
            SELECT tl.id, tl.action, tl.notes, tl.created_at, COALESCE(NULLIF(usr.display_name,''), usr.name) AS user_name
            FROM ticket_logs tl
            LEFT JOIN users usr ON usr.id = tl.user_id
            WHERE tl.ticket_id = t.id
            ORDER BY tl.created_at ASC, tl.id ASC
          ) x
        ) AS logs
      FROM tickets t
      JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      WHERE t.id = ?
        AND (? IS NULL OR COALESCE(t.company_id,s.company_id,a.company_id)=?)
      LIMIT 1
    `).get(numeric, req ? currentCompanyId(req) : null, req ? currentCompanyId(req) : null);
}

app.get("/api/admin/tickets/by-db-id/:id", requireAuth, (req, res) => {
  try {
    const ticket = getTicketDetailByDbId(req.params.id, req);
    if (!ticket) return res.status(404).json({ ok:false, error:"Chamado não encontrado" });
    gfShortenTicketPersonNames(ticket);
    return res.json({ ok:true, ticket });
  } catch (err) {
    console.error("Erro GET ticket por ID interno:", err);
    return res.status(500).json({ ok:false, error:"Erro interno ao abrir chamado" });
  }
});

app.get("/api/admin/ticket/:key", requireAuth, sendTicketByKey);
app.get("/api/admin/tickets/by-key/:key", requireAuth, sendTicketByKey);
app.get("/api/admin/tickets/:id", requireAuth, sendTicketByKey);


app.post("/api/admin/tickets/:id/status", requireAuth, requireTicketHandler, upload.single("resolution_photo"), (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { status } = req.body;
    const solutionText = normalizeSolutionText(req.body);
    let finalOutcome = normalizeFinalOutcome(req.body);
    const maintenance = normalizeMaintenanceFinance(req.body);

    const allowed = ["NEW", "IN_PROGRESS", "DONE", "CANCELED"];
    if (!allowed.includes(status)) return res.status(400).json({ ok: false, error: "Status inválido" });

    const cid = currentCompanyId(req);
    const ticket = db.prepare(`
      SELECT t.id, t.status, t.assigned_to_user_id, t.resolved_at, t.asset_id, t.final_outcome,
             COALESCE(t.company_id, s.company_id) AS company_id
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      WHERE t.id = ?
        AND (? IS NULL OR COALESCE(t.company_id, s.company_id) = ?)
      LIMIT 1
    `).get(ticketId, cid, cid);

    if (!ticket) return res.status(404).json({ ok: false, error: "Chamado não encontrado" });

    // V152: impede serviço de cair em Sem reparo/Baixado/Troca por cache ou front antigo.
    finalOutcome = finalOutcomeSafeForTicket(req.body, ticketId, req);

    const isTechFinalizingDone = status === "DONE" && isTechUser(req.user) && finalOutcome !== "SWAP";
    if (isTechFinalizingDone && !req.file) {
      return res.status(400).json({ ok: false, error: "Perfil técnico precisa anexar 1 foto da resolução para finalizar o chamado" });
    }
    let resolutionPhotoSaved = false;
    function saveResolutionPhotoOnce() {
      if (!req.file || resolutionPhotoSaved) return null;
      resolutionPhotoSaved = true;
      return saveTicketResolutionPhoto(ticketId, req.file, req);
    }

    if (status === "DONE") {
      const finalizeError = assertTicketCanBeFinalizedByCurrentUser(req, ticket);
      if (finalizeError) return res.status(403).json({ ok: false, error: finalizeError });
    }

    // Se já está resolvido e mandaram uma solução nova, salva como complemento sem duplicar resolução.
    if (ticket.status === status) {
      if (status === "IN_PROGRESS" && ticket.assigned_to_user_id) {
        return res.json({ ok: true, ignored: true, message: "Chamado já está em andamento" });
      }

      if (status === "DONE") {
        if (solutionText) {
          // V10.15 - regra correta:
          // Baixa patrimonial direta e Sem reparo direto ficam RESOLVIDOS.
          // Se estava em Sem reparo/Baixado e voltar para TROCA, reabre como EM ANDAMENTO.
          if (finalOutcome === "SWAP") {
            db.prepare(`
              UPDATE tickets
              SET status = 'IN_PROGRESS',
                  assigned_to_user_id = ?,
                  resolved_at = NULL,
                  final_outcome = 'SWAP',
                  technical_observation = ?,
                  maintenance_value = ?,
                  maintenance_description = ?,
                  maintenance_type = ?,
                  part_name = ?,
                  supplier_name = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(req.user.id, solutionText, maintenance.maintenance_value, maintenance.maintenance_description, maintenance.maintenance_type, maintenance.part_name, maintenance.supplier_name, ticketId);

            insertTicketLogSafe(ticketId, "TICKET_REOPENED_FOR_SWAP", req.user.id, `Chamado reaberto para troca por ${req.user.name}`, req);

            insertTicketLogSafe(ticketId, "RESOLUTION_NOTE", req.user.id, solutionText, req);

            if (ticket.asset_id) {
              const asset = db.prepare(`SELECT id, patrimonio, name, status, sector_id, last_sector_id FROM assets WHERE id = ?`).get(ticket.asset_id);
              if (asset && asset.status !== "SWAP") {
                db.prepare(`
                  UPDATE assets
                  SET status = 'SWAP',
                      last_sector_id = COALESCE(last_sector_id, sector_id),
                      out_of_operation_at = CURRENT_TIMESTAMP,
                      out_of_operation_reason = 'Aguardando troca'
                  WHERE id = ?
                `).run(ticket.asset_id);
                const note = `Equipamento ${asset.patrimonio || ''} - ${asset.name || ''} voltou para Aguardando troca no chamado #${ticketId}`;
                auditAdmin(req, 'ASSET', ticket.asset_id, 'ASSET_STATUS_CHANGED', note);
                insertTicketLogSafe(ticketId, "ASSET_STATUS_CHANGED", req.user.id, note, req);
              }
            }

            registerAssetMaintenance(ticketId, req.user.id, maintenance);
            void notifyFacilitiesBot("ticket_updated", ticketId);
            return res.json({ ok: true, pending_swap: true, reopened: true, message: "Chamado reaberto e mantido em andamento aguardando troca" });
          }

          insertTicketLogSafe(ticketId, "RESOLUTION_NOTE", req.user.id, solutionText, req);
          saveResolutionPhotoOnce();

          db.prepare(`
            UPDATE tickets
            SET status = 'DONE',
                resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP),
                final_outcome = ?,
                technical_observation = ?,
                maintenance_value = ?,
                maintenance_description = ?,
                maintenance_type = ?,
                part_name = ?,
                supplier_name = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(finalOutcome, solutionText, maintenance.maintenance_value, maintenance.maintenance_description, maintenance.maintenance_type, maintenance.part_name, maintenance.supplier_name, ticketId);

          registerAssetMaintenance(ticketId, req.user.id, maintenance);
          const newAssetStatus = assetStatusByOutcome(finalOutcome);
          if (ticket.asset_id && newAssetStatus) {
            const asset = db.prepare(`SELECT id, patrimonio, name, status, sector_id, last_sector_id FROM assets WHERE id = ?`).get(ticket.asset_id);
            if (asset && asset.status !== newAssetStatus) {
              db.prepare(`
                UPDATE assets
                SET status = ?,
                    last_sector_id = COALESCE(last_sector_id, sector_id),
                    out_of_operation_at = CURRENT_TIMESTAMP,
                    out_of_operation_reason = ?
                WHERE id = ?
              `).run(newAssetStatus, finalOutcomeLabelBR(finalOutcome), ticket.asset_id);
              const note = `Equipamento ${asset.patrimonio || ''} - ${asset.name || ''} atualizado para ${finalOutcomeLabelBR(finalOutcome)} no chamado #${ticketId}`;
              auditAdmin(req, 'ASSET', ticket.asset_id, 'ASSET_STATUS_CHANGED', note);
              insertTicketLogSafe(ticketId, "ASSET_STATUS_CHANGED", req.user.id, note, req);
            }
          }

          void notifyFacilitiesBot("ticket_updated", ticketId);
          return res.json({ ok: true, message: "Chamado continua resolvido e patrimônio atualizado" });
        }
        return res.json({ ok: true, ignored: true, message: "Chamado já está resolvido" });
      }
    }

    if (status === "IN_PROGRESS") {
      const assumeConfirmed = String(
        req.body.assume_confirmed ||
        req.body.assumeConfirmed ||
        req.headers["x-gf-assume-confirmed"] ||
        req.headers["x-assume-confirmed"] ||
        ""
      ).toUpperCase();
      if (!["YES", "SIM", "TRUE", "1"].includes(assumeConfirmed)) {
        return res.status(428).json({ ok: false, need_confirmation: true, ticket_id: ticketId, error: "Confirmação obrigatória antes de assumir o chamado." });
      }

      if (ticket.assigned_to_user_id && Number(ticket.assigned_to_user_id) !== Number(req.user.id) && ticket.status !== "DONE") {
        return res.status(409).json({ ok: false, error: "Este chamado já foi assumido por outro usuário." });
      }
      const isReopen = ticket.status === "DONE" || !!ticket.resolved_at;
      db.prepare(`
        UPDATE tickets
        SET status = 'IN_PROGRESS',
            assigned_to_user_id = ?,
            resolved_at = CASE WHEN ? = 1 THEN NULL ELSE resolved_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, isReopen ? 1 : 0, ticketId);

      insertTicketLogSafe(ticketId,
          isReopen ? "TICKET_REOPENED" : "TICKET_ASSIGNED",
          req.user.id,
          isReopen ? `Chamado reaberto por ${req.user.name}` : `Chamado assumido por ${req.user.name}`, req);
    } else if (status === "DONE") {
      if (!solutionText) return res.status(400).json({ ok: false, error: "Informe a observação técnica para finalizar o chamado" });

      // V10.9 - Encaminhado para troca NÃO finaliza o chamado.
      // Ele fica EM ANDAMENTO aguardando peça/equipamento chegar.
      if (finalOutcome === "SWAP") {
        db.prepare(`
          UPDATE tickets
          SET status = 'IN_PROGRESS',
              assigned_to_user_id = ?,
              final_outcome = 'SWAP',
              technical_observation = ?,
              maintenance_value = ?,
              maintenance_description = ?,
              maintenance_type = ?,
              part_name = ?,
              supplier_name = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(req.user.id, solutionText, maintenance.maintenance_value, maintenance.maintenance_description, maintenance.maintenance_type, maintenance.part_name, maintenance.supplier_name, ticketId);

        insertTicketLogSafe(ticketId, "TICKET_SWAP_PENDING", req.user.id, `Chamado encaminhado para troca por ${req.user.name} e mantido em andamento`, req);

        insertTicketLogSafe(ticketId, "RESOLUTION_NOTE", req.user.id, solutionText, req);

        if (maintenance.maintenance_value || maintenance.maintenance_description || maintenance.part_name || maintenance.supplier_name || maintenance.maintenance_type) {
          const costNote = `${maintenanceTypeLabelBR(maintenance.maintenance_type)}${maintenance.part_name ? ' · Peça: ' + maintenance.part_name : ''}${maintenance.maintenance_description ? ' · ' + maintenance.maintenance_description : ''}${maintenance.supplier_name ? ' · Fornecedor: ' + maintenance.supplier_name : ''}${maintenance.maintenance_value ? ' · R$ ' + maintenance.maintenance_value.toFixed(2) : ''}`;
          insertTicketLogSafe(ticketId, "MAINTENANCE_COST", req.user.id, costNote, req);
          registerAssetMaintenance(ticketId, req.user.id, maintenance);
        }

        if (ticket.asset_id) {
          const asset = db.prepare(`SELECT id, patrimonio, name, status, sector_id, last_sector_id FROM assets WHERE id = ?`).get(ticket.asset_id);
          if (asset && asset.status !== 'SWAP') {
            // IMPORTANTE: não zerar sector_id porque no seu banco assets.sector_id é NOT NULL.
            // O equipamento sai da lista do setor pelo status='SWAP', mas mantém o setor de origem salvo.
            db.prepare(`
              UPDATE assets
              SET status = 'SWAP',
                  last_sector_id = COALESCE(last_sector_id, sector_id),
                  out_of_operation_at = CURRENT_TIMESTAMP,
                  out_of_operation_reason = 'Aguardando troca'
              WHERE id = ?
            `).run(ticket.asset_id);
            const note = `Equipamento ${asset.patrimonio || ''} - ${asset.name || ''} removido do setor ativo e enviado para Aguardando troca no chamado #${ticketId}`;
            auditAdmin(req, 'ASSET', ticket.asset_id, 'ASSET_STATUS_CHANGED', note);
            insertTicketLogSafe(ticketId, "ASSET_STATUS_CHANGED", req.user.id, note, req);
          }
        }

        registerAssetMaintenance(ticketId, req.user.id, maintenance);
        void notifyFacilitiesBot("ticket_updated", ticketId);
        return res.json({ ok: true, pending_swap: true, message: "Chamado mantido em andamento aguardando troca" });
      }

      db.prepare(`
        UPDATE tickets
        SET status = 'DONE',
            assigned_to_user_id = ?,
            resolved_at = CURRENT_TIMESTAMP,
            final_outcome = ?,
            technical_observation = ?,
            maintenance_value = ?,
            maintenance_description = ?,
            maintenance_type = ?,
            part_name = ?,
            supplier_name = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user.id, finalOutcome, solutionText, maintenance.maintenance_value, maintenance.maintenance_description, maintenance.maintenance_type, maintenance.part_name, maintenance.supplier_name, ticketId);

      insertTicketLogSafe(ticketId, "TICKET_FINALIZED", req.user.id, `${finalOutcomeLabelBR(finalOutcome)} por ${req.user.name}`, req);

      insertTicketLogSafe(ticketId, "RESOLUTION_NOTE", req.user.id, solutionText, req);
      saveResolutionPhotoOnce();
      if (maintenance.maintenance_value || maintenance.maintenance_description || maintenance.part_name || maintenance.supplier_name || maintenance.maintenance_type) {
        const costNote = `${maintenanceTypeLabelBR(maintenance.maintenance_type)}${maintenance.part_name ? ' · Peça: ' + maintenance.part_name : ''}${maintenance.maintenance_description ? ' · ' + maintenance.maintenance_description : ''}${maintenance.supplier_name ? ' · Fornecedor: ' + maintenance.supplier_name : ''}${maintenance.maintenance_value ? ' · R$ ' + maintenance.maintenance_value.toFixed(2) : ''}`;
        insertTicketLogSafe(ticketId, "MAINTENANCE_COST", req.user.id, costNote, req);
        registerAssetMaintenance(ticketId, req.user.id, maintenance);
      }

      const newAssetStatus = assetStatusByOutcome(finalOutcome);
      if (ticket.asset_id && newAssetStatus) {
        const asset = db.prepare(`SELECT id, patrimonio, name, status, sector_id, last_sector_id FROM assets WHERE id = ?`).get(ticket.asset_id);
        if (asset && asset.status !== newAssetStatus) {
          // IMPORTANTE: não zerar sector_id porque no seu banco assets.sector_id é NOT NULL.
          // Fora de operação some das listas ativas pelo status, mantendo a origem para histórico/retorno.
          db.prepare(`
            UPDATE assets
            SET status = ?,
                last_sector_id = COALESCE(last_sector_id, sector_id),
                out_of_operation_at = CURRENT_TIMESTAMP,
                out_of_operation_reason = ?
            WHERE id = ?
          `).run(newAssetStatus, finalOutcomeLabelBR(finalOutcome), ticket.asset_id);
          const note = `Equipamento ${asset.patrimonio || ''} - ${asset.name || ''} removido do setor ativo e enviado para Fora de operação (${finalOutcomeLabelBR(finalOutcome)}) após finalizar o chamado #${ticketId}`;
          auditAdmin(req, 'ASSET', ticket.asset_id, 'ASSET_STATUS_CHANGED', note);
          insertTicketLogSafe(ticketId, "ASSET_STATUS_CHANGED", req.user.id, note, req);
        }
      }

      // Se estava aguardando troca e agora foi resolvido, volta ao setor de origem e sai da lista de troca.
      if (ticket.asset_id && finalOutcome === 'RESOLVED') {
        const asset = db.prepare(`SELECT id, patrimonio, name, status, sector_id, last_sector_id FROM assets WHERE id = ?`).get(ticket.asset_id);
        if (asset && asset.status === 'SWAP') {
          const returnSectorId = asset.last_sector_id || asset.sector_id;
          if (returnSectorId) {
            db.prepare(`
              UPDATE assets
              SET status='ACTIVE',
                  sector_id=?,
                  last_sector_id=NULL,
                  out_of_operation_at=NULL,
                  out_of_operation_reason=NULL
              WHERE id=?
            `).run(returnSectorId, ticket.asset_id);
            const note = `Troca concluída no chamado #${ticketId}. Equipamento ${asset.patrimonio || ''} - ${asset.name || ''} retornou para o setor de origem e saiu da lista de aguardando troca.`;
            auditAdmin(req, 'ASSET', ticket.asset_id, 'ASSET_RETURNED_FROM_SWAP', note);
            insertTicketLogSafe(ticketId, "ASSET_RETURNED_FROM_SWAP", req.user.id, note, req);
          }
        }
      }
    } else {
      db.prepare(`UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, ticketId);
      insertTicketLogSafe(ticketId, "STATUS_CHANGED", req.user.id, `Status alterado para ${statusLabelBR(status)}`, req);
    }

    void notifyFacilitiesBot("ticket_updated", ticketId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro POST status:", err);
    const code = Number(err && err.statusCode) || 500;
    res.status(code).json({ ok: false, error: code === 500 ? "Erro interno ao atualizar status" : err.message });
  }
});

// V10.3 - rota dedicada para salvar/atualizar solução técnica sem mudar status
app.post("/api/admin/tickets/:id/solution", requireAuth, requireTicketHandler, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const solutionText = normalizeSolutionText(req.body);

    if (!solutionText) return res.status(400).json({ ok: false, error: "Informe a solução do chamado" });

    const ticket = db.prepare(`SELECT id FROM tickets WHERE id = ?`).get(ticketId);
    if (!ticket) return res.status(404).json({ ok: false, error: "Chamado não encontrado" });

    insertTicketLogSafe(ticketId, "RESOLUTION_NOTE", req.user.id, solutionText, req);

    db.prepare(`UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(ticketId);

    res.json({ ok: true, message: "Solução salva com sucesso" });
  } catch (err) {
    console.error("Erro POST solution:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao salvar solução" });
  }
});

app.post("/api/admin/tickets/:id/notes", requireAuth, requireTicketHandler, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const note = String(req.body.note || "").trim();
    if (!note) return res.status(400).json({ ok: false, error: "Nota vazia" });

    // V86 - Atualização pública do chamado.
    // A anotação continua no histórico do admin, mas agora também aparece no QR para o solicitante.
    // Mantém isolamento por empresa para não misturar chamados de clientes diferentes.
    const cid = currentCompanyId(req);
    const ticket = db.prepare(`
      SELECT t.id, COALESCE(t.company_id, s.company_id) AS company_id
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      WHERE t.id = ?
        AND (? IS NULL OR COALESCE(t.company_id, s.company_id) = ?)
      LIMIT 1
    `).get(ticketId, cid, cid);
    if (!ticket) return res.status(404).json({ ok: false, error: "Chamado não encontrado" });

    insertTicketLogSafe(ticketId, "PUBLIC_NOTE", req.user.id, note, req);

    db.prepare(`UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(ticketId);

    void notifyFacilitiesBot("ticket_updated", ticketId);
    res.json({ ok: true, public_note: note });
  } catch (err) {
    console.error("Erro POST note:", err);
    res.status(500).json({ ok: false, error: "Erro interno ao salvar nota" });
  }
});



// =========================
// V7 - CADASTROS ADMIN
// =========================
function slugify(text) {
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureQrBlockColumn(){
  try {
    const cols = db.prepare(`PRAGMA table_info(sectors)`).all().map(c => c.name);
    if (!cols.includes('qr_block')) {
      db.prepare(`ALTER TABLE sectors ADD COLUMN qr_block TEXT`).run();
      console.log('[MIGRATION] sectors.qr_block criado para organizar QR por blocos.');
    }
  } catch (err) {
    console.error('Erro ao garantir coluna sectors.qr_block:', err);
  }
}
ensureQrBlockColumn();
function normalizeQrBlock(v){
  return String(v || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
}

app.get("/api/admin/sectors", requireAuth, (req, res) => {
  try {
    const sectors = db.prepare(`
      SELECT s.*, u.name AS unit_name,
        (SELECT COUNT(*) FROM assets a WHERE a.sector_id = s.id AND (? IS NULL OR COALESCE(a.company_id,s.company_id)=?)) AS assets_count
      FROM sectors s
      LEFT JOIN units u ON u.id = s.unit_id
      WHERE (? IS NULL OR COALESCE(s.company_id,u.company_id)=?)
      ORDER BY s.name ASC
    `).all(currentCompanyId(req), currentCompanyId(req), currentCompanyId(req), currentCompanyId(req));
    res.json({ ok: true, sectors });
  } catch (err) {
    console.error("Erro GET sectors:", err);
    res.status(500).json({ ok:false, error:"Erro ao listar setores" });
  }
});

app.post("/api/admin/sectors", requireAuth, requireAdmin, (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    let publicSlug = String(req.body.slug || "").trim() || slugify(name);
    let slug = companyScopedSectorSlug(req, publicSlug);
    if (!name || !slug) return res.status(400).json({ ok:false, error:"Informe nome do setor" });
    const unit = db.prepare(`SELECT id FROM units WHERE (? IS NULL OR company_id=?) ORDER BY id LIMIT 1`).get(currentCompanyId(req), currentCompanyId(req));
    if (!unit) return res.status(400).json({ ok:false, error:"Nenhuma unidade cadastrada" });
    const qrToken = String(req.body.qr_token || "").trim() || `qr-${slug}-si`;
    const qrBlock = normalizeQrBlock(req.body.qr_block || req.body.block || "");
    const info = db.prepare(`INSERT INTO sectors (unit_id, name, slug, qr_token, active, company_id, qr_block) VALUES (?, ?, ?, ?, 1, ?, ?)`).run(unit.id, name, slug, qrToken, currentCompanyId(req), qrBlock || null);
    const sector = db.prepare(`SELECT id, unit_id, name, slug, qr_token, active, qr_block FROM sectors WHERE id = ?`).get(info.lastInsertRowid);
    auditAdmin(req, 'SECTOR', info.lastInsertRowid, 'SECTOR_CREATED', `Setor ${name} criado com slug ${slug} e QR automático`);
    res.json({ ok:true, id:info.lastInsertRowid, sector });
  } catch (err) {
    console.error("Erro POST sector:", err);
    res.status(500).json({ ok:false, error:"Erro ao criar setor nesta empresa." });
  }
});

app.put("/api/admin/sectors/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const slug = companyScopedSectorSlug(req, String(req.body.slug || "").trim() || slugify(name));
    const active = req.body.active ? 1 : 0;
    if (!name || !slug) return res.status(400).json({ ok:false, error:"Informe nome e slug" });
    const oldSector = db.prepare(`SELECT name, slug, active, qr_block FROM sectors WHERE id = ? AND (? IS NULL OR company_id=?)`).get(id, currentCompanyId(req), currentCompanyId(req));
    if (!oldSector) return res.status(404).json({ ok:false, error:'Setor não encontrado nesta empresa' });
    const qrBlock = Object.prototype.hasOwnProperty.call(req.body,'qr_block') || Object.prototype.hasOwnProperty.call(req.body,'block') ? normalizeQrBlock(req.body.qr_block || req.body.block || "") : String(oldSector.qr_block || "");
    db.prepare(`UPDATE sectors SET name=?, slug=?, active=?, qr_block=? WHERE id=? AND (? IS NULL OR company_id=?)`).run(name, slug, active, qrBlock || null, id, currentCompanyId(req), currentCompanyId(req));
    auditAdmin(req, 'SECTOR', id, 'SECTOR_UPDATED', `Setor atualizado de ${oldSector ? oldSector.name : '-'} para ${name}`);
    res.json({ ok:true });
  } catch (err) {
    console.error("Erro PUT sector:", err);
    res.status(500).json({ ok:false, error:"Erro ao atualizar setor" });
  }
});


// V17.2 - endpoint manual para corrigir banco antigo pelo navegador.
// Acesse logado: /api/admin/migracoes/equipamentos-tipo
app.get("/api/admin/migracoes/equipamentos-tipo", requireAuth, requireAdmin, (req, res) => {
  const result = ensureAssetDepartmentMigration();
  if (!result.ok) return res.status(500).json({ success:false, ok:false, error: result.error });
  res.json({ success:true, ok:true, message:"Migração concluída. Equipamentos antigos sem tipo ficaram como TI.", updated: result.updated });
});

// V17.2 - endpoint público temporário para facilitar no ambiente local/túnel.
// Pode abrir no navegador: /api/public/migracoes/equipamentos-tipo
app.get("/api/public/migracoes/equipamentos-tipo", (req, res) => {
  const result = ensureAssetDepartmentMigration();
  if (!result.ok) return res.status(500).json({ success:false, ok:false, error: result.error });
  res.json({ success:true, ok:true, message:"Migração concluída. Equipamentos antigos sem tipo ficaram como TI.", updated: result.updated });
});



// V-SERVICE-GROUPS - Serviços aparecem uma vez só, com setores vinculados.
function normServiceKey(value){
  return String(value || '')
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ');
}
function serviceDisplayNameFromKey(key){
  const raw = String(key || '').trim().replace(/\s+/g,' ');
  const norm = normServiceKey(raw);
  const map = {
    'LAMPADA': 'LÂMPADA',
    'ELETRICA': 'ELÉTRICA',
    'HIDRAULICA': 'HIDRÁULICA',
    'CAMERA': 'CÂMERA',
    'CAMERAS': 'CÂMERAS',
    'REQUISICAO': 'REQUISIÇÃO',
    'MANUTENCAO PREDIAL': 'MANUTENÇÃO PREDIAL',
    'VIDRACARIA': 'VIDRAÇARIA',
    'INSTALACAO': 'INSTALAÇÃO',
    'LANCAMENTO DE CABO': 'LANÇAMENTO DE CABO'
  };
  return map[norm] || raw;
}

function normalizePublicItemDisplay(item){
  if (!item || typeof item !== 'object') return item;
  const out = { ...item };
  if (out.name) out.name = serviceDisplayNameFromKey(out.name);
  if (out.asset_name) out.asset_name = serviceDisplayNameFromKey(out.asset_name);
  if (out.service_name) out.service_name = serviceDisplayNameFromKey(out.service_name);
  if (out.legacy_asset_name) out.legacy_asset_name = serviceDisplayNameFromKey(out.legacy_asset_name);
  return out;
}

// V-SERVICE-PUBLIC-FIX - serviços reais da tabela services aparecem no QR e usam seus tipos de problema.
// Mantém compatibilidade com o modelo antigo em assets e não quebra chamados antigos.
function publicServiceItemsForSector(sector, department) {
  try {
    if (!sector || !hasTable('services') || !hasTable('service_sectors')) return [];
    const serviceCols = tableCols('services');
    const hasCategory = serviceCols.includes('category');
    const hasLegacy = serviceCols.includes('legacy_asset_name');
    const hasUpdated = serviceCols.includes('updated_at');
    const categoryExpr = serviceDepartmentCaseSql('sv');
    const legacyExpr = hasLegacy ? "sv.legacy_asset_name" : "sv.name";
    const updatedExpr = hasUpdated ? "sv.updated_at" : "CURRENT_TIMESTAMP";
    const dep = department ? normalizeAssetDepartment(department) : "";

    const rows = db.prepare(`
      SELECT
        sv.id AS id,
        sv.id AS service_id,
        sv.company_id,
        sv.name AS name,
        ${legacyExpr} AS legacy_asset_name,
        ${categoryExpr} AS asset_department,
        'SERVICE' AS asset_kind,
        '' AS patrimonio,
        '' AS brand,
        '' AS model,
        NULL AS sector_id,
        1 AS active,
        'ACTIVE' AS status,
        ${updatedExpr} AS updated_at
      FROM services sv
      LEFT JOIN service_sectors ss ON ss.service_id = sv.id AND COALESCE(ss.active,1)=1
      WHERE COALESCE(sv.active,1)=1
        AND (
          ss.sector_id = ?
          OR (? = 'APOIO' AND UPPER(${categoryExpr}) = 'APOIO')
        )
        AND sv.company_id = ?
        AND (? = '' OR UPPER(${categoryExpr}) = ?)
      GROUP BY sv.id
      ORDER BY sv.name ASC
    `).all(sector.id, dep, sector.company_id || null, dep, dep);

    return rows.map(normalizePublicItemDisplay);
  } catch (err) {
    console.warn('[QR-SERVICES] Falha ao montar serviços públicos:', err.message);
    return [];
  }
}

function mergePublicAssetAndServiceItems(assets, services) {
  const map = new Map();

  for (const item of (assets || [])) {
    const kind = String(item?.asset_kind || 'EQUIPMENT').toUpperCase() === 'SERVICE' ? 'SERVICE' : 'EQUIPMENT';
    const key = `${kind}:${normServiceKey(item?.name || item?.asset_name || '')}:${item?.id || ''}`;
    map.set(key, item);
  }

  for (const svc of (services || [])) {
    const keyBase = `SERVICE:${normServiceKey(svc?.name || svc?.legacy_asset_name || '')}`;
    // Remove serviço legado com o mesmo nome vindo de assets, para não duplicar no QR.
    for (const k of Array.from(map.keys())) {
      if (k.startsWith(keyBase + ':')) map.delete(k);
    }
    map.set(`${keyBase}:${svc.id}`, svc);
  }

  return Array.from(map.values());
}

function getPublicServiceByIdForCompany(serviceId, companyId, sectorId = null) {
  try {
    if (!hasTable('services')) return null;
    const hasServiceSectors = hasTable('service_sectors');
    const serviceCols = tableCols('services');
    const hasCategory = serviceCols.includes('category');
    const hasLegacy = serviceCols.includes('legacy_asset_name');
    const categoryExpr = serviceDepartmentCaseSql('sv');
    const legacyExpr = hasLegacy ? "sv.legacy_asset_name" : "sv.name";

    const joinSql = hasServiceSectors && sectorId
      ? "JOIN service_sectors ss ON ss.service_id = sv.id AND ss.sector_id = ? AND COALESCE(ss.active,1)=1 AND (ss.company_id IS NULL OR ss.company_id = sv.company_id)"
      : "";
    const params = hasServiceSectors && sectorId
      ? [companyId || null, sectorId, serviceId, companyId || null]
      : [companyId || null, serviceId, companyId || null];

    const service = db.prepare(`
      SELECT
        sv.id AS id,
        sv.id AS service_id,
        sv.company_id,
        sv.name,
        ${legacyExpr} AS legacy_asset_name,
        ${categoryExpr} AS asset_department,
        'SERVICE' AS asset_kind,
        1 AS active,
        'ACTIVE' AS status,
        NULL AS sector_id,
        '' AS patrimonio,
        '' AS brand,
        '' AS model,
        COALESCE(sv.company_id, ?) AS effective_company_id
      FROM services sv
      ${joinSql}
      WHERE sv.id = ?
        AND COALESCE(sv.active,1)=1
        AND sv.company_id = ?
      LIMIT 1
    `).get(...params);

    return service ? normalizePublicItemDisplay(service) : null;
  } catch (err) {
    console.warn('[QR-SERVICES] Falha ao buscar serviço público:', err.message);
    return null;
  }
}
// V-SERVICE-ISSUES - resolve tipos de problema por nome normalizado do serviço/equipamento.
// Mantém compatibilidade com bancos antigos: issue_types ainda usa asset_name,
// então o mesmo problema serve para todos os setores que possuem o serviço.
function listIssuesForAssetSafe(asset){
  const companyId = asset ? (asset.company_id || asset.effective_company_id || null) : null;
  const rawName = asset ? String(asset.name || asset.asset_name || asset.legacy_asset_name || '').trim() : '';
  const legacyName = asset ? String(asset.legacy_asset_name || '').trim() : '';
  const normalizedName = normServiceKey(rawName);
  const normalizedLegacy = normServiceKey(legacyName);
  const kind = String(asset?.asset_kind || '').toUpperCase();
  const serviceId = kind === 'SERVICE' ? Number(asset?.service_id || asset?.id || 0) : 0;
  const assetId = kind !== 'SERVICE' ? Number(asset?.asset_id || asset?.id || 0) : 0;
  if (!rawName && !serviceId && !assetId) return [];

  const cols = tableCols('issue_types');
  const hasServiceId = cols.includes('service_id');
  const hasAssetId = cols.includes('asset_id');

  // Primeiro usa vínculo exato por ID quando existir. Isso evita erro quando serviço e equipamento têm o mesmo id.
  let exact = [];
  try {
    const exactWhere = [];
    const exactParams = [companyId, companyId];
    if (hasServiceId && serviceId) { exactWhere.push('service_id = ?'); exactParams.push(serviceId); }
    if (hasAssetId && assetId) { exactWhere.push('asset_id = ?'); exactParams.push(assetId); }
    if (exactWhere.length) {
      exact = db.prepare(`
        SELECT id, asset_name, name, priority, active${hasServiceId ? ', service_id' : ''}${hasAssetId ? ', asset_id' : ''}
        FROM issue_types
        WHERE active = 1
          AND (? IS NULL OR company_id = ?)
          AND (${exactWhere.join(' OR ')})
        ORDER BY
          CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END,
          name ASC
      `).all(...exactParams);
    }
  } catch (err) {
    console.warn('[QR-ISSUES] Falha vínculo exato:', err.message);
  }
  if (exact.length) return exact;

  // Fallback legado por nome normalizado: mantém compatibilidade com os problemas antigos.
  const candidates = Array.from(new Set([
    rawName,
    legacyName,
    normalizedName,
    normalizedLegacy,
    rawName.normalize ? rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : rawName,
    legacyName && legacyName.normalize ? legacyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : legacyName,
    'GERAL'
  ].filter(Boolean).map(v => String(v).trim())));

  const rows = db.prepare(`
    SELECT id, asset_name, name, priority, active${hasServiceId ? ', service_id' : ''}${hasAssetId ? ', asset_id' : ''}
    FROM issue_types
    WHERE active = 1
      AND (? IS NULL OR company_id = ?)
    ORDER BY
      CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END,
      name ASC
  `).all(companyId, companyId);

  return rows.filter(r => {
    const key = normServiceKey(r.asset_name || '');
    return candidates.some(c => normServiceKey(c) === key);
  });
}
function listServiceGroups(req){
  const cid = currentCompanyId(req);

  // Modelo novo: services + service_sectors.
  // Blindado para bancos que têm department em vez de category e service_sectors sem coluna active.
  if (hasTable('services') && hasTable('service_sectors')) {
    const serviceCols = tableCols('services');
    const linkCols = tableCols('service_sectors');

    const deptExpr = serviceCols.includes('category')
      ? 'sv.category'
      : (serviceCols.includes('department') ? 'sv.department' : "'MANUTENCAO'");

    const legacyExpr = serviceCols.includes('legacy_asset_name')
      ? 'sv.legacy_asset_name'
      : 'sv.name';

    const serviceActiveWhere = '1=1'; // V-INATIVOS: admin lista ativos e inativos; a tela separa pelo filtro

    const linkActiveJoin = linkCols.includes('active')
      ? 'AND COALESCE(ss.active,1)=1'
      : '';

    const rows = db.prepare(`
      SELECT
        sv.id AS service_id,
        sv.company_id,
        sv.name,
        ${deptExpr} AS category,
        ${serviceCols.includes('active') ? 'COALESCE(sv.active,1)' : '1'} AS active,
        ${legacyExpr} AS legacy_asset_name,
        ss.sector_id,
        s.name AS sector_name,
        s.slug AS sector_slug
      FROM services sv
      LEFT JOIN service_sectors ss ON ss.service_id = sv.id ${linkActiveJoin} AND (${linkCols.includes('company_id') ? 'ss.company_id = sv.company_id' : '1=1'})
      LEFT JOIN sectors s ON s.id = ss.sector_id AND COALESCE(s.active,1)=1
      WHERE ${serviceActiveWhere}
        AND sv.company_id=?
      ORDER BY sv.name ASC, s.name ASC
    `).all(cid);

    const map = new Map();
    for (const r of rows) {
      const key = normServiceKey(r.name || r.legacy_asset_name);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          id: r.service_id,
          service_id: r.service_id,
          service_key: key,
          name: serviceDisplayNameFromKey(r.name || r.legacy_asset_name || key),
          legacy_asset_name: r.legacy_asset_name || '',
          asset_kind: 'SERVICE',
          asset_department: r.category || 'MANUTENCAO',
          active: Number(r.active || 0),
          status: Number(r.active || 0) === 1 ? 'ACTIVE' : 'INACTIVE',
          brand: '',
          model: '',
          patrimonio: '',
          sector_id: null,
          sector_name: '',
          sectors: [],
          sector_ids: [],
          asset_ids: [],
          total_assets: 0,
          active_count: 0,
          inactive_count: 0
        });
      }
      const g = map.get(key);
      if (r.sector_id && !g.sector_ids.map(String).includes(String(r.sector_id))) {
        g.sector_ids.push(r.sector_id);
        g.sectors.push({ id:r.sector_id, name:r.sector_name || 'Setor '+r.sector_id, slug:r.sector_slug || '' });
        g.active_count += 1;
      }
    }
    return Array.from(map.values()).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  }

  // Fallback antigo: agrupa assets marcados como SERVICE.
  const rows = db.prepare(`
    SELECT a.*, s.name AS sector_name, s.slug AS sector_slug, COALESCE(a.company_id, s.company_id) AS effective_company_id
    FROM assets a
    LEFT JOIN sectors s ON s.id = a.sector_id
    WHERE COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
      WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
      ELSE 'EQUIPMENT'
    END) = 'SERVICE'
    AND (? IS NULL OR COALESCE(a.company_id, s.company_id)=?)
    ORDER BY a.name ASC, s.name ASC
  `).all(cid, cid);
  const map = new Map();
  for (const a of rows) {
    const key = normServiceKey(a.name);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        id: 'service:'+encodeURIComponent(key),
        service_key: key,
        name: serviceDisplayNameFromKey(a.name || key),
        asset_kind: 'SERVICE',
        asset_department: a.asset_department || 'MANUTENCAO',
        active: 1,
        status: 'ACTIVE',
        brand: a.brand || '',
        model: a.model || '',
        patrimonio: '',
        sector_id: null,
        sector_name: '',
        sectors: [],
        sector_ids: [],
        asset_ids: [],
        total_assets: 0,
        active_count: 0,
        inactive_count: 0
      });
    }
    const g = map.get(key);
    g.total_assets += 1;
    g.asset_ids.push(a.id);
    if (a.sector_id && !g.sector_ids.map(String).includes(String(a.sector_id))) {
      g.sector_ids.push(a.sector_id);
      g.sectors.push({id:a.sector_id, name:a.sector_name || 'Setor '+a.sector_id, slug:a.sector_slug || ''});
      g.active_count += 1;
    }
  }
  return Array.from(map.values()).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
}


// V151 - Serviço com departamento editável no cadastro.
// Mantém a tabela services como fonte principal e sincroniza o legado em assets.
function upsertServiceCadastro(companyId, serviceName, department, sectorIds = []) {
  if (!hasTable('services')) return null;
  const name = String(serviceName || '').trim();
  if (!name) return null;
  const dept = normalizeAssetDepartment(department || 'MANUTENCAO');
  const key = normServiceKey(name);
  const cols = tableCols('services');
  const deptCol = cols.includes('category') ? 'category' : (cols.includes('department') ? 'department' : null);
  const legacyCol = cols.includes('legacy_asset_name') ? 'legacy_asset_name' : null;
  const activeCol = cols.includes('active') ? 'active' : null;
  const updatedCol = cols.includes('updated_at') ? 'updated_at' : null;

  let svc = db.prepare(`
    SELECT id, name
    FROM services
    WHERE COALESCE(active,1)=1
      AND company_id=?
      AND (
        UPPER(TRIM(name))=UPPER(TRIM(?))
        OR UPPER(TRIM(COALESCE(${legacyCol ? legacyCol : 'name'},'')))=UPPER(TRIM(?))
      )
    ORDER BY id DESC
    LIMIT 1
  `).get(companyId, name, name);

  if (svc) {
    const sets = ['name=?'];
    const vals = [name];
    if (deptCol) { sets.push(`${deptCol}=?`); vals.push(dept); }
    if (legacyCol) { sets.push(`${legacyCol}=?`); vals.push(name); }
    if (activeCol) { sets.push(`${activeCol}=1`); }
    if (updatedCol) { sets.push(`${updatedCol}=CURRENT_TIMESTAMP`); }
    vals.push(svc.id);
    vals.push(cid);
      db.prepare(`UPDATE services SET ${sets.join(', ')} WHERE id=? AND company_id=?`).run(...vals);
  } else {
    const insertCols = [];
    const qs = [];
    const vals = [];
    if (cols.includes('company_id')) { insertCols.push('company_id'); qs.push('?'); vals.push(companyId); }
    insertCols.push('name'); qs.push('?'); vals.push(name);
    if (deptCol) { insertCols.push(deptCol); qs.push('?'); vals.push(dept); }
    if (legacyCol) { insertCols.push(legacyCol); qs.push('?'); vals.push(name); }
    if (activeCol) { insertCols.push(activeCol); qs.push('?'); vals.push(1); }
    if (cols.includes('created_at')) { insertCols.push('created_at'); qs.push('CURRENT_TIMESTAMP'); }
    if (updatedCol) { insertCols.push('updated_at'); qs.push('CURRENT_TIMESTAMP'); }
    const info = db.prepare(`INSERT INTO services (${insertCols.join(', ')}) VALUES (${qs.join(', ')})`).run(...vals);
    svc = { id: info.lastInsertRowid, name };
  }

  // Vincula setores na tabela nova, sem quebrar o modelo antigo.
  if (hasTable('service_sectors') && Array.isArray(sectorIds) && sectorIds.length) {
    const lcols = tableCols('service_sectors');
    for (const rawSid of sectorIds) {
      const sid = Number(rawSid);
      if (!sid) continue;
      const exists = db.prepare(`
        SELECT rowid AS rid
        FROM service_sectors
        WHERE service_id=? AND sector_id=?
          AND (${lcols.includes('company_id') ? 'company_id=?' : '1=1'})
        LIMIT 1
      `).get(...(lcols.includes('company_id') ? [svc.id, sid, companyId] : [svc.id, sid]));
      if (exists) {
        if (lcols.includes('active')) db.prepare(`UPDATE service_sectors SET active=1${lcols.includes('company_id') ? ', company_id=?' : ''} WHERE rowid=?`).run(...(lcols.includes('company_id') ? [companyId, exists.rid] : [exists.rid]));
      } else {
        const icols = ['service_id','sector_id'];
        const q = ['?','?'];
        const v = [svc.id, sid];
        if (lcols.includes('company_id')) { icols.push('company_id'); q.push('?'); v.push(companyId); }
        if (lcols.includes('active')) { icols.push('active'); q.push('?'); v.push(1); }
        db.prepare(`INSERT INTO service_sectors (${icols.join(', ')}) VALUES (${q.join(', ')})`).run(...v);
      }
    }
  }

  // Atualiza assets legados que representam esse serviço, para a tela antiga e QR ficarem coerentes.
  try {
    db.prepare(`
      UPDATE assets
      SET asset_department=?, asset_kind='SERVICE'
      WHERE company_id=?
        AND COALESCE(NULLIF(TRIM(asset_kind),''),'SERVICE')='SERVICE'
        AND UPPER(TRIM(name))=?
    `).run(dept, companyId, key);
  } catch(_){}

  return svc.id;
}

app.get('/api/admin/service-groups', requireAuth, (req, res) => {
  try { res.json({ok:true, services:listServiceGroups(req)}); }
  catch(err){ console.error('Erro GET service-groups:', err); res.status(500).json({ok:false,error:'Erro ao listar serviços'}); }
});

app.get('/api/admin/service-groups/:key/issues', requireAuth, (req, res) => {
  try {
    const key = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    if (!key) return res.status(400).json({ok:false,error:'Serviço inválido'});
    const cid = currentCompanyId(req);
    const issues = db.prepare(`
      SELECT id, asset_name, name, priority, active
      FROM issue_types
      WHERE (? IS NULL OR company_id=?)
        AND (UPPER(TRIM(asset_name))=? OR UPPER(TRIM(asset_name))='GERAL')
      ORDER BY CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END, name ASC
    `).all(cid, cid, key);
    res.json({ok:true, issues});
  } catch(err) {
    console.error('Erro GET service issues:', err);
    res.status(500).json({ok:false,error:'Erro ao listar problemas do serviço'});
  }
});

app.post('/api/admin/service-groups/:key/issues', requireAuth, requireAdmin, (req, res) => {
  try {
    const key = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    if (!key) return res.status(400).json({ok:false,error:'Serviço inválido'});
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    const name = String(req.body?.name || '').trim();
    const priority = String(req.body?.priority || 'MEDIUM').trim().toUpperCase();
    if (!name) return res.status(400).json({ok:false,error:'Informe o tipo de problema'});
    let serviceId = null;
    if (hasTable('services')) {
      try {
        const svc = db.prepare(`
          SELECT id FROM services
          WHERE COALESCE(active,1)=1
            AND company_id=?
            AND (
              UPPER(TRIM(name))=UPPER(TRIM(?))
              OR UPPER(TRIM(COALESCE(legacy_asset_name,'')))=UPPER(TRIM(?))
              OR ?=?
            )
          ORDER BY id DESC
          LIMIT 1
        `).get(cid, serviceDisplayNameFromKey(key), serviceDisplayNameFromKey(key), normServiceKey(serviceDisplayNameFromKey(key)), key);
        serviceId = svc ? Number(svc.id) : null;
      } catch(_){}
    }
    const exists = db.prepare(`
      SELECT id FROM issue_types
      WHERE (? IS NULL OR company_id=?)
        AND COALESCE(active,1)=1
        AND UPPER(TRIM(asset_name))=UPPER(TRIM(?))
        AND UPPER(TRIM(name))=UPPER(TRIM(?))
        AND (COALESCE(service_id,0)=COALESCE(?,0))
      LIMIT 1
    `).get(cid, cid, serviceDisplayNameFromKey(key), name, serviceId || 0);
    if (exists) return res.status(409).json({ok:false,error:'Esse tipo de problema já existe para este serviço'});

    const cols = tableCols('issue_types');
    let info;
    if (cols.includes('service_id')) {
      info = db.prepare(`
        INSERT INTO issue_types (asset_name, name, priority, active, company_id, service_id)
        VALUES (?, ?, ?, 1, ?, ?)
      `).run(serviceDisplayNameFromKey(key), name, priority || 'MEDIUM', cid, serviceId || null);
    } else {
      info = db.prepare(`
        INSERT INTO issue_types (asset_name, name, priority, active, company_id)
        VALUES (?, ?, ?, 1, ?)
      `).run(serviceDisplayNameFromKey(key), name, priority || 'MEDIUM', cid);
    }
    auditAdmin(req, 'SERVICE_ISSUE', info.lastInsertRowid, 'SERVICE_ISSUE_CREATED', `Problema criado para serviço ${key}: ${name} (${priority})`);
    res.json({ok:true, id:info.lastInsertRowid});
  } catch(err) {
    console.error('Erro POST service issue:', err);
    res.status(500).json({ok:false,error:'Erro ao criar problema do serviço'});
  }
});



app.put('/api/admin/service-groups/:key/name', requireAuth, requireAdmin, (req, res) => {
  try {
    const oldKey = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    const newNameRaw = String(req.body?.name || req.body?.new_name || '').trim();
    const newKey = normServiceKey(newNameRaw);

    if (!oldKey) return res.status(400).json({ ok:false, error:'Serviço inválido' });
    if (!newNameRaw) return res.status(400).json({ ok:false, error:'Informe o novo nome do serviço' });
    if (!newKey) return res.status(400).json({ ok:false, error:'Nome do serviço inválido' });

    const cid = requireCompanyScope(req, res);
    if (cid === null && !isSuperAdminUser(req.user)) return;

    if (!hasTable('services')) {
      return res.status(500).json({ ok:false, error:'Tabela services não existe' });
    }

    const serviceCols = tableCols('services');
    const legacyCol = serviceCols.includes('legacy_asset_name') ? 'legacy_asset_name' : null;
    const updatedCol = serviceCols.includes('updated_at') ? 'updated_at' : null;

    let serviceRows = db.prepare(`
      SELECT *
      FROM services
      WHERE company_id=?
      ORDER BY id DESC
    `).all(cid);

    const found = serviceRows.find(s => {
      return normServiceKey(s.name || '') === oldKey ||
        (legacyCol && normServiceKey(s.legacy_asset_name || '') === oldKey);
    });

    if (!found) {
      return res.status(404).json({ ok:false, error:'Serviço não encontrado' });
    }

    const duplicate = serviceRows.find(s => {
      if (Number(s.id) === Number(found.id)) return false;
      return normServiceKey(s.name || '') === newKey ||
        (legacyCol && normServiceKey(s.legacy_asset_name || '') === newKey);
    });

    if (duplicate) {
      return res.status(409).json({ ok:false, error:'Já existe outro serviço com esse nome' });
    }

    const oldName = String(found.name || serviceDisplayNameFromKey(oldKey));
    const oldLegacy = legacyCol ? String(found.legacy_asset_name || '') : '';
    const serviceId = Number(found.id);

    const tx = db.transaction(() => {
      const sets = ['name=?'];
      const vals = [newNameRaw];

      // Guarda o nome antigo no legacy_asset_name para rotas antigas, QR e histórico não quebrarem.
      if (legacyCol) {
        const legacyValue = oldLegacy || oldName || serviceDisplayNameFromKey(oldKey);
        sets.push(`${legacyCol}=?`);
        vals.push(legacyValue);
      }

      if (updatedCol) sets.push('updated_at=CURRENT_TIMESTAMP');

      vals.push(serviceId);
      vals.push(cid);
      db.prepare(`UPDATE services SET ${sets.join(', ')} WHERE id=? AND company_id=?`).run(...vals);

      // Mantém os assets legados coerentes para telas/QR antigos.
      try {
        db.prepare(`
          UPDATE assets
          SET name=?, asset_kind='SERVICE'
          WHERE company_id=?
            AND COALESCE(NULLIF(TRIM(asset_kind),''),'SERVICE')='SERVICE'
            AND (
              UPPER(TRIM(name))=UPPER(TRIM(?))
              OR UPPER(TRIM(name))=UPPER(TRIM(?))
            )
        `).run(newNameRaw, cid, oldName, serviceDisplayNameFromKey(oldKey));
      } catch(_){}

      // Blindagem dos tipos de problema: a ligação principal continua sendo service_id.
      // Atualiza asset_name só por compatibilidade com consultas antigas que ainda filtram por texto.
      try {
        const issueCols = tableCols('issue_types');
        if (issueCols.includes('service_id')) {
          db.prepare(`
            UPDATE issue_types
            SET asset_name=?
            WHERE (? IS NULL OR company_id=?)
              AND (
                COALESCE(service_id,0)=?
                OR UPPER(TRIM(asset_name))=UPPER(TRIM(?))
                OR UPPER(TRIM(asset_name))=UPPER(TRIM(?))
              )
          `).run(newNameRaw, cid, cid, serviceId, oldName, serviceDisplayNameFromKey(oldKey));
        } else {
          db.prepare(`
            UPDATE issue_types
            SET asset_name=?
            WHERE (? IS NULL OR company_id=?)
              AND (
                UPPER(TRIM(asset_name))=UPPER(TRIM(?))
                OR UPPER(TRIM(asset_name))=UPPER(TRIM(?))
              )
          `).run(newNameRaw, cid, oldName, serviceDisplayNameFromKey(oldKey));
        }
      } catch(_){}
    });

    tx();

    auditAdmin(req, 'SERVICE', serviceId, 'SERVICE_NAME_UPDATED', `Serviço renomeado de ${oldName} para ${newNameRaw}`);
    res.json({ ok:true, id:serviceId, name:newNameRaw, old_name:oldName, message:'Nome do serviço atualizado' });
  } catch(err) {
    console.error('Erro PUT service name:', err);
    res.status(500).json({ ok:false, error:'Erro ao editar nome do serviço', detail: err.message });
  }
});

app.put('/api/admin/service-groups/:key/department', requireAuth, requireAdmin, (req, res) => {
  try {
    const key = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    if (!key) return res.status(400).json({ok:false,error:'Serviço inválido'});
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    const department = normalizeAssetDepartment(req.body?.department || req.body?.asset_department || req.body?.category || 'MANUTENCAO');

    let displayName = serviceDisplayNameFromKey(key);
    let sectorIds = [];

    if (hasTable('services')) {
      const cols = tableCols('services');
      const legacyCol = cols.includes('legacy_asset_name') ? 'legacy_asset_name' : 'name';
      const found = db.prepare(`
        SELECT id, name
        FROM services
        WHERE company_id=?
          AND (
            UPPER(TRIM(name))=?
            OR UPPER(TRIM(COALESCE(${legacyCol},'')))=?
          )
        ORDER BY CASE WHEN company_id=? THEN 0 ELSE 1 END, id DESC
        LIMIT 1
      `).get(cid, key, key, cid);

      if (found) {
        displayName = found.name || displayName;
        if (hasTable('service_sectors')) {
          const linkCols = tableCols('service_sectors');
          sectorIds = db.prepare(`
            SELECT sector_id FROM service_sectors
            WHERE service_id=? ${linkCols.includes('active') ? 'AND COALESCE(active,1)=1' : ''}
          `).all(found.id).map(r=>Number(r.sector_id)).filter(Boolean);
        }
      }
    }

    if (!sectorIds.length) {
      sectorIds = db.prepare(`
        SELECT DISTINCT a.sector_id
        FROM assets a
        LEFT JOIN sectors s ON s.id=a.sector_id
        WHERE a.sector_id IS NOT NULL
          AND (? IS NULL OR COALESCE(a.company_id, s.company_id)=?)
          AND COALESCE(NULLIF(TRIM(a.asset_kind),''),'SERVICE')='SERVICE'
          AND UPPER(TRIM(a.name))=?
      `).all(cid, cid, key).map(r=>Number(r.sector_id)).filter(Boolean);
    }

    upsertServiceCadastro(cid, displayName, department, sectorIds);

    try {
      db.prepare(`
        UPDATE issue_types
        SET service_id = (
          SELECT sv.id FROM services sv
          WHERE sv.company_id=?
            AND UPPER(TRIM(sv.name))=?
          ORDER BY CASE WHEN sv.company_id=? THEN 0 ELSE 1 END, sv.id DESC
          LIMIT 1
        )
        WHERE (? IS NULL OR company_id=?)
          AND UPPER(TRIM(asset_name))=?
          AND service_id IS NULL
      `).run(cid, key, cid, cid, cid, key);
    } catch(_){}

    auditAdmin(req, 'SERVICE', null, 'SERVICE_DEPARTMENT_UPDATED', `Serviço ${displayName} movido para ${assetDepartmentLabelBR(department)}`);
    res.json({ok:true, department, message:'Departamento do serviço atualizado'});
  } catch(err) {
    console.error('Erro PUT service department:', err);
    res.status(500).json({ok:false,error:'Erro ao alterar departamento do serviço'});
  }
});

app.put('/api/admin/service-groups/:key/active', requireAuth, requireAdmin, (req, res) => {
  try {
    const key = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    const active = req.body && Object.prototype.hasOwnProperty.call(req.body, 'active') ? (req.body.active ? 1 : 0) : 0;
    if (!key) return res.status(400).json({ok:false,error:'Serviço inválido'});
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;

    let displayName = serviceDisplayNameFromKey(key);

    const tx = db.transaction(() => {
      if (hasTable('services')) {
        const existing = db.prepare(`
          SELECT id, name FROM services
          WHERE company_id=?
            AND UPPER(TRIM(name))=?
          LIMIT 1
        `).get(cid, key);
        if (existing) {
          displayName = existing.name || displayName;
          db.prepare(`UPDATE services SET active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(active, existing.id);
          if (hasTable('service_sectors') && active === 0) {
            db.prepare(`UPDATE service_sectors SET active=0 WHERE service_id=?`).run(existing.id);
          }
        } else if (active === 1) {
          const info = db.prepare(`INSERT INTO services (company_id, name, category, active) VALUES (?, ?, 'MANUTENCAO', 1)`).run(cid, displayName);
          displayName = db.prepare(`SELECT name FROM services WHERE id=?`).get(info.lastInsertRowid)?.name || displayName;
        }
      }

      // Compatibilidade com o modelo antigo: o QR ainda usa assets como item selecionável.
      db.prepare(`
        UPDATE assets
        SET status=?, asset_kind='SERVICE'
        WHERE company_id=?
          AND COALESCE(NULLIF(TRIM(asset_kind),''),'SERVICE')='SERVICE'
          AND UPPER(TRIM(name))=?
      `).run(active ? 'ACTIVE' : 'INACTIVE', cid, key);
    });

    tx();
    syncInactiveServicesToLegacyAssets();
    auditAdmin(req, 'SERVICE', null, active ? 'SERVICE_ACTIVATED' : 'SERVICE_INACTIVATED', `Serviço ${displayName} ${active ? 'ativado' : 'inativado'}`);
    res.json({ok:true, active, message: active ? 'Serviço ativado' : 'Serviço inativado'});
  } catch(err) {
    console.error('Erro PUT service active:', err);
    res.status(500).json({ok:false,error:'Erro ao alterar status do serviço'});
  }
});

app.put('/api/admin/service-groups/:key/sectors', requireAuth, requireAdmin, (req, res) => {
  try {
    const key = normServiceKey(decodeURIComponent(String(req.params.key || '')));
    const sectorIds = Array.from(new Set((Array.isArray(req.body?.sector_ids) ? req.body.sector_ids : [])
      .map(x => Number(x))
      .filter(Boolean)
    ));

    if (!key) return res.status(400).json({ ok:false, error:'Serviço inválido' });

    const cid = requireCompanyScope(req, res);
    if (cid === null && !isSuperAdminUser(req.user)) return;

    const sectors = db.prepare(`
      SELECT id, name, company_id
      FROM sectors
      WHERE active = 1
        AND (? IS NULL OR company_id = ?)
    `).all(cid, cid);

    const allowed = new Set(sectors.map(s => Number(s.id)));
    const desired = sectorIds.filter(id => allowed.has(Number(id)));

    let displayName = serviceDisplayNameFromKey(key);
    let serviceId = null;
    let department = 'MANUTENCAO';

    const tx = db.transaction(() => {
      if (!hasTable('services')) {
        throw new Error('Tabela services não existe');
      }

      const serviceCols = tableCols('services');
      const deptCol = serviceCols.includes('category')
        ? 'category'
        : (serviceCols.includes('department') ? 'department' : null);
      const activeCol = serviceCols.includes('active') ? 'active' : null;
      const updatedCol = serviceCols.includes('updated_at') ? 'updated_at' : null;
      const legacyCol = serviceCols.includes('legacy_asset_name') ? 'legacy_asset_name' : null;

      // Procura o serviço em JS usando normServiceKey para não falhar por acento:
      // MANUTENÇÃO PREDIAL == MANUTENCAO PREDIAL.
      const serviceRows = db.prepare(`
        SELECT *
        FROM services
        WHERE COALESCE(active,1)=1
          AND company_id = ?
      `).all(cid);

      const found = serviceRows.find(s => {
        return normServiceKey(s.name || '') === key ||
          (legacyCol && normServiceKey(s.legacy_asset_name || '') === key);
      });

      if (found) {
        serviceId = Number(found.id);
        displayName = found.name || displayName;
        department = normalizeAssetDepartment((deptCol ? found[deptCol] : '') || department);

        const sets = [];
        const vals = [];
        if (activeCol) sets.push(`${activeCol}=1`);
        if (updatedCol) sets.push(`${updatedCol}=CURRENT_TIMESTAMP`);
        if (sets.length) {
          vals.push(serviceId);
          vals.push(cid);
      db.prepare(`UPDATE services SET ${sets.join(', ')} WHERE id=? AND company_id=?`).run(...vals);
        }
      } else {
        const insertCols = [];
        const placeholders = [];
        const vals = [];

        if (serviceCols.includes('company_id')) {
          insertCols.push('company_id');
          placeholders.push('?');
          vals.push(cid);
        }

        insertCols.push('name');
        placeholders.push('?');
        vals.push(displayName);

        if (deptCol) {
          insertCols.push(deptCol);
          placeholders.push('?');
          vals.push(department);
        }

        if (legacyCol) {
          insertCols.push(legacyCol);
          placeholders.push('?');
          vals.push(displayName);
        }

        if (activeCol) {
          insertCols.push(activeCol);
          placeholders.push('?');
          vals.push(1);
        }

        if (serviceCols.includes('created_at')) {
          insertCols.push('created_at');
          placeholders.push('CURRENT_TIMESTAMP');
        }

        if (updatedCol) {
          insertCols.push('updated_at');
          placeholders.push('CURRENT_TIMESTAMP');
        }

        const info = db.prepare(`
          INSERT INTO services (${insertCols.join(', ')})
          VALUES (${placeholders.join(', ')})
        `).run(...vals);

        serviceId = Number(info.lastInsertRowid);
      }

      if (!serviceId) throw new Error('Não foi possível localizar/criar o serviço');
      if (!hasTable('service_sectors')) throw new Error('Tabela service_sectors não existe');

      const linkCols = tableCols('service_sectors');
      const hasActive = linkCols.includes('active');
      const hasCompany = linkCols.includes('company_id');
      const hasCreated = linkCols.includes('created_at');
      const hasUpdated = linkCols.includes('updated_at');

      // service_sectors é a fonte da verdade dos setores vinculados.
      // O departamento/origem do serviço fica em services.category/department.
      if (hasActive) {
        if (desired.length) {
          db.prepare(`
            UPDATE service_sectors
            SET active = 0${hasUpdated ? ', updated_at=CURRENT_TIMESTAMP' : ''}
            WHERE service_id = ?
              ${hasCompany ? 'AND company_id = ?' : ''}
              AND sector_id NOT IN (${desired.map(() => '?').join(',')})
          `).run(...(hasCompany ? [serviceId, cid, ...desired] : [serviceId, ...desired]));
        } else {
          db.prepare(`
            UPDATE service_sectors
            SET active = 0${hasUpdated ? ', updated_at=CURRENT_TIMESTAMP' : ''}
            WHERE service_id = ?
              ${hasCompany ? 'AND company_id = ?' : ''}
          `).run(...(hasCompany ? [serviceId, cid] : [serviceId]));
        }
      } else {
        if (desired.length) {
          db.prepare(`
            DELETE FROM service_sectors
            WHERE service_id = ?
              ${hasCompany ? 'AND company_id = ?' : ''}
              AND sector_id NOT IN (${desired.map(() => '?').join(',')})
          `).run(...(hasCompany ? [serviceId, cid, ...desired] : [serviceId, ...desired]));
        } else {
          db.prepare(`DELETE FROM service_sectors WHERE service_id = ? ${hasCompany ? 'AND company_id = ?' : ''}`).run(...(hasCompany ? [serviceId, cid] : [serviceId]));
        }
      }

      for (const sid of desired) {
        const exists = db.prepare(`
          SELECT rowid AS rid
          FROM service_sectors
          WHERE service_id = ? AND sector_id = ?
            ${hasCompany ? 'AND company_id = ?' : ''}
          LIMIT 1
        `).get(...(hasCompany ? [serviceId, sid, cid] : [serviceId, sid]));

        if (exists) {
          const sets = [];
          const vals = [];
          if (hasActive) sets.push('active=1');
          if (hasCompany) { sets.push('company_id=?'); vals.push(cid); }
          if (hasUpdated) sets.push('updated_at=CURRENT_TIMESTAMP');

          if (sets.length) {
            vals.push(exists.rid);
            db.prepare(`UPDATE service_sectors SET ${sets.join(', ')} WHERE rowid=?`).run(...vals);
          }
        } else {
          const icols = ['service_id', 'sector_id'];
          const qs = ['?', '?'];
          const vals = [serviceId, sid];

          if (hasActive) { icols.push('active'); qs.push('?'); vals.push(1); }
          if (hasCompany) { icols.push('company_id'); qs.push('?'); vals.push(cid); }
          if (hasCreated) { icols.push('created_at'); qs.push('CURRENT_TIMESTAMP'); }
          if (hasUpdated) { icols.push('updated_at'); qs.push('CURRENT_TIMESTAMP'); }

          db.prepare(`
            INSERT INTO service_sectors (${icols.join(', ')})
            VALUES (${qs.join(', ')})
          `).run(...vals);
        }
      }

      // Compatibilidade leve: se existir asset legado desse serviço, atualiza o departamento e
      // também remove dos setores desmarcados. Antes ficava status antigo e o QR ainda mostrava.
      try {
        const desiredPlaceholders = desired.length ? desired.map(() => '?').join(',') : 'NULL';
        db.prepare(`
          UPDATE assets
          SET asset_kind='SERVICE',
              asset_department=?,
              status=CASE
                WHEN sector_id IN (${desiredPlaceholders}) THEN 'ACTIVE'
                ELSE 'INACTIVE'
              END
          WHERE company_id=?
            AND COALESCE(NULLIF(TRIM(asset_kind),''),'SERVICE')='SERVICE'
            AND (
              UPPER(TRIM(name))=UPPER(TRIM(?))
              OR UPPER(TRIM(name))=UPPER(TRIM(?))
            )
        `).run(department, ...desired, cid, displayName, serviceDisplayNameFromKey(key));
      } catch(_){}
    });

    tx();

    auditAdmin(req, 'SERVICE', serviceId || null, 'SERVICE_SECTORS_UPDATED', `Serviço ${displayName} vinculado a ${desired.length} setor(es)`);
    return res.json({
      ok:true,
      service_id: serviceId,
      linked_count: desired.length,
      message:'Setores do serviço atualizados'
    });
  } catch(err) {
    console.error('Erro PUT service sectors:', err);
    return res.status(500).json({ ok:false, error:'Erro ao atualizar setores do serviço', detail: err.message });
  }
});

app.get("/api/admin/assets", requireAuth, (req, res) => {
  try {
    const sectorId = req.query.sector_id ? Number(req.query.sector_id) : null;
    const status = req.query.status ? String(req.query.status).trim().toUpperCase() : null;
    const where = [];
    const params = [];
    if (sectorId) { where.push('a.sector_id = ?'); params.push(sectorId); }
    if (status) { where.push('a.status = ?'); params.push(status); }
    const kind = req.query.kind ? normalizeAssetKind(req.query.kind) : null;
    if (kind) { where.push(`COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT') = ?`); params.push(kind); }
    const cid = currentCompanyId(req);
    if (cid) { where.push('COALESCE(a.company_id, s.company_id) = ?'); params.push(cid); }
    const sql = `
      SELECT a.*,
             COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
               WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
               ELSE 'EQUIPMENT'
             END) AS asset_kind,
             s.name AS sector_name,
             s.slug AS sector_slug,
             os.name AS origin_sector_name,
             lt.id AS latest_ticket_id,
             lt.ticket_number AS latest_ticket_number,
             lt.status AS latest_ticket_status,
             lt.final_outcome AS latest_ticket_final_outcome,
             lt.technical_observation AS latest_ticket_solution,
             lt.resolved_at AS latest_ticket_resolved_at,
             lu.name AS latest_ticket_user_name
      FROM assets a
      LEFT JOIN sectors s ON s.id = a.sector_id
      LEFT JOIN sectors os ON os.id = a.last_sector_id
      LEFT JOIN tickets lt ON lt.id = (
        SELECT t2.id
        FROM tickets t2
        WHERE t2.asset_id = a.id
        ORDER BY datetime(COALESCE(t2.updated_at, t2.created_at)) DESC, t2.id DESC
        LIMIT 1
      )
      LEFT JOIN users lu ON lu.id = lt.assigned_to_user_id
      ${where.length ? "WHERE " + where.join(' AND ') : ""}
      ORDER BY CASE WHEN a.status='ACTIVE' THEN 0 ELSE 1 END, COALESCE(s.name, os.name) ASC, a.patrimonio ASC, a.name ASC
    `;
    const assets = db.prepare(sql).all(...params);
    res.json({ ok:true, assets });
  } catch (err) {
    console.error("Erro GET assets admin:", err);
    res.status(500).json({ ok:false, error:"Erro ao listar equipamentos" });
  }
});


function makeNoPatrimonioCode(companyId = null) {
  try {
    const cid = companyId ? Number(companyId) : null;
    const row = db.prepare(`
      SELECT patrimonio
      FROM assets
      WHERE patrimonio LIKE 'SP-%'
        AND (? IS NULL OR company_id = ?)
      ORDER BY CAST(SUBSTR(patrimonio, 4) AS INTEGER) DESC
      LIMIT 1
    `).get(cid, cid);
    const last = row && row.patrimonio ? Number(String(row.patrimonio).replace(/\D/g, '')) : 0;
    return 'SP-' + String((last || 0) + 1).padStart(4, '0');
  } catch (_) {
    return 'SP-' + String(Date.now()).slice(-6);
  }
}
function normalizePatrimonioInput(body) {
  let patrimonio = String(body?.patrimonio || '').trim();
  const noPatrimonio = body?.no_patrimonio === true || String(body?.no_patrimonio || '').toLowerCase() === 'true';
  if (!patrimonio && noPatrimonio) patrimonio = makeNoPatrimonioCode();
  return patrimonio;
}

function normalizeSemPatrimonioExtra(body) {
  return {
    sp_responsavel: String(body?.sp_responsavel || '').trim(),
    sp_local: String(body?.sp_local || '').trim(),
    sp_identificacao: String(body?.sp_identificacao || '').trim(),
    sp_obs: String(body?.sp_obs || '').trim(),
  };
}

// V17.8 - normaliza destino técnico do item: TI, Manutenção ou Apoio.
function normalizeAssetDepartment(value) {
  const raw = String(value || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (raw === 'APOIO' || raw === 'SUPORTE' || raw === 'OPERACIONAL') return 'APOIO';
  if (raw === 'MANUTENCAO' || raw === 'MAINTENANCE') return 'MANUTENCAO';
  if (raw === 'TI' || raw === 'T.I' || raw === 'TECNOLOGIA') return 'TI';
  // Padrão antigo preservado: se não vier área, continua em TI.
  return 'TI';
}
function assetDepartmentLabelBR(value) {
  const d = normalizeAssetDepartment(value);
  if (d === 'APOIO') return 'Apoio';
  if (d === 'MANUTENCAO') return 'Manutenção';
  if (d === 'TI') return 'TI';
  return 'Geral';
}

function normalizeAssetKind(value, name = '') {
  const raw = String(value || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (raw.includes('SERVICE') || raw.includes('SERVICO') || raw.includes('SERVIÇO')) return 'SERVICE';

  if (
    raw.includes('EQUIPMENT') ||
    raw.includes('EQUIPAMENTO') ||
    raw.includes('PATRIMONIO') ||
    raw.includes('PATRIMÔNIO')
  ) return 'EQUIPMENT';

  const n = String(name || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const serviceNames = [
    'LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL',
    'MARCENARIA','VIDRACARIA','TOMADA','LAMPADA',
    'ELETRICA','HIDRAULICA','PINTURA','ALVENARIA',
    'REQUISICAO','REQUISIÇÃO','SERVICO','SERVIÇO'
  ];

  for (const s of serviceNames) {
    if (n.includes(s)) return 'SERVICE';
  }

  return 'EQUIPMENT';
}
function assetKindLabelBR(kind) {
  return String(kind || '').toUpperCase() === 'SERVICE' ? 'Serviço' : 'Equipamento';
}

// V16 - campos opcionais financeiros, sem obrigar preenchimento
function parseMoneyBR(value) {
  if (value === null || value === undefined || value === '') return null;
  let raw = String(value).trim();
  if (!raw) return null;
  raw = raw.replace(/R\$|\s/g, '');
  if (raw.includes(',') && raw.includes('.')) raw = raw.replace(/\./g, '').replace(',', '.');
  else raw = raw.replace(',', '.');
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function normalizeAssetFinance(body) {
  return {
    purchase_value: parseMoneyBR(body?.purchase_value),
    invoice_number: String(body?.invoice_number || '').trim(),
    purchase_date: String(body?.purchase_date || '').trim(),
    supplier_name: String(body?.supplier_name || body?.asset_supplier || '').trim(),
    warranty_until: String(body?.warranty_until || '').trim(),
    useful_life_years: Number(body?.useful_life_years || 0) > 0 ? Math.round(Number(body?.useful_life_years || 0)) : null,
  };
}
function normalizeMaintenanceFinance(body) {
  const typeRaw = String(body?.maintenance_type || body?.service_type || '').trim().toUpperCase();
  const allowedTypes = ['PECA','MANUTENCAO','LIMPEZA','MAO_DE_OBRA','OUTRO'];
  return {
    maintenance_value: parseMoneyBR(body?.maintenance_value),
    maintenance_description: String(body?.maintenance_description || body?.part_description || '').trim(),
    maintenance_type: allowedTypes.includes(typeRaw) ? typeRaw : '',
    part_name: String(body?.part_name || body?.replaced_part || '').trim(),
    supplier_name: String(body?.supplier_name || body?.maintenance_supplier || '').trim(),
  };
}
function maintenanceTypeLabelBR(value){
  return {PECA:'Troca de peça', MANUTENCAO:'Manutenção', LIMPEZA:'Limpeza', MAO_DE_OBRA:'Mão de obra', OUTRO:'Outro'}[String(value||'').toUpperCase()] || 'Manutenção/peça';
}
function registerAssetMaintenance(ticketId, userId, maintenance){
  try{
    const t = db.prepare(`SELECT id, asset_id FROM tickets WHERE id=?`).get(ticketId);
    if(!t || !t.asset_id) return;
    const hasInfo = !!(maintenance?.maintenance_value || maintenance?.maintenance_description || maintenance?.part_name || maintenance?.supplier_name || maintenance?.maintenance_type);
    db.prepare(`DELETE FROM asset_maintenance WHERE ticket_id=?`).run(ticketId);
    if(!hasInfo) return;
    db.prepare(`
      INSERT INTO asset_maintenance (asset_id, ticket_id, maintenance_type, description, part_name, supplier_name, cost, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.asset_id,
      ticketId,
      maintenance.maintenance_type || '',
      maintenance.maintenance_description || '',
      maintenance.part_name || '',
      maintenance.supplier_name || '',
      maintenance.maintenance_value || 0,
      userId || null
    );
  }catch(err){ console.warn('Aviso: falha ao salvar asset_maintenance:', err.message); }
}
function equipmentHealth(totalTickets, totalCost, purchaseValue, assetStatus){
  const tickets = Number(totalTickets||0), cost = Number(totalCost||0), purchase = Number(purchaseValue||0);
  const st = String(assetStatus || '').toUpperCase();
  const ratio = purchase > 0 ? (cost / purchase) : 0;
  if(st === 'WRITTEN_OFF') return {status:'SUCATA', label:'⚫ Sucata'};
  if(st === 'NO_REPAIR') return {status:'CRITICO', label:'🔴 Crítico'};
  if(tickets >= 5 || cost >= 1000 || ratio >= 0.60) return {status:'CRITICO', label:'🔴 Crítico'};
  if(tickets >= 3 || cost >= 400 || ratio >= 0.35) return {status:'ATENCAO', label:'🟡 Atenção'};
  if(tickets >= 1 || cost > 0 || st === 'SWAP') return {status:'OBSERVAR', label:'🟠 Observar'};
  return {status:'SAUDAVEL', label:'🟢 Saudável'};
}

app.post("/api/admin/assets", requireAuth, requireAdmin, (req, res) => {
  try {
    const sector_id = Number(req.body.sector_id);
    let patrimonio = normalizePatrimonioInput(req.body);
    const name = String(req.body.name || "").trim();
    const brand = String(req.body.brand || "").trim();
    const model = String(req.body.model || "").trim();
    const asset_department = normalizeAssetDepartment(req.body.asset_department || req.body.department || req.body.area);
    const asset_kind = normalizeAssetKind(req.body.asset_kind || req.body.kind || req.body.tipo_cadastro, name);
    const noPatrimonio = req.body?.no_patrimonio === true || String(req.body?.no_patrimonio || '').toLowerCase() === 'true';
    const sp = normalizeSemPatrimonioExtra(req.body);
    const fin = normalizeAssetFinance(req.body);

   if (!sector_id || !name) return res.status(400).json({ ok:false, error:"Setor e equipamento são obrigatórios" });

const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    if (!patrimonio || noPatrimonio) patrimonio = makeNoPatrimonioCode(cid);
    const sector = db.prepare(`SELECT id, name, company_id FROM sectors WHERE id = ? AND (? IS NULL OR company_id = ?)`).get(sector_id, cid, cid);
    if (!sector) return res.status(403).json({ ok:false, error:'Setor não pertence a esta empresa' });

    // Blindagem por empresa + somente ativos: equipamento inativo não entra na regra de duplicidade visual.
    const activeAssetDup = db.prepare(`
      SELECT id FROM assets
      WHERE (? IS NULL OR company_id = ?)
        AND COALESCE(status,'ACTIVE') <> 'INACTIVE'
        AND REPLACE(UPPER(TRIM(COALESCE(patrimonio,''))), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
      LIMIT 1
    `).get(cid, cid, patrimonio);
    if (activeAssetDup) return res.status(409).json({ ok:false, error:'Já existe equipamento ativo com esse patrimônio nesta empresa' });

    const info = db.prepare(`
      INSERT INTO assets (sector_id, patrimonio, name, brand, model, asset_department, asset_kind, sp_responsavel, sp_local, sp_identificacao, sp_obs, purchase_value, invoice_number, purchase_date, supplier_name, warranty_until, useful_life_years, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(sector_id, patrimonio, name, brand, model, asset_department, asset_kind, sp.sp_responsavel, sp.sp_local, sp.sp_identificacao, sp.sp_obs, fin.purchase_value, fin.invoice_number, fin.purchase_date, fin.supplier_name, fin.warranty_until, fin.useful_life_years, cid);

    if (asset_kind === 'SERVICE') {
      try { upsertServiceCadastro(cid, name, asset_department, [sector_id]); } catch (syncErr) { console.warn('Aviso: falha ao sincronizar serviço:', syncErr.message); }
    }

    auditAdmin(req, 'ASSET', info.lastInsertRowid, 'ASSET_CREATED', `Equipamento ${patrimonio} - ${name}${brand ? ' · Marca: '+brand : ''}${model ? ' · Modelo: '+model : ''}${asset_department ? ' · Área: '+assetDepartmentLabelBR(asset_department) : ''} · Tipo: ${assetKindLabelBR(asset_kind)}${fin.purchase_value ? ' · Valor: R$ '+fin.purchase_value.toFixed(2) : ''}${fin.invoice_number ? ' · Nota: '+fin.invoice_number : ''}${fin.purchase_date ? ' · Compra: '+fin.purchase_date : ''}${noPatrimonio ? ` · Sem patrimônio: ${sp.sp_identificacao}${sp.sp_responsavel ? ' · Responsável: '+sp.sp_responsavel : ''}${sp.sp_local ? ' · Local: '+sp.sp_local : ''}` : ''} cadastrado no setor ${sector ? sector.name : sector_id}`);
    res.json({ ok:true, id:info.lastInsertRowid });
  } catch (err) {
    console.error("Erro POST asset:", err);

    if (
      String(err.message).includes("UNIQUE") ||
      String(err.message).includes("idx_assets_patrimonio_unique")
    ) {
      return res.status(400).json({
        ok:false,
        error:"Patrimônio já cadastrado no sistema."
      });
    }

    res.status(500).json({
      ok:false,
      error:"Erro ao criar equipamento"
    });
  }
});

app.put("/api/admin/assets/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    let sector_id = req.body.sector_id === null || req.body.sector_id === '' ? null : Number(req.body.sector_id);
    let patrimonio = normalizePatrimonioInput(req.body);
    const name = String(req.body.name || "").trim();
    const brand = String(req.body.brand || "").trim();
    const model = String(req.body.model || "").trim();
    const asset_department = normalizeAssetDepartment(req.body.asset_department || req.body.department || req.body.area);
    const asset_kind = normalizeAssetKind(req.body.asset_kind || req.body.kind || req.body.tipo_cadastro, name);
    const sp = normalizeSemPatrimonioExtra(req.body);
    const fin = normalizeAssetFinance(req.body);
    const allowedStatus = ['ACTIVE','INACTIVE','NO_REPAIR','WRITTEN_OFF','SWAP'];
    const status = allowedStatus.includes(String(req.body.status || '').toUpperCase()) ? String(req.body.status).toUpperCase() : 'ACTIVE';
    const cid = currentCompanyId(req);
    const oldAsset = db.prepare(`SELECT patrimonio, name, sector_id, last_sector_id, status, company_id FROM assets WHERE id=? AND (? IS NULL OR company_id=?)`).get(id, cid, cid);
    if (!oldAsset) return res.status(404).json({ ok:false, error:'Equipamento não encontrado nesta empresa' });
    if (status === 'ACTIVE' && !sector_id) sector_id = Number(oldAsset?.last_sector_id || 0) || null;
    if (status === 'ACTIVE' && !sector_id) return res.status(400).json({ ok:false, error:"Para ativar novamente, transfira ou informe um setor" });
    if (!name) return res.status(400).json({ ok:false, error:"Informe o nome do equipamento" });
    if (!patrimonio) patrimonio = makeNoPatrimonioCode(cid);
    if (status !== 'INACTIVE') {
      const activeAssetDup = db.prepare(`
        SELECT id FROM assets
        WHERE id <> ?
          AND (? IS NULL OR company_id = ?)
          AND COALESCE(status,'ACTIVE') <> 'INACTIVE'
          AND REPLACE(UPPER(TRIM(COALESCE(patrimonio,''))), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
        LIMIT 1
      `).get(id, cid, cid, patrimonio);
      if (activeAssetDup) return res.status(409).json({ ok:false, error:'Já existe outro equipamento ativo com esse patrimônio nesta empresa' });
    }
    db.prepare(`
      UPDATE assets
      SET sector_id=?, patrimonio=?, name=?, brand=?, model=?,
          asset_department=?, asset_kind=?,
          sp_responsavel=?, sp_local=?, sp_identificacao=?, sp_obs=?,
          purchase_value=?, invoice_number=?, purchase_date=?, supplier_name=?, warranty_until=?, useful_life_years=?,
          status=?,
          out_of_operation_at = CASE WHEN ?='ACTIVE' THEN NULL ELSE out_of_operation_at END,
          out_of_operation_reason = CASE WHEN ?='ACTIVE' THEN NULL ELSE out_of_operation_reason END
      WHERE id=? AND (? IS NULL OR company_id=?)
    `).run(sector_id, patrimonio, name, brand, model, asset_department, asset_kind, sp.sp_responsavel, sp.sp_local, sp.sp_identificacao, sp.sp_obs, fin.purchase_value, fin.invoice_number, fin.purchase_date, fin.supplier_name, fin.warranty_until, fin.useful_life_years, status, status, status, id, cid, cid);
    auditAdmin(req, 'ASSET', id, 'ASSET_UPDATED', `Equipamento atualizado por ${req.user.name}: ${oldAsset ? oldAsset.patrimonio + ' - ' + oldAsset.name : id} → ${patrimonio} - ${name}${brand ? ' · Modelo: '+brand+' '+model : ''}${asset_department ? ' · Área: '+assetDepartmentLabelBR(asset_department) : ''} · Tipo: ${assetKindLabelBR(asset_kind)}`);
    res.json({ ok:true });
  } catch (err) {
    console.error("Erro PUT asset:", err);
    res.status(500).json({ ok:false, error:"Erro ao atualizar equipamento" });
  }
});

app.post("/api/admin/assets/:id/transfer", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const sector_id = Number(req.body.sector_id);
    if (!sector_id) return res.status(400).json({ ok:false, error:"Informe o novo setor" });
    const cid = currentCompanyId(req);
    const asset = db.prepare(`
      SELECT a.*, s.name AS old_sector
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE a.id=? AND (? IS NULL OR a.company_id=?)
      LIMIT 1
    `).get(id, cid, cid);
    const newSector = db.prepare(`
      SELECT id, name, company_id
      FROM sectors
      WHERE id=? AND (? IS NULL OR company_id=?)
      LIMIT 1
    `).get(sector_id, cid, cid);
    if (!asset || !newSector) return res.status(404).json({ ok:false, error:"Equipamento ou setor não encontrado nesta empresa" });
    if (Number(asset.company_id || 0) && Number(newSector.company_id || 0) && Number(asset.company_id) !== Number(newSector.company_id)) {
      return res.status(403).json({ ok:false, error:"Bloqueado: não é permitido transferir equipamento para setor de outra empresa" });
    }
    db.prepare(`
      UPDATE assets
      SET sector_id=?, company_id=COALESCE(company_id, ?), last_sector_id=NULL, status='ACTIVE', out_of_operation_at=NULL, out_of_operation_reason=NULL
      WHERE id=? AND (? IS NULL OR company_id=?)
    `).run(sector_id, newSector.company_id || cid || asset.company_id || null, id, cid, cid);
    auditAdmin(req, 'ASSET', id, 'ASSET_TRANSFERRED', `Equipamento ${asset.patrimonio || ''} - ${asset.name} transferido de ${asset.old_sector || '-'} para ${newSector.name}`);
    res.json({ ok:true, message:`${asset.name} transferido de ${asset.old_sector || '-'} para ${newSector.name}` });
  } catch (err) {
    console.error("Erro transfer asset:", err);
    res.status(500).json({ ok:false, error:"Erro ao transferir equipamento" });
  }
});


// V10.23 - Fluxo correto para recuperar equipamento sem reparo/baixado:
// NÃO retorna direto ao setor. Primeiro envia para AGUARDANDO TROCA e reabre/cria chamado em andamento.
// Depois o técnico finaliza o chamado como Resolvido para voltar ao setor de origem.
app.post("/api/admin/assets/:id/send-to-swap", requireAuth, requireTicketHandler, (req, res) => {
  try {
    const id = Number(req.params.id);
    const noteBody = String(req.body?.note || "").trim();

    const cid = currentCompanyId(req);
    const asset = db.prepare(`
      SELECT a.*, s.name AS sector_name, s.unit_id
      FROM assets a
      LEFT JOIN sectors s ON s.id = a.sector_id
      WHERE a.id = ? AND (? IS NULL OR COALESCE(a.company_id, s.company_id) = ?)
    `).get(id, cid, cid);

    if (!asset) {
      return res.status(404).json({ ok:false, error:"Equipamento não encontrado" });
    }

    if (asset.status === "ACTIVE") {
      return res.status(400).json({
        ok:false,
        error:"Este equipamento já está ativo no setor. Use transferência normal se precisar mudar de setor."
      });
    }

    const originSectorId = asset.last_sector_id || asset.sector_id;
    if (!originSectorId) {
      return res.status(400).json({
        ok:false,
        error:"Não foi possível identificar o setor de origem do equipamento."
      });
    }

    const sector = db.prepare(`SELECT id, unit_id, name, company_id FROM sectors WHERE id = ? AND (? IS NULL OR company_id = ?)`).get(originSectorId, cid, cid);
    if (!sector) {
      return res.status(404).json({ ok:false, error:"Setor de origem não encontrado" });
    }

    const reason = noteBody || "Equipamento reavaliado para troca/peça antes de retornar ao setor.";

    // Procura o último chamado do equipamento para manter histórico contínuo.
    let ticket = db.prepare(`
      SELECT id, status
      FROM tickets
      WHERE asset_id = ? AND (? IS NULL OR company_id = ?)
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 1
    `).get(id, cid, cid);

    let ticketId;

    if (ticket) {
      ticketId = ticket.id;
      db.prepare(`
        UPDATE tickets
        SET status = 'IN_PROGRESS',
            resolved_at = NULL,
            final_outcome = 'SWAP',
            technical_observation = ?,
            assigned_to_user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND (? IS NULL OR company_id = ?)
      `).run(reason, req.user.id, ticketId, cid, cid);

      insertTicketLogSafe(ticketId, "TICKET_REOPENED_FOR_SWAP", req.user.id, `Equipamento saiu de ${finalOutcomeLabelBR(asset.status === "WRITTEN_OFF" ? "WRITTEN_OFF" : "NO_REPAIR")} e foi enviado para Aguardando troca por ${req.user.name}. ${reason}`, req);
    } else {
      const issue = db.prepare(`
        SELECT id
        FROM issue_types
        WHERE active = 1 AND asset_name = ?
          AND (? IS NULL OR company_id = ?)
        ORDER BY id ASC
        LIMIT 1
      `).get(asset.name, asset.company_id || currentCompanyId(req), asset.company_id || currentCompanyId(req));

      const swapCompanyId = asset.company_id || sector.company_id || cid || null;
      const swapTicketNumber = nextTicketNumberForCompany(swapCompanyId);
      const created = db.prepare(`
        INSERT INTO tickets (
          ticket_number, unit_id, sector_id, asset_id, issue_type_id, description,
          status, priority, opened_by_name, opened_by_phone, company_id,
          assigned_to_user_id, final_outcome, technical_observation
        ) VALUES (?, ?, ?, ?, ?, ?, 'IN_PROGRESS', 'MEDIUM', ?, ?, ?, ?, 'SWAP', ?)
      `).run(
        swapTicketNumber,
        sector.unit_id,
        sector.id,
        id,
        issue ? issue.id : null,
        reason,
        req.user.name || "Admin",
        "",
        swapCompanyId,
        req.user.id,
        reason
      );

      ticketId = created.lastInsertRowid;

      insertTicketLogSafe(ticketId, "TICKET_CREATED", req.user.id, `Chamado técnico criado para reavaliar equipamento e enviar para troca por ${req.user.name}.`, req);
    }

    db.prepare(`
      UPDATE assets
      SET status = 'SWAP',
          last_sector_id = COALESCE(last_sector_id, sector_id),
          out_of_operation_at = CURRENT_TIMESTAMP,
          out_of_operation_reason = 'Aguardando troca para possível retorno ao setor'
      WHERE id = ? AND (? IS NULL OR company_id = ?)
    `).run(id, cid, cid);

    const auditNote = `Equipamento ${asset.patrimonio || ""} - ${asset.name || ""} foi movido para Aguardando troca antes de qualquer retorno ao setor. Chamado #${ticketId}.`;
    auditAdmin(req, "ASSET", id, "ASSET_SENT_TO_SWAP_BEFORE_RETURN", auditNote);

    insertTicketLogSafe(ticketId, "ASSET_STATUS_CHANGED", req.user.id, auditNote, req);

    res.json({
      ok:true,
      ticket_id: ticketId,
      message:`Equipamento enviado para Aguardando troca. Agora finalize o chamado #${ticketId} como Resolvido para voltar ao setor.`
    });
  } catch (err) {
    console.error("Erro send asset to swap:", err);
    res.status(500).json({ ok:false, error:"Erro ao enviar equipamento para troca" });
  }
});

// V16 - Dashboard financeiro/técnico dos equipamentos com filtros
app.get("/api/admin/equipment-dashboard", requireAuth, (req, res) => {
  try {
    const sectorId = req.query.sector_id ? Number(req.query.sector_id) : null;
    const assetId = req.query.asset_id ? Number(req.query.asset_id) : null;
    const start = String(req.query.start || "").trim();
    const end = String(req.query.end || "").trim();
    const department = String(req.query.department || "").trim().toUpperCase();
    const valueMode = String(req.query.value_mode || req.query.only_with_values || "ALL").trim().toUpperCase();
    const where = [];
    const params = [];
    const cid = currentCompanyId(req);
    addCompanyFilter(where, params, "COALESCE(t.company_id, s.company_id, a.company_id) = ?", cid);
    if (sectorId) { where.push("t.sector_id = ?"); params.push(sectorId); }
    if (assetId) { where.push("t.asset_id = ?"); params.push(assetId); }
    if (department && department !== "ALL") {
      where.push("UPPER(COALESCE(NULLIF(TRIM(a.asset_department),''),'TI')) = ?");
      params.push(department);
    }
    if (valueMode === "WITH_VALUES" || valueMode === "1" || valueMode === "ONLY_VALUES") {
      where.push(`(
        COALESCE(t.maintenance_value,0) > 0
        OR EXISTS (
          SELECT 1
          FROM asset_maintenance amv
          WHERE amv.ticket_id = t.id
            AND COALESCE(amv.cost,0) > 0
        )
      )`);
    }

    // V16.2 - Dashboard de equipamentos: período por movimentação real.
    // Antes filtrava só t.created_at. Assim chamado aberto ontem e finalizado hoje
    // não aparecia no filtro de hoje. Agora considera:
    // - criação do chamado
    // - resolução/última atualização do chamado
    // - lançamento financeiro em asset_maintenance
    if (start || end) {
      const dateOr = [];
      const addDateRange = (expr) => {
        const parts = [];
        if (start) { parts.push(`date(${expr}) >= date(?)`); params.push(start); }
        if (end) { parts.push(`date(${expr}) <= date(?)`); params.push(end); }
        if (parts.length) dateOr.push(`(${parts.join(' AND ')})`);
      };

      addDateRange('t.created_at');
      addDateRange('COALESCE(t.resolved_at, t.updated_at)');

      const existsParts = [];
      if (start) { existsParts.push('date(am2.created_at) >= date(?)'); params.push(start); }
      if (end) { existsParts.push('date(am2.created_at) <= date(?)'); params.push(end); }
      dateOr.push(`EXISTS (
        SELECT 1
        FROM asset_maintenance am2
        WHERE am2.ticket_id = t.id
          ${existsParts.length ? 'AND ' + existsParts.join(' AND ') : ''}
      )`);

      where.push(`(${dateOr.join(' OR ')})`);
    }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    const rows = db.prepare(`
      SELECT t.id, t.ticket_number, t.status, t.created_at, t.updated_at, t.resolved_at,
             t.description, t.final_outcome, t.technical_observation,
             t.maintenance_value, t.maintenance_description, t.maintenance_type, t.part_name, t.supplier_name AS ticket_supplier_name,
             s.name AS sector_name, a.id AS asset_id, a.patrimonio, a.name AS asset_name,
             a.brand, a.model, a.purchase_value, a.invoice_number, a.purchase_date, a.supplier_name AS asset_supplier_name, a.warranty_until, a.useful_life_years, a.status AS asset_status,
             i.name AS issue_name, COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      ${whereSql}
      ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
    `).all(...params);

    const allAssetsWhere=[]; const allAssetsParams=[];
    addCompanyFilter(allAssetsWhere, allAssetsParams, 'COALESCE(a.company_id, s.company_id) = ?', cid);
    allAssetsWhere.push(`COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT') <> 'SERVICE'`);
    if(sectorId){ allAssetsWhere.push('a.sector_id = ?'); allAssetsParams.push(sectorId); }
    if(assetId){ allAssetsWhere.push('a.id = ?'); allAssetsParams.push(assetId); }
    const allAssetsWhereSql = allAssetsWhere.length ? 'WHERE ' + allAssetsWhere.join(' AND ') : '';
    const allAssets = db.prepare(`
      SELECT a.id, a.patrimonio, a.name, a.brand, a.model, a.purchase_value, a.invoice_number, a.purchase_date, a.supplier_name AS asset_supplier_name, a.warranty_until, a.useful_life_years, a.status AS asset_status, a.supplier_name, a.warranty_until, a.status,
             s.name AS sector_name
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      ${allAssetsWhereSql}
      ORDER BY a.name ASC
    `).all(...allAssetsParams);

    const maintenanceWhere=[]; const maintenanceParams=[];
    addCompanyFilter(maintenanceWhere, maintenanceParams, 'COALESCE(a.company_id, s.company_id) = ?', cid);
    maintenanceWhere.push(`(a.id IS NULL OR COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT') <> 'SERVICE')`);
    if(sectorId){ maintenanceWhere.push('a.sector_id = ?'); maintenanceParams.push(sectorId); }
    if(assetId){ maintenanceWhere.push('am.asset_id = ?'); maintenanceParams.push(assetId); }
    if(start){ maintenanceWhere.push('date(am.created_at) >= date(?)'); maintenanceParams.push(start); }
    if(end){ maintenanceWhere.push('date(am.created_at) <= date(?)'); maintenanceParams.push(end); }
    const maintenanceWhereSql = maintenanceWhere.length ? 'WHERE ' + maintenanceWhere.join(' AND ') : '';
    const maintenanceRows = db.prepare(`
      SELECT am.*, a.name AS asset_name, a.patrimonio, s.name AS sector_name
      FROM asset_maintenance am
      LEFT JOIN assets a ON a.id=am.asset_id
      LEFT JOIN sectors s ON s.id=a.sector_id
      ${maintenanceWhereSql}
      ORDER BY datetime(am.created_at) DESC, am.id DESC
    `).all(...maintenanceParams);

    const maintenanceSource = maintenanceRows.length ? maintenanceRows : rows.filter(r => Number(r.maintenance_value || 0) > 0).map(r => ({
      asset_id: r.asset_id, asset_name: r.asset_name, patrimonio: r.patrimonio, sector_name: r.sector_name,
      cost: Number(r.maintenance_value || 0), part_name: r.part_name, description: r.maintenance_description, supplier_name: r.ticket_supplier_name, created_at: r.updated_at || r.created_at
    }));
    const totalMaintenance = maintenanceSource.reduce((acc,r)=>acc + Number(r.cost || 0), 0);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const yyyy = String(now.getFullYear());
    const totalMaintenanceMonth = maintenanceSource.filter(r=>String(r.created_at||'').slice(0,7)===ym).reduce((a,r)=>a+Number(r.cost||0),0);
    const totalMaintenanceYear = maintenanceSource.filter(r=>String(r.created_at||'').slice(0,4)===yyyy).reduce((a,r)=>a+Number(r.cost||0),0);
    const totalPatrimonyValue = allAssets.reduce((acc,a)=>acc + Number(a.purchase_value || 0), 0);

    const assetMeta = new Map();
    allAssets.forEach(a=>assetMeta.set(Number(a.id), a));
    const assetsMap = new Map();
    rows.forEach(r => {
      const key = r.asset_id || (r.asset_name || 'Sem equipamento');
      const meta = r.asset_id ? (assetMeta.get(Number(r.asset_id)) || {}) : {};
      const item = assetsMap.get(key) || {
        asset_id:r.asset_id, asset_name:r.asset_name || meta.name || 'Sem equipamento', patrimonio:r.patrimonio || meta.patrimonio || '',
        sector_name:r.sector_name || meta.sector_name || 'Não informado', total_tickets:0, total_maintenance:0,
        purchase_value:Number(r.purchase_value || meta.purchase_value || 0), invoice_number:r.invoice_number || meta.invoice_number || '', purchase_date:r.purchase_date || meta.purchase_date || '',
        asset_supplier_name:r.asset_supplier_name || meta.asset_supplier_name || '', warranty_until:r.warranty_until || meta.warranty_until || '', useful_life_years:r.useful_life_years || meta.useful_life_years || null, asset_status:r.asset_status || meta.status || ''
      };
      item.total_tickets += 1;
      assetsMap.set(key,item);
    });
    maintenanceSource.forEach(m=>{
      const key = m.asset_id || (m.asset_name || 'Sem equipamento');
      const meta = m.asset_id ? (assetMeta.get(Number(m.asset_id)) || {}) : {};
      const item = assetsMap.get(key) || { asset_id:m.asset_id, asset_name:m.asset_name || meta.name || 'Sem equipamento', patrimonio:m.patrimonio || meta.patrimonio || '', sector_name:m.sector_name || meta.sector_name || 'Não informado', total_tickets:0, total_maintenance:0, purchase_value:Number(meta.purchase_value||0), invoice_number:meta.invoice_number||'', purchase_date:meta.purchase_date||'', asset_supplier_name:meta.asset_supplier_name||'', warranty_until:meta.warranty_until||'', useful_life_years:meta.useful_life_years||null, asset_status:meta.status||'' };
      item.total_maintenance += Number(m.cost || 0);
      assetsMap.set(key,item);
    });
    const byAsset = Array.from(assetsMap.values()).map(a=>Object.assign(a,{health:equipmentHealth(a.total_tickets,a.total_maintenance,a.purchase_value,a.asset_status)})).sort((a,b)=>b.total_tickets-a.total_tickets || b.total_maintenance-a.total_maintenance);
    const sectorsMap = new Map();
    rows.forEach(r => {
      const key = r.sector_name || 'Não informado';
      const item = sectorsMap.get(key) || { name:key, total_tickets:0, total_maintenance:0 };
      item.total_tickets += 1;
      sectorsMap.set(key,item);
    });
    maintenanceSource.forEach(m=>{
      const key=m.sector_name||'Não informado';
      const item=sectorsMap.get(key)||{name:key,total_tickets:0,total_maintenance:0};
      item.total_maintenance += Number(m.cost||0);
      sectorsMap.set(key,item);
    });
    const bySector = Array.from(sectorsMap.values()).sort((a,b)=>b.total_tickets-a.total_tickets || b.total_maintenance-a.total_maintenance);
    const lossRanking = byAsset.slice().filter(a=>Number(a.total_maintenance||0)>0).sort((a,b)=>Number(b.total_maintenance||0)-Number(a.total_maintenance||0));
    const criticalAssets = byAsset.filter(a=>['CRITICO','ATENCAO','SUCATA'].includes(a.health?.status));
    const maintainedIds = new Set(maintenanceSource.map(m=>Number(m.asset_id)).filter(Boolean));
    const neverMaintained = allAssets.filter(a=>!maintainedIds.has(Number(a.id))).slice(0,30);
    const partsMap = new Map();
    maintenanceSource.forEach(m=>{
      const k=String(m.part_name||m.description||'Manutenção').trim()||'Manutenção';
      const it=partsMap.get(k)||{name:k,total:0,cost:0};
      it.total += 1; it.cost += Number(m.cost||0); partsMap.set(k,it);
    });
    const byPart = Array.from(partsMap.values()).sort((a,b)=>b.total-a.total || b.cost-a.cost).slice(0,12);

    // V16.1 - cada linha do chamado recebe o gasto ACUMULADO do patrimônio.
    // Isso evita confusão visual quando o mesmo equipamento tem vários chamados:
    // o valor do chamado continua individual, mas o resumo do patrimônio mostra o total real do asset_id.
    const assetTotalsById = new Map();
    byAsset.forEach(a => {
      if (a.asset_id) assetTotalsById.set(Number(a.asset_id), {
        total_maintenance: Number(a.total_maintenance || 0),
        total_tickets: Number(a.total_tickets || 0),
        purchase_value: Number(a.purchase_value || 0),
        health: a.health || equipmentHealth(a.total_tickets, a.total_maintenance, a.purchase_value, a.asset_status)
      });
    });
    const responseRows = rows.map(r => {
      const acc = r.asset_id ? assetTotalsById.get(Number(r.asset_id)) : null;
      return Object.assign({}, r, {
        asset_total_maintenance: acc ? acc.total_maintenance : Number(r.maintenance_value || 0),
        asset_total_tickets: acc ? acc.total_tickets : 1,
        asset_health_status: acc && acc.health ? acc.health.status : equipmentHealth(1, Number(r.maintenance_value || 0), r.purchase_value, r.asset_status).status,
        asset_health_label: acc && acc.health ? acc.health.label : equipmentHealth(1, Number(r.maintenance_value || 0), r.purchase_value, r.asset_status).label
      });
    });

    res.json({ ok:true, cards:{ totalTickets:rows.length, totalMaintenance, totalMaintenanceMonth, totalMaintenanceYear, totalPatrimonyValue, assetsWithProblem:byAsset.length, topAsset:byAsset[0]||null, lossAsset:lossRanking[0]||null, criticalAssets:criticalAssets.length, totalAssets:allAssets.length }, charts:{ byAsset, bySector, lossRanking, criticalAssets, neverMaintained, byPart }, rows: responseRows, maintenanceRows });
  } catch (err) {
    console.error("Erro dashboard equipamentos:", err);
    res.status(500).json({ ok:false, error:"Erro ao carregar dashboard de equipamentos" });
  }
});

app.get("/api/admin/issues", requireAuth, (req, res) => {
  try {
    const cid = currentCompanyId(req);
    const issues = db.prepare(`
      SELECT *
      FROM issue_types
      WHERE (? IS NULL OR company_id = ?)
      ORDER BY asset_name ASC, name ASC
    `).all(cid, cid);
    res.json({ ok:true, issues });
  } catch (err) {
    console.error("Erro GET issues admin:", err);
    res.status(500).json({ ok:false, error:"Erro ao listar problemas" });
  }
});

app.post("/api/admin/issues", requireAuth, requireAdmin, (req, res) => {
  try {
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    const asset_name = gfTextUpper(req.body.asset_name || "");
    const name = gfCanonicalIssueName(req.body.name || "");
    const priority = gfTextUpper(req.body.priority || "MEDIUM");
    const activeInput = Object.prototype.hasOwnProperty.call(req.body, 'active') ? req.body.active : 1;
    const activeValue = (activeInput === false || activeInput === 0 || String(activeInput).toLowerCase() === 'false' || String(activeInput) === '0') ? 0 : 1;
    const itemType = String(req.body.item_type || req.body.kind || req.body.type || '').trim().toUpperCase();
    let serviceId = Number(req.body.service_id || 0) || null;
    let assetId = Number(req.body.asset_id || 0) || null;
    if (!asset_name || !name) return res.status(400).json({ ok:false, error:"Informe equipamento/serviço e problema" });

    // Se for serviço, resolve service_id pelo nome também. Assim novo problema já nasce certo para o QR.
    if (!serviceId && hasTable('services')) {
      try {
        const svc = db.prepare(`
          SELECT id
          FROM services
          WHERE COALESCE(active,1)=1
            AND company_id=?
            AND (
              UPPER(TRIM(name)) = UPPER(TRIM(?))
              OR UPPER(TRIM(COALESCE(legacy_asset_name,''))) = UPPER(TRIM(?))
            )
          ORDER BY id DESC
          LIMIT 1
        `).get(cid, asset_name, asset_name);
        if (svc && (itemType === 'SERVICE' || itemType === 'SERVICO' || itemType === 'SERVIÇO' || !assetId)) serviceId = Number(svc.id);
      } catch(_){}
    }

    const exists = db.prepare(`
      SELECT id FROM issue_types
      WHERE (? IS NULL OR company_id=?)
        AND COALESCE(active,1)=1
        AND REPLACE(UPPER(TRIM(asset_name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
        AND REPLACE(UPPER(TRIM(name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
        AND (COALESCE(service_id,0)=COALESCE(?,0))
      LIMIT 1
    `).get(cid, cid, asset_name, name, serviceId || 0);
    if (exists) return res.status(409).json({ ok:false, error:"Esse tipo de problema já existe para esse equipamento/serviço" });

    const cols = tableCols('issue_types');
    let info;
    if (cols.includes('service_id') || cols.includes('asset_id')) {
      const fields = ['asset_name','name','priority','active','company_id'];
      const values = [asset_name, name, priority || 'MEDIUM', activeValue, cid];
      if (cols.includes('service_id')) { fields.push('service_id'); values.push(serviceId || null); }
      if (cols.includes('asset_id')) { fields.push('asset_id'); values.push(assetId || null); }
      const marks = fields.map(() => '?').join(', ');
      info = db.prepare(`INSERT INTO issue_types (${fields.join(', ')}) VALUES (${marks})`).run(...values);
    } else {
      info = db.prepare(`INSERT INTO issue_types (asset_name, name, priority, active, company_id) VALUES (?, ?, ?, ?, ?)`).run(asset_name, name, priority || 'MEDIUM', activeValue, cid);
    }
    auditAdmin(req, 'ISSUE_TYPE', info.lastInsertRowid, 'ISSUE_CREATED', `Problema criado para ${asset_name}: ${name} (${priority})`);
    res.json({ ok:true, id:info.lastInsertRowid });
  } catch (err) {
    console.error("Erro POST issue:", err);
    res.status(500).json({ ok:false, error:"Erro ao criar tipo de problema" });
  }
});

app.put("/api/admin/issues/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const cid = currentCompanyId(req);

    const current = db.prepare(`
      SELECT * FROM issue_types
      WHERE id=? AND (? IS NULL OR company_id=?)
      LIMIT 1
    `).get(id, cid, cid);
    if (!current) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });

    // FIX: permite ativar/desativar sem depender de reenviar equipamento/serviço válido pelo front.
    // Se algum campo não vier no body, preserva o valor atual do banco.
    const asset_name = gfTextUpper(req.body.asset_name || current.asset_name || "");
    const name = gfCanonicalIssueName(req.body.name || current.name || "");
    const priority = gfTextUpper(req.body.priority || current.priority || "MEDIUM");
    const active = Object.prototype.hasOwnProperty.call(req.body, 'active') ? (req.body.active ? 1 : 0) : (current.active ? 1 : 0);
    if (!asset_name || !name) return res.status(400).json({ ok:false, error:"Informe equipamento/serviço e problema" });

    const serviceId = Number(current.service_id || 0) || 0;
    // Blindagem por empresa + somente ativos: problema inativo não bloqueia edição/cadastro novo.
    // Se estiver salvando como inativo, não faz sentido barrar por duplicidade.
    if (active) {
      const dup = db.prepare(`
        SELECT id FROM issue_types
        WHERE id <> ? AND (? IS NULL OR company_id=?)
          AND COALESCE(active,1)=1
          AND REPLACE(UPPER(TRIM(asset_name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
          AND REPLACE(UPPER(TRIM(name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
          AND COALESCE(service_id,0)=COALESCE(?,0)
        LIMIT 1
      `).get(id, cid, cid, asset_name, name, serviceId);
      if (dup) return res.status(409).json({ ok:false, error:"Já existe outro tipo ativo igual para esse equipamento/serviço nesta empresa" });
    }

    const info = db.prepare(`
      UPDATE issue_types
      SET asset_name=?, name=?, priority=?, active=?
      WHERE id=? AND (? IS NULL OR company_id=?)
    `).run(asset_name, name, priority || 'MEDIUM', active, id, cid, cid);
    if (!info.changes) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });
    auditAdmin(req, 'ISSUE_TYPE', id, 'ISSUE_UPDATED', `Problema atualizado para ${asset_name}: ${name} (${priority}) - ${active ? 'ativo' : 'inativo'}`);
    res.json({ ok:true });
  } catch (err) {
    console.error("Erro PUT issue:", err);
    res.status(500).json({ ok:false, error:"Erro ao atualizar tipo de problema" });
  }
});


// AJUSTE VALDEMIR - setores permitidos por tipo de problema, sempre isolado por company_id.
function ensureIssueSectorLinksTable(){
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS issue_type_sectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_type_id INTEGER NOT NULL,
        sector_id INTEGER NOT NULL,
        company_id INTEGER,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(issue_type_id, sector_id, company_id)
      )
    `).run();
  } catch (err) {
    console.error('Erro ao garantir issue_type_sectors:', err);
  }
}

app.get("/api/admin/issues/:id/sectors", requireAuth, (req, res) => {
  try {
    ensureIssueSectorLinksTable();
    const id = Number(req.params.id);
    const cid = currentCompanyId(req);
    const issue = db.prepare(`
      SELECT * FROM issue_types
      WHERE id=? AND (? IS NULL OR company_id=?)
      LIMIT 1
    `).get(id, cid, cid);
    if (!issue) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });

    const rows = db.prepare(`
      SELECT sector_id
      FROM issue_type_sectors
      WHERE issue_type_id=?
        AND COALESCE(active,1)=1
        AND (? IS NULL OR company_id=?)
      ORDER BY sector_id ASC
    `).all(id, cid, cid);

    let sectorIds = rows.map(r => Number(r.sector_id)).filter(Boolean);

    // Se ainda não tiver vínculo próprio, sugere os setores do serviço/equipamento, sem gravar nada.
    if (!sectorIds.length) {
      try {
        if (Number(issue.service_id || 0) && hasTable('service_sectors')) {
          const linkCols = tableCols('service_sectors');
          sectorIds = db.prepare(`
            SELECT sector_id
            FROM service_sectors
            WHERE service_id=?
              ${linkCols.includes('active') ? 'AND COALESCE(active,1)=1' : ''}
              ${linkCols.includes('company_id') ? 'AND company_id=?' : ''}
          `).all(...(linkCols.includes('company_id') ? [Number(issue.service_id), cid] : [Number(issue.service_id)]))
            .map(r => Number(r.sector_id)).filter(Boolean);
        }
      } catch(_){}
      try {
        if (!sectorIds.length && Number(issue.asset_id || 0)) {
          const a = db.prepare(`SELECT sector_id FROM assets WHERE id=? AND (? IS NULL OR company_id=?) LIMIT 1`).get(Number(issue.asset_id), cid, cid);
          if (a && a.sector_id) sectorIds = [Number(a.sector_id)];
        }
      } catch(_){}
    }

    res.json({ ok:true, sector_ids: Array.from(new Set(sectorIds)) });
  } catch (err) {
    console.error('Erro GET issue sectors:', err);
    res.status(500).json({ ok:false, error:'Erro ao listar setores do problema' });
  }
});

app.put("/api/admin/issues/:id/sectors", requireAuth, requireAdmin, (req, res) => {
  try {
    ensureIssueSectorLinksTable();
    const id = Number(req.params.id);
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    const issue = db.prepare(`
      SELECT id, name, asset_name, company_id
      FROM issue_types
      WHERE id=? AND company_id=?
      LIMIT 1
    `).get(id, cid);
    if (!issue) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });

    const rawIds = Array.isArray(req.body?.sector_ids) ? req.body.sector_ids : [];
    const sectorIds = Array.from(new Set(rawIds.map(Number).filter(Boolean)));
    const allowedRows = db.prepare(`SELECT id FROM sectors WHERE active=1 AND company_id=?`).all(cid);
    const allowed = new Set(allowedRows.map(s => Number(s.id)));
    const desired = sectorIds.filter(sid => allowed.has(Number(sid)));

    const tx = db.transaction(() => {
      if (desired.length) {
        db.prepare(`
          UPDATE issue_type_sectors
          SET active=0, updated_at=CURRENT_TIMESTAMP
          WHERE issue_type_id=? AND company_id=?
            AND sector_id NOT IN (${desired.map(() => '?').join(',')})
        `).run(id, cid, ...desired);
      } else {
        db.prepare(`
          UPDATE issue_type_sectors
          SET active=0, updated_at=CURRENT_TIMESTAMP
          WHERE issue_type_id=? AND company_id=?
        `).run(id, cid);
      }

      for (const sid of desired) {
        const exists = db.prepare(`
          SELECT id FROM issue_type_sectors
          WHERE issue_type_id=? AND sector_id=? AND company_id=?
          LIMIT 1
        `).get(id, sid, cid);
        if (exists) {
          db.prepare(`
            UPDATE issue_type_sectors
            SET active=1, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND company_id=?
          `).run(exists.id, cid);
        } else {
          db.prepare(`
            INSERT INTO issue_type_sectors (issue_type_id, sector_id, company_id, active)
            VALUES (?, ?, ?, 1)
          `).run(id, sid, cid);
        }
      }
    });

    tx();
    auditAdmin(req, 'ISSUE_TYPE', id, 'ISSUE_SECTORS_UPDATED', `Setores do problema ${issue.name} atualizados: ${desired.length}`);
    res.json({ ok:true, linked_count: desired.length, message:'Setores do problema atualizados' });
  } catch (err) {
    console.error('Erro PUT issue sectors:', err);
    res.status(500).json({ ok:false, error:'Erro ao atualizar setores do problema', detail: err.message });
  }
});



// AJUSTE VALDEMIR V6 - vínculos do tipo de problema por equipamento/serviço, isolado por company_id.
// A tela agora abre o problema e mostra em quais equipamentos/serviços ele está vinculado.
function gfIssueKeyText(v){
  return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').trim();
}
function gfIssueItemLabel(row){
  return gfTextUpper(row && (row.name || row.asset_name || row.legacy_asset_name || ''));
}
function gfIssueItemValue(kind, id, name){
  return String(kind || '').toUpperCase() + ':' + String(id || 0) + ':' + gfIssueKeyText(name);
}
function gfListIssueLinkItems(cid){
  const items = [];
  try {
    const assetCols = tableCols('assets');
    const hasKind = assetCols.includes('asset_kind');
    const hasStatus = assetCols.includes('status');
    const hasName = assetCols.includes('name');
    const hasAssetName = assetCols.includes('asset_name');
    const hasType = assetCols.includes('type');
    const hasDepartment = assetCols.includes('asset_department');
    const nameExpr = hasName ? 'name' : (hasAssetName ? 'asset_name' : "''");
    const selectCols = ['id'];
    if (hasName) selectCols.push('name');
    if (hasAssetName) selectCols.push('asset_name');
    if (hasKind) selectCols.push('asset_kind');
    if (hasStatus) selectCols.push('status');
    if (hasType) selectCols.push('type');
    if (hasDepartment) selectCols.push('asset_department');
    const rows = db.prepare(`
      SELECT ${selectCols.join(', ')}
      FROM assets
      WHERE company_id=?
        ${hasStatus ? "AND COALESCE(status,'ACTIVE')='ACTIVE'" : ''}
      ORDER BY ${nameExpr} ASC
    `).all(cid);
    const seen = new Set();
    for (const a of rows) {
      const kindText = gfTextUpper(a.asset_kind || a.type || a.asset_department || '');
      // Assets com asset_kind SERVICE são legado/serviço antigo; equipamento físico fica separado.
      if (kindText === 'SERVICE' || kindText === 'SERVICO' || kindText === 'SERVIÇO') continue;
      const nm = gfIssueItemLabel(a);
      const k = gfIssueKeyText(nm);
      if (!k || seen.has('E:'+k)) continue;
      seen.add('E:'+k);
      items.push({ kind:'EQUIPMENT', id:Number(a.id), name:nm, value:gfIssueItemValue('EQUIPMENT', a.id, nm) });
    }
  } catch (err) {
    console.warn('Aviso: não foi possível listar equipamentos para vínculos de problema:', err.message);
  }
  try {
    if (hasTable('services')) {
      const cols = tableCols('services');
      const hasName = cols.includes('name');
      const hasLegacy = cols.includes('legacy_asset_name');
      const hasActive = cols.includes('active');
      const nameExpr = hasName ? 'name' : (hasLegacy ? 'legacy_asset_name' : "''");
      const selectCols = ['id'];
      if (hasName) selectCols.push('name');
      if (hasLegacy) selectCols.push('legacy_asset_name');
      if (hasActive) selectCols.push('active');
      const rows = db.prepare(`
        SELECT ${selectCols.join(', ')}
        FROM services
        WHERE company_id=? ${hasActive ? 'AND COALESCE(active,1)=1' : ''}
        ORDER BY ${nameExpr} ASC
      `).all(cid);
      const seen = new Set();
      for (const sv of rows) {
        const nm = gfIssueItemLabel(sv);
        const k = gfIssueKeyText(nm);
        if (!k || seen.has('S:'+k)) continue;
        seen.add('S:'+k);
        items.push({ kind:'SERVICE', id:Number(sv.id), name:nm, value:gfIssueItemValue('SERVICE', sv.id, nm) });
      }
    }
  } catch (err) {
    console.warn('Aviso: não foi possível listar serviços para vínculos de problema:', err.message);
  }
  return items.sort((a,b) => String(a.kind).localeCompare(String(b.kind)) || String(a.name).localeCompare(String(b.name),'pt-BR'));
}

app.get('/api/admin/issues/:id/item-links', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const cid = currentCompanyId(req);
    const issue = db.prepare(`SELECT * FROM issue_types WHERE id=? AND (? IS NULL OR company_id=?) LIMIT 1`).get(id, cid, cid);
    if (!issue) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });
    const issueNameKey = gfIssueKeyText(issue.name);
    const rows = db.prepare(`
      SELECT id, asset_name, name, active, service_id, asset_id, priority
      FROM issue_types
      WHERE company_id=?
        AND REPLACE(REPLACE(UPPER(TRIM(name)), ' ', ''), '/', '') = REPLACE(REPLACE(UPPER(TRIM(?)), ' ', ''), '/', '')
        AND COALESCE(active,1)=1
    `).all(cid, issue.name);
    const linked = new Set();
    for (const r of rows) {
      const nm = gfTextUpper(r.asset_name || '');
      if (Number(r.service_id || 0) > 0) linked.add(gfIssueItemValue('SERVICE', Number(r.service_id), nm));
      else if (Number(r.asset_id || 0) > 0) linked.add(gfIssueItemValue('EQUIPMENT', Number(r.asset_id), nm));
      else {
        const k = gfIssueKeyText(nm);
        // Compatibilidade com cadastros antigos sem id: marca qualquer item com mesmo nome.
        for (const it of gfListIssueLinkItems(cid)) if (gfIssueKeyText(it.name) === k) linked.add(it.value);
      }
    }
    res.json({ ok:true, issue:{ id:issue.id, name:issue.name, priority:issue.priority, active:issue.active }, items:gfListIssueLinkItems(cid), linked_values:Array.from(linked) });
  } catch (err) {
    console.error('Erro GET issue item-links:', err);
    res.status(500).json({ ok:false, error:'Erro ao listar vínculos do problema' });
  }
});

app.put('/api/admin/issues/:id/item-links', requireAuth, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const cid = requireCompanyScope(req, res); if (cid === null && !isSuperAdminUser(req.user)) return;
    const base = db.prepare(`SELECT * FROM issue_types WHERE id=? AND company_id=? LIMIT 1`).get(id, cid);
    if (!base) return res.status(404).json({ ok:false, error:'Tipo de problema não encontrado nesta empresa' });
    const desiredValues = Array.isArray(req.body?.item_values) ? req.body.item_values.map(String) : [];
    const allowedItems = gfListIssueLinkItems(cid);
    const allowedMap = new Map(allowedItems.map(x => [x.value, x]));
    const desired = Array.from(new Set(desiredValues)).map(v => allowedMap.get(v)).filter(Boolean);
    const issueName = gfCanonicalIssueName(base.name || '');
    const priority = gfTextUpper(base.priority || 'MEDIUM');
    const cols = tableCols('issue_types');

    const tx = db.transaction(() => {
      // Desativa vínculos removidos, somente dentro da empresa logada e do mesmo nome de problema.
      const activeRows = db.prepare(`SELECT * FROM issue_types WHERE company_id=? AND COALESCE(active,1)=1`).all(cid)
        .filter(r => gfIssueKeyText(r.name) === gfIssueKeyText(issueName));
      const desiredNames = new Set(desired.map(x => gfIssueKeyText(x.name) + ':' + x.kind));
      for (const r of activeRows) {
        const rKind = Number(r.service_id || 0) > 0 ? 'SERVICE' : 'EQUIPMENT';
        const rk = gfIssueKeyText(r.asset_name) + ':' + rKind;
        if (!desiredNames.has(rk)) {
          db.prepare(`UPDATE issue_types SET active=0 WHERE id=? AND company_id=?`).run(Number(r.id), cid);
        }
      }
      for (const it of desired) {
        const existing = db.prepare(`
          SELECT id FROM issue_types
          WHERE company_id=?
            AND REPLACE(UPPER(TRIM(asset_name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
            AND REPLACE(UPPER(TRIM(name)), ' ', '') = REPLACE(UPPER(TRIM(?)), ' ', '')
            AND COALESCE(service_id,0)=COALESCE(?,0)
          ORDER BY id DESC LIMIT 1
        `).get(cid, it.name, issueName, it.kind === 'SERVICE' ? Number(it.id) : 0);
        if (existing) {
          const sets = ['asset_name=?','name=?','priority=?','active=1'];
          const vals = [it.name, issueName, priority];
          if (cols.includes('service_id')) { sets.push('service_id=?'); vals.push(it.kind === 'SERVICE' ? Number(it.id) : null); }
          if (cols.includes('asset_id')) { sets.push('asset_id=?'); vals.push(it.kind === 'EQUIPMENT' ? Number(it.id) : null); }
          vals.push(Number(existing.id), cid);
          db.prepare(`UPDATE issue_types SET ${sets.join(', ')} WHERE id=? AND company_id=?`).run(...vals);
        } else {
          const fields = ['asset_name','name','priority','active','company_id'];
          const vals = [it.name, issueName, priority, 1, cid];
          if (cols.includes('service_id')) { fields.push('service_id'); vals.push(it.kind === 'SERVICE' ? Number(it.id) : null); }
          if (cols.includes('asset_id')) { fields.push('asset_id'); vals.push(it.kind === 'EQUIPMENT' ? Number(it.id) : null); }
          db.prepare(`INSERT INTO issue_types (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...vals);
        }
      }
    });
    tx();
    auditAdmin(req, 'ISSUE_TYPE', id, 'ISSUE_ITEMS_UPDATED', `Vínculos do problema ${base.name} atualizados: ${desired.length}`);
    res.json({ ok:true, linked_count:desired.length });
  } catch (err) {
    console.error('Erro PUT issue item-links:', err);
    res.status(500).json({ ok:false, error:'Erro ao atualizar equipamentos/serviços do problema', detail:err.message });
  }
});


// V10.10 - Manutenção segura: restaurar equipamentos presos fora do setor após limpeza manual do banco.
// Não apaga rotas antigas e não mexe nos chamados. Use quando limpar tickets e sobrar equipamento em troca/fora de operação.
app.post("/api/admin/assets/maintenance/restore-out-of-operation", requireAuth, requireAdmin, (req, res) => {
  try {
    const info = db.prepare(`
      UPDATE assets
      SET status = 'ACTIVE',
          sector_id = COALESCE(last_sector_id, sector_id),
          last_sector_id = NULL,
          out_of_operation_at = NULL,
          out_of_operation_reason = NULL
      WHERE status IN ('SWAP','NO_REPAIR','WRITTEN_OFF')
        AND COALESCE(last_sector_id, sector_id) IS NOT NULL
        AND (? IS NULL OR company_id = ?)
    `).run(currentCompanyId(req), currentCompanyId(req));

    auditAdmin(req, 'ASSET', null, 'ASSETS_RESTORED_MAINTENANCE', `Manutenção restaurou ${info.changes || 0} equipamento(s) para o setor de origem.`);
    res.json({ ok:true, restored: info.changes || 0 });
  } catch (err) {
    console.error("Erro restore assets maintenance:", err);
    res.status(500).json({ ok:false, error:"Erro ao restaurar equipamentos" });
  }
});

app.get("/api/admin/sectors/:id/history", requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const sector = db.prepare(`SELECT id, name, slug, active, company_id FROM sectors WHERE id=? AND (? IS NULL OR company_id=?)`).get(id, currentCompanyId(req), currentCompanyId(req));
    if (!sector) return res.status(404).json({ ok:false, error:"Setor não encontrado" });

    const tickets = db.prepare(`
      SELECT t.id, t.ticket_number, t.status, t.priority, t.description, t.created_at, t.resolved_at, t.sector_id,
             a.patrimonio, a.name AS asset_name, a.brand AS asset_brand, a.model AS asset_model, COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
          WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
          ELSE 'EQUIPMENT'
        END) AS asset_kind, a.sp_responsavel AS asset_sp_responsavel, a.sp_local AS asset_sp_local, a.sp_identificacao AS asset_sp_identificacao, a.sp_obs AS asset_sp_obs, i.name AS issue_name, COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      LEFT JOIN users u ON u.id=t.assigned_to_user_id
      WHERE t.sector_id=?
      AND (? IS NULL OR t.company_id=?)
      AND (
        UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO')
        OR (
          UPPER(TRIM(COALESCE(t.status,''))) IN ('DONE','FINALIZADO','RESOLVIDO')
          AND datetime(COALESCE(t.resolved_at, t.updated_at, t.created_at)) >= datetime('now', '-30 days')
        )
      )
      ORDER BY
      CASE
        WHEN UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO') THEN 0
        ELSE 1
      END,
      datetime(COALESCE(t.resolved_at, t.updated_at, t.created_at)) DESC,
      t.id DESC
    `).all(id, currentCompanyId(req), currentCompanyId(req));

    const audits = db.prepare(`
      SELECT l.*, COALESCE(NULLIF(u.display_name,''), u.name) AS user_name
      FROM admin_audit_log l
      LEFT JOIN users u ON u.id=l.user_id
      WHERE (
            (l.entity_type='SECTOR' AND l.entity_id=?)
         OR (l.entity_type='ASSET' AND l.entity_id IN (SELECT id FROM assets WHERE sector_id=? AND (? IS NULL OR company_id=?)))
      )
        AND (? IS NULL OR COALESCE(l.company_id, u.company_id)=?)
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 80
    `).all(id, id, currentCompanyId(req), currentCompanyId(req), currentCompanyId(req), currentCompanyId(req));

    res.json({ ok:true, sector, tickets, audits });
  } catch (err) {
    console.error("Erro GET sector history:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar histórico do setor" });
  }
});

app.get("/api/admin/assets/:id/history", requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = db.prepare(`
      SELECT a.*, s.name AS sector_name, s.slug AS sector_slug
      FROM assets a
      LEFT JOIN sectors s ON s.id=a.sector_id
      WHERE a.id=? AND (? IS NULL OR COALESCE(a.company_id,s.company_id)=?)
    `).get(id, currentCompanyId(req), currentCompanyId(req));
    if (!asset) return res.status(404).json({ ok:false, error:"Equipamento não encontrado" });

    const tickets = db.prepare(`
      SELECT t.id, t.ticket_number, t.status, t.priority, t.description, t.created_at, t.resolved_at,
             a.patrimonio, a.name AS asset_name, a.brand AS asset_brand, a.model AS asset_model, a.sp_responsavel AS asset_sp_responsavel, a.sp_local AS asset_sp_local, a.sp_identificacao AS asset_sp_identificacao, a.sp_obs AS asset_sp_obs,
             i.name AS issue_name, COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      LEFT JOIN users u ON u.id=t.assigned_to_user_id
      WHERE t.asset_id=? AND (? IS NULL OR t.company_id=?) AND datetime(COALESCE(t.updated_at, t.created_at)) >= datetime('now', '-30 days')
      ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
      LIMIT 50
    `).all(id, currentCompanyId(req), currentCompanyId(req));

    const audits = db.prepare(`
      SELECT l.*, COALESCE(NULLIF(u.display_name,''), u.name) AS user_name
      FROM admin_audit_log l
      LEFT JOIN users u ON u.id=l.user_id
      WHERE l.entity_type='ASSET' AND l.entity_id=?
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 80
    `).all(id);

    res.json({ ok:true, asset, tickets, audits });
  } catch (err) {
    console.error("Erro GET asset history:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar histórico do equipamento" });
  }
});

app.get("/api/admin/qrcodes", requireAuth, (req, res) => {
  try {
    const baseUrl = String(PUBLIC_QR_BASE).replace(/\/$/, "");
    const cid = currentCompanyId(req);
    const company = cid ? db.prepare(`SELECT id,name,slug,logo_url FROM companies WHERE id=?`).get(cid) : null;
    const sectors = db.prepare(`
      SELECT id, name, slug, active, qr_block
      FROM sectors
      WHERE (? IS NULL OR company_id=?)
      ORDER BY COALESCE(NULLIF(qr_block,''),'SEM BLOCO') ASC, name ASC
    `).all(cid,cid);
    const ticketStats = db.prepare(`
      SELECT
        COUNT(DISTINCT t.id) AS total,
        COUNT(DISTINCT CASE WHEN t.status = 'NEW' THEN t.id END) AS new_total,
        COUNT(DISTINCT CASE WHEN t.status = 'IN_PROGRESS' THEN t.id END) AS progress_total,
        COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END) AS done_total
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      WHERE (? IS NULL OR COALESCE(t.company_id, s.company_id) = ?)
    `).get(cid,cid) || { total:0, new_total:0, progress_total:0, done_total:0 };
    const prefix = company?.slug ? `${baseUrl}/c/${company.slug}/s/` : `${baseUrl}/s/`;
    const qrs = sectors.map(s => { const cleanSlug = publicSectorSlug(company?.slug || '', s.slug); return ({ ...s, public_slug: cleanSlug, company_name: company?.name || '', company_slug: company?.slug || '', logo_url: company?.logo_url || '', url: `${prefix}${cleanSlug}` }); });
    res.json({
      ok:true,
      qrs,
      ticket_stats:{
        total:Number(ticketStats.total||0),
        new_total:Number(ticketStats.new_total||0),
        progress_total:Number(ticketStats.progress_total||0),
        done_total:Number(ticketStats.done_total||0)
      },
      ticketStats:{
        total:Number(ticketStats.total||0),
        new_total:Number(ticketStats.new_total||0),
        progress_total:Number(ticketStats.progress_total||0),
        done_total:Number(ticketStats.done_total||0)
      }
    });
  } catch (err) {
    console.error("Erro GET QR:", err);
    res.status(500).json({ ok:false, error:"Erro ao gerar links de QR" });
  }
});


// =========================
// V8 FULL ENTERPRISE - DASHBOARD, AUDITORIA E HISTÓRICO INTELIGENTE
// =========================
function safeRows(sql, params = []) {
  try { return db.prepare(sql).all(...params); } catch (err) { console.warn("SQL opcional falhou:", err.message); return []; }
}
function safeOne(sql, params = []) {
  try { return db.prepare(sql).get(...params) || {}; } catch (err) { console.warn("SQL opcional falhou:", err.message); return {}; }
}



// V52 - Lista enxuta para o dashboard de abertos.
// Garante que o painel lateral tenha o status, responsável e departamento reais do chamado.
app.get("/api/admin/dashboard-abertos", requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        t.id,
        COALESCE(t.ticket_number, t.id) AS ticket_number,
        CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS status,
        t.priority,
        t.description,
        t.created_at,
        t.updated_at,
CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
          t.resolved_at,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id = t.id
              AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE')
            ORDER BY tl.created_at DESC, tl.id DESC
            LIMIT 1
          )
        ) ELSE NULL END AS resolved_at,
        t.assigned_to_user_id,
        t.final_outcome,
        t.asset_id,
        t.service_id,
        s.name AS sector_name,
        CASE WHEN (sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE') THEN '' ELSE a.patrimonio END AS patrimonio,
        COALESCE(NULLIF(TRIM(sv.name),''), NULLIF(TRIM(sv.legacy_asset_name),''), NULLIF(TRIM(a.name),''), NULLIF(TRIM(i.asset_name),'')) AS asset_name,
        CASE WHEN (sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE') THEN '' ELSE a.brand END AS asset_brand,
        CASE WHEN (sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE') THEN '' ELSE a.model END AS asset_model,
        CASE WHEN sv.id IS NOT NULL THEN ${serviceDepartmentCaseSql('sv')} WHEN UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE' THEN COALESCE(NULLIF(TRIM(a.asset_department),''),'MANUTENCAO') ELSE COALESCE(NULLIF(TRIM(a.asset_department),''),'TI') END AS asset_department,
        CASE WHEN (sv.id IS NOT NULL OR UPPER(TRIM(COALESCE(a.asset_kind,'')))='SERVICE') THEN 'SERVICE' ELSE COALESCE(NULLIF(TRIM(a.asset_kind),''),'EQUIPMENT') END AS asset_kind,
        i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      WHERE UPPER(COALESCE(t.status,'NEW')) IN ('NEW','IN_PROGRESS')
        AND (? IS NULL OR COALESCE(t.company_id, s.company_id, a.company_id, sv.company_id)=?)
      ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
    `).all(currentCompanyId(req), currentCompanyId(req));
    gfShortenTicketListNames(rows);
    res.json({ ok:true, rows });
  } catch (err) {
    console.error("Erro GET dashboard-abertos:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar chamados abertos" });
  }
});

const __gfDashboardV8Cache = new Map();

app.get("/api/admin/dashboard-v8", requireAuth, (req, res) => {
  try {
    const cidDashCache = String(currentCompanyId(req) || 'all') + ':v20260620_all_rows';
    const cachedDash = __gfDashboardV8Cache.get(cidDashCache);

    // Cache curto: evita várias abas/celular repetindo consulta ao mesmo tempo.
    if (cachedDash && (Date.now() - cachedDash.at) < 12000) {
      res.setHeader('Cache-Control','private, max-age=12');
      return res.json(cachedDash.data);
    }

    const cid = currentCompanyId(req);

    // Dashboard = operação em tempo real.
    // Estatísticas históricas/rankings/agrupamentos ficam na Consulta.
    const stats = db.prepare(`
      SELECT
        SUM(CASE WHEN effective_status='NEW' THEN 1 ELSE 0 END) AS openNow,
        SUM(CASE WHEN effective_status='IN_PROGRESS' THEN 1 ELSE 0 END) AS progress,
        SUM(CASE WHEN effective_status='DONE' THEN 1 ELSE 0 END) AS doneToday,
        SUM(CASE WHEN effective_status<>'DONE' AND datetime(created_at) <= datetime('now','-2 days') THEN 1 ELSE 0 END) AS slaCritical
      FROM (
        SELECT
          CASE
            WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS'
            ELSE COALESCE(t.status,'NEW')
          END AS effective_status,
          t.created_at
        FROM tickets t
        LEFT JOIN sectors s ON s.id = t.sector_id
        WHERE (? IS NULL OR COALESCE(t.company_id, s.company_id)=?)
      ) x
    `).get(cid, cid) || {};

    const rows = db.prepare(`
      SELECT
        t.id,
        COALESCE(t.ticket_number, t.id) AS ticket_number,
        CASE
          WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS'
          ELSE COALESCE(t.status,'NEW')
        END AS status,
        t.priority,
        t.description,
        t.created_at,
        t.updated_at,
        CASE WHEN UPPER(COALESCE(t.status,'NEW'))='DONE' THEN COALESCE(
          t.resolved_at,
          (
            SELECT tl.created_at
            FROM ticket_logs tl
            WHERE tl.ticket_id=t.id
              AND tl.action IN ('TICKET_RESOLVED','TICKET_FINALIZED','RESOLUTION_NOTE')
            ORDER BY tl.created_at DESC, tl.id DESC
            LIMIT 1
          )
        ) ELSE NULL END AS resolved_at,
        t.assigned_to_user_id,
        t.final_outcome,
        t.technical_observation,
        t.asset_id,
        s.id AS sector_id,
        s.name AS sector_name,
        ${ticketServiceSelectFields()}
        i.name AS issue_name,
        u.id AS assigned_to_user_id,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_created_at
      FROM tickets t
      LEFT JOIN sectors s ON s.id = t.sector_id
      LEFT JOIN assets a ON a.id = t.asset_id
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id = t.issue_type_id
      LEFT JOIN users u ON u.id = t.assigned_to_user_id
      WHERE (? IS NULL OR COALESCE(t.company_id,s.company_id,a.company_id,sv.company_id)=?)
        AND (
          CASE
            WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS'
            ELSE COALESCE(t.status,'NEW')
          END IN ('NEW','IN_PROGRESS')
          OR datetime(COALESCE(t.updated_at,t.created_at)) >= datetime('now','-7 days')
        )
      ORDER BY
        CASE
          WHEN COALESCE(t.status,'NEW') IN ('NEW','IN_PROGRESS') THEN 0
          ELSE 1
        END,
        datetime(COALESCE(t.updated_at, t.created_at)) DESC,
        t.id DESC
      LIMIT 500
    `).all(cid, cid);

    gfShortenTicketListNames(rows);
    const payload = {
      ok:true,
      rows,
      cards:{
        openNow:Number(stats.openNow || 0),
        progress:Number(stats.progress || 0),
        slaCritical:Number(stats.slaCritical || 0),
        doneToday:Number(stats.doneToday || 0),
        avgMinutes:0,
        topTech:{name:'-',total:0},
        topSector:{name:'-',total:0},
        topAsset:{name:'-',total:0}
      },
      charts:{byDay:[], bySector:[], byAsset:[], avgBySector:[]},
      recentAudit:[]
    };

    __gfDashboardV8Cache.set(cidDashCache,{at:Date.now(),data:payload});
    res.setHeader('Cache-Control','private, max-age=12');
    return res.json(payload);
  } catch (err) {
    console.error("Erro dashboard-v8 leve:", err);
    res.status(500).json({ ok:false, error:"Erro ao carregar dashboard" });
  }
});


app.get("/api/admin/audit", requireAuth, (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 80), 200);
    const cid = currentCompanyId(req);
    const rows = safeRows(`
      SELECT l.*, COALESCE(NULLIF(u.display_name,''), u.name) AS user_name
      FROM admin_audit_log l
      LEFT JOIN users u ON u.id=l.user_id
      WHERE (? IS NULL OR COALESCE(l.company_id, u.company_id) = ?)
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT ?
    `, [cid, cid, limit]);
    res.json({ ok:true, audits: rows });
  } catch (err) {
    console.error("Erro audit:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar auditoria" });
  }
});

app.get("/api/admin/tickets/:id/history-smart", requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const ticket = db.prepare(`
      SELECT t.*, s.name AS sector_name, a.name AS asset_name, a.patrimonio, a.brand AS asset_brand, a.model AS asset_model, COALESCE(NULLIF(TRIM(a.asset_kind),''), CASE
          WHEN UPPER(TRIM(a.name)) IN ('LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MANUTENÇÃO PREDIAL','MARCENARIA','VIDRACARIA','VIDRAÇARIA','PASSAGEM DE CABO','LANÇAMENTO DE CABO','LANCAMENTO DE CABO','INSTALAÇÃO','INSTALACAO','CÂMERA','CAMERA','CABEAMENTO','REDE','TOMADA','LAMPADA','LÂMPADA','ELETRICA','ELÉTRICA','HIDRAULICA','HIDRÁULICA','PINTURA','ALVENARIA','REQUISICAO','REQUISIÇÃO','OUTRAS DEMANDAS','OUTROS') THEN 'SERVICE'
          ELSE 'EQUIPMENT'
        END) AS asset_kind, a.sp_responsavel AS asset_sp_responsavel, a.sp_local AS asset_sp_local, a.sp_identificacao AS asset_sp_identificacao, a.sp_obs AS asset_sp_obs, i.name AS issue_name
      FROM tickets t
      LEFT JOIN sectors s ON s.id=t.sector_id
      LEFT JOIN assets a ON a.id=t.asset_id
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      WHERE t.id=? AND (? IS NULL OR COALESCE(t.company_id, s.company_id, a.company_id)=?)
    `).get(id, currentCompanyId(req), currentCompanyId(req));
    if(!ticket) return res.status(404).json({ ok:false, error:"Chamado não encontrado" });
    const tickets30 = db.prepare(`
      SELECT t.id, t.ticket_number, t.status, t.priority, t.description, t.created_at, t.resolved_at,
             a.patrimonio, a.name AS asset_name, a.brand AS asset_brand, a.model AS asset_model, a.sp_responsavel AS asset_sp_responsavel, a.sp_local AS asset_sp_local, a.sp_identificacao AS asset_sp_identificacao, a.sp_obs AS asset_sp_obs, i.name AS issue_name, COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id
      LEFT JOIN issue_types i ON i.id=t.issue_type_id
      LEFT JOIN users u ON u.id=t.assigned_to_user_id
      WHERE t.sector_id=?
        AND (? IS NULL OR COALESCE(t.company_id, a.company_id)=?)
        AND datetime(COALESCE(t.updated_at, t.created_at)) >= datetime('now','-30 days') AND t.id<>?
      ORDER BY datetime(COALESCE(t.updated_at, t.created_at)) DESC, t.id DESC
      LIMIT 80
    `).all(ticket.sector_id, currentCompanyId(req), currentCompanyId(req), id);
    const sameProblem = tickets30.filter(t => (t.issue_name||'') && (t.issue_name||'') === (ticket.issue_name||''));
    const audits = safeRows(`
      SELECT l.*, COALESCE(NULLIF(u.display_name,''), u.name) AS user_name
      FROM admin_audit_log l LEFT JOIN users u ON u.id=l.user_id
      WHERE ((l.entity_type='SECTOR' AND l.entity_id=?) OR (l.entity_type='ASSET' AND l.entity_id=?))
        AND (? IS NULL OR COALESCE(l.company_id, u.company_id)=?)
      ORDER BY l.created_at DESC, l.id DESC LIMIT 50
    `, [ticket.sector_id, ticket.asset_id || 0, currentCompanyId(req), currentCompanyId(req)]);
    res.json({ ok:true, ticket, summary:{last30:tickets30.length, resolved:tickets30.filter(t=>t.status==='DONE').length, open:tickets30.filter(t=>t.status!=='DONE').length, repeated:sameProblem.length, repeatedAlert:sameProblem.length>=2}, tickets:tickets30, sameProblem, audits });
  } catch (err) {
    console.error("Erro history-smart:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar histórico inteligente" });
  }
});

app.get("/api/public/sectors/:slug/history", (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();

    const sector = resolvePublicSectorForRequest(req, slug);

    if(!sector) return publicNotFound(res, "Setor não encontrado");

    const tickets = db.prepare(`
      SELECT
        t.id,
        t.ticket_number,
        t.sector_id,
        CASE WHEN COALESCE(t.status,'NEW')='NEW' AND t.assigned_to_user_id IS NOT NULL THEN 'IN_PROGRESS' ELSE COALESCE(t.status,'NEW') END AS status,
        t.description,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.final_outcome,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=COALESCE(t.company_id,s.company_id)
          LIMIT 1
        ) AS rating_created_at,
        t.technical_observation,
${ticketServiceSelectFields()}
        i.name AS issue_name,
        COALESCE(NULLIF(u.display_name,''), u.name) AS assigned_to_name,
        COALESCE((
          SELECT tl.created_at
          FROM ticket_logs tl
          WHERE tl.ticket_id = t.id
            AND (
              tl.action IN ('TICKET_ASSIGNED','TICKET_REOPENED','TICKET_REOPENED_FOR_SWAP','TICKET_SWAP_PENDING')
              OR UPPER(COALESCE(tl.action,'')) LIKE '%ASSIGN%'
              OR UPPER(COALESCE(tl.action,'')) LIKE '%ASSUM%'
              OR UPPER(COALESCE(tl.notes,'')) LIKE 'CHAMADO ASSUMIDO%'
            )
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ), CASE WHEN t.assigned_to_user_id IS NOT NULL THEN t.updated_at ELSE NULL END) AS assigned_at,
        (
          SELECT tl.created_at
          FROM ticket_logs tl
          WHERE tl.ticket_id = t.id
            AND tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
            AND tl.user_id IS NOT NULL
          ORDER BY CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END, tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS resolved_by_at,
        (
          SELECT COALESCE(NULLIF(u2.display_name,''), u2.name)
          FROM ticket_logs tl
          LEFT JOIN users u2 ON u2.id = tl.user_id AND COALESCE(u2.company_id, ?) = ?
          WHERE tl.ticket_id = t.id
            AND tl.action IN ('TICKET_FINALIZED','TICKET_RESOLVED','RESOLUTION_NOTE')
            AND tl.user_id IS NOT NULL
          ORDER BY CASE WHEN tl.action='TICKET_FINALIZED' THEN 0 ELSE 1 END, tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS resolved_by_name,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='RESOLUTION_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS solution_note,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='PUBLIC_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS public_note,
        (
          SELECT created_at
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
            AND tl.action='PUBLIC_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS public_note_at,
        (
          SELECT COALESCE(NULLIF(u3.display_name,''), u3.name)
          FROM ticket_logs tl
          LEFT JOIN users u3 ON u3.id = tl.user_id AND COALESCE(u3.company_id, ?) = ?
          WHERE tl.ticket_id=t.id
            AND tl.action='PUBLIC_NOTE'
            AND COALESCE(TRIM(tl.notes),'') <> ''
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS public_note_by_name,
        (
          SELECT notes
          FROM ticket_logs tl
          WHERE tl.ticket_id=t.id
          ORDER BY tl.created_at DESC, tl.id DESC
          LIMIT 1
        ) AS last_note,
        (
          SELECT tr.stars
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_stars,
        (
          SELECT tr.comment
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_comment,
        (
          SELECT tr.created_at
          FROM ticket_ratings tr
          WHERE tr.ticket_id=t.id AND tr.company_id=?
          LIMIT 1
        ) AS rating_created_at
      FROM tickets t
      LEFT JOIN assets a ON a.id=t.asset_id AND COALESCE(a.company_id, ?) = ?
      ${ticketServiceJoinSql('t')}
      LEFT JOIN issue_types i ON i.id=t.issue_type_id AND COALESCE(i.company_id, ?) = ?
      LEFT JOIN users u ON u.id=t.assigned_to_user_id AND COALESCE(u.company_id, ?) = ?
      WHERE t.sector_id=? AND COALESCE(t.company_id, ?) = ?
      AND (
        UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO')
        OR (
          UPPER(TRIM(COALESCE(t.status,''))) IN ('DONE','FINALIZADO','RESOLVIDO')
          AND datetime(COALESCE(t.resolved_at, t.updated_at, t.created_at)) >= datetime('now','-30 days')
        )
      )
        AND (
          UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO')
          OR (
            UPPER(TRIM(COALESCE(t.status,''))) IN ('DONE','FINALIZADO','RESOLVIDO')
            AND datetime(COALESCE(t.resolved_at, t.updated_at, t.created_at)) >= datetime('now','-30 days')
          )
        )
      ORDER BY
        CASE
          WHEN UPPER(TRIM(COALESCE(t.status,''))) NOT IN ('DONE','CANCELED','CANCELLED','FINALIZADO','RESOLVIDO') THEN 0
          ELSE 1
        END,
        datetime(COALESCE(t.resolved_at,t.updated_at,t.created_at)) DESC,
        t.id DESC
    `).all(sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.company_id, sector.id, sector.company_id, sector.company_id).map(t => ({
      ...t,
      requester_update: t.public_note || "",
      public_note_by_name: t.public_note_by_name || t.assigned_to_name || "",
      description: t.description,
      public_note_at_br: formatDateBR(t.public_note_at),
      rating_created_at_br: formatDateBR(t.rating_created_at),
      technical_notes: getQrTechnicalNotes(t.id, sector.company_id),
      status_label: statusLabelBR(t.status),
      created_at_br: formatDateBR(t.created_at),
      updated_at_br: formatDateBR(t.updated_at),
      resolved_at_br: formatDateBR(t.resolved_at),
      assigned_at_br: formatDateBR(t.assigned_at),
      resolved_by_at_br: formatDateBR(t.resolved_by_at),
    }));

    gfShortenTicketListNames(tickets);
    res.json({ ok:true, sector, tickets });
  } catch (err) {
    console.error("Erro public history:", err);
    res.status(500).json({ ok:false, error:"Erro ao buscar histórico público" });
  }
});



// =========================
// V30 SAAS - ROTAS SUPER ADMIN
// =========================
app.get('/superadmin', requireAuth, requireSuperAdmin, (req,res)=>res.sendFile(path.join(FRONTEND_DIR,'superadmin.html')));
app.get('/superadmin.html', requireAuth, requireSuperAdmin, (req,res)=>res.sendFile(path.join(FRONTEND_DIR,'superadmin.html')));

app.get('/api/super/overview', requireAuth, requireSuperAdmin, (req,res)=>{
  try{
    const companies = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM users u WHERE u.company_id=c.id) AS users_count,
        (SELECT COUNT(*) FROM sectors s WHERE s.company_id=c.id) AS sectors_count,
        (SELECT COUNT(*) FROM assets a WHERE a.company_id=c.id) AS assets_count,
        (SELECT COUNT(*) FROM tickets t WHERE t.company_id=c.id) AS tickets_count,
        COALESCE((SELECT SUM(amount) FROM saas_finance f WHERE f.company_id=c.id AND f.type='RECEITA'),0) AS revenue_extra,
        COALESCE((SELECT SUM(amount) FROM saas_finance f WHERE f.company_id=c.id AND f.type='GASTO'),0) AS expenses_extra
      FROM companies c ORDER BY c.active DESC, c.name ASC
    `).all();
    const totals={
      companies:companies.length,
      active:companies.filter(c=>c.active===1).length,
      suspended:companies.filter(c=>c.active!==1).length,
      mrr:companies.filter(c=>c.active===1 && String(c.plan_status||'').toUpperCase()!=='SUSPENDED').reduce((a,c)=>a+Number(c.monthly_price||0),0),
      revenue:companies.reduce((a,c)=>a+Number(c.revenue_extra||0)+Number(c.monthly_price||0),0),
      expenses:companies.reduce((a,c)=>a+Number(c.expenses_extra||0),0)
    };
    res.json({ok:true, totals, companies});
  }catch(err){ console.error('Erro super overview:',err); res.status(500).json({ok:false,error:'Erro ao carregar Super Admin'}); }
});

app.post('/api/super/companies', requireAuth, requireSuperAdmin, uploadCompanyLogo.single('logo'), async (req,res)=>{
  try{
    const name=String(req.body.name||'').trim();
    const slug=slugify(req.body.slug||name);
    if(!name||!slug) return res.status(400).json({ok:false,error:'Informe nome e slug da empresa'});
    const logo=await resolveCompanyLogoUrl(req, '');
    const plan=String(req.body.plan_name||'BASIC').trim().toUpperCase();
    const status=String(req.body.plan_status||'TRIAL').trim().toUpperCase();
    const price=Number(req.body.monthly_price||0);
    const whatsappGroup=String(req.body.whatsapp_group_name||'').trim();
    const whatsappGroupTi=String(req.body.whatsapp_group_ti_name||'').trim();
    const whatsappGroupManutencao=String(req.body.whatsapp_group_manutencao_name||'').trim();
    const info=db.prepare(`INSERT INTO companies (name,slug,logo_url,contact_name,contact_email,contact_phone,plan_name,plan_status,monthly_price,active,notes,whatsapp_group_name,whatsapp_group_ti_name,whatsapp_group_manutencao_name) VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?)`)
      .run(name,slug,logo,String(req.body.contact_name||''),String(req.body.contact_email||''),String(req.body.contact_phone||''),plan,status,price,String(req.body.notes||''),whatsappGroup,whatsappGroupTi,whatsappGroupManutencao);
    let unitId=null;
    try{ unitId=db.prepare(`INSERT INTO units (company_id,name,city,state) VALUES (?,?,?,?)`).run(info.lastInsertRowid,'Unidade principal','','').lastInsertRowid; }catch(_){}
    const adminEmail=String(req.body.admin_email||'').trim().toLowerCase();
    const adminPass=String(req.body.admin_password||'');
    if(adminEmail && adminPass.length>=6){
      db.prepare(`INSERT INTO users (name,email,password_hash,role,active,company_id) VALUES (?,?,?,?,1,?)`)
        .run(String(req.body.admin_name||'Administrador'),adminEmail,hashPassword(adminPass),'ADMIN',info.lastInsertRowid);
    }
    auditAdmin(req,'COMPANY',info.lastInsertRowid,'COMPANY_CREATED',`Empresa SaaS criada: ${name}`);
    res.status(201).json({ok:true,id:info.lastInsertRowid, unit_id:unitId, public_link:`${String(PUBLIC_QR_BASE).replace(/\/$/,'')}/c/${slug}`});
  }catch(err){ console.error('Erro criar empresa:',err); res.status(500).json({ok:false,error:'Erro ao criar empresa. Verifique se o slug já existe.'}); }
});
app.put('/api/super/companies/:id', requireAuth, requireSuperAdmin, uploadCompanyLogo.single('logo'), async (req,res)=>{
  try{
    const id=Number(req.params.id);
    const c=db.prepare(`SELECT * FROM companies WHERE id=?`).get(id);
    if(!c) return res.status(404).json({ok:false,error:'Empresa não encontrada'});
    const active = req.body.active === false || String(req.body.active)==='0' ? 0 : 1;
    const nextLogoUrl=await resolveCompanyLogoUrl(req, c.logo_url || '');
    
    const companyCols = tableCols('companies');
    const setUpdatedAt = companyCols.includes('updated_at') ? ', updated_at=CURRENT_TIMESTAMP' : '';
    db.prepare(`UPDATE companies SET name=?, slug=?, logo_url=?, contact_name=?, contact_email=?, contact_phone=?, plan_name=?, plan_status=?, monthly_price=?, active=?, suspended_at=CASE WHEN ?=0 THEN COALESCE(suspended_at,CURRENT_TIMESTAMP) ELSE NULL END, notes=?, whatsapp_group_name=?, whatsapp_group_ti_name=?, whatsapp_group_manutencao_name=?${setUpdatedAt} WHERE id=?`)
      .run(String(req.body.name||c.name).trim(), slugify(req.body.slug||c.slug||c.name), nextLogoUrl, String(req.body.contact_name??c.contact_name??''), String(req.body.contact_email??c.contact_email??''), String(req.body.contact_phone??c.contact_phone??''), String(req.body.plan_name||c.plan_name||'BASIC').toUpperCase(), String(req.body.plan_status||c.plan_status||'ACTIVE').toUpperCase(), Number(req.body.monthly_price??c.monthly_price??0), active, active, String(req.body.notes??c.notes??''), String(req.body.whatsapp_group_name??c.whatsapp_group_name??''), String(req.body.whatsapp_group_ti_name??c.whatsapp_group_ti_name??''), String(req.body.whatsapp_group_manutencao_name??c.whatsapp_group_manutencao_name??''), id);
    res.json({ok:true});
  }catch(err){ console.error('Erro editar empresa:',err); res.status(500).json({ok:false,error:'Erro ao editar empresa'}); }
});
app.post('/api/super/companies/:id/finance', requireAuth, requireSuperAdmin, (req,res)=>{
  try{
    const id=Number(req.params.id); const type=String(req.body.type||'RECEITA').toUpperCase()==='GASTO'?'GASTO':'RECEITA';
    const amount=Number(req.body.amount||0); if(!amount) return res.status(400).json({ok:false,error:'Informe o valor'});
    db.prepare(`INSERT INTO saas_finance (company_id,type,amount,description,reference_date) VALUES (?,?,?,?,?)`).run(id,type,amount,String(req.body.description||''),String(req.body.reference_date||new Date().toISOString().slice(0,10)));
    res.status(201).json({ok:true});
  }catch(err){ console.error('Erro financeiro super:',err); res.status(500).json({ok:false,error:'Erro ao lançar financeiro'}); }
});
app.get('/api/super/companies/:id/finance', requireAuth, requireSuperAdmin, (req,res)=>{
  try{ const id=Number(req.params.id); const rows=db.prepare(`SELECT * FROM saas_finance WHERE company_id=? ORDER BY reference_date DESC, id DESC LIMIT 200`).all(id); res.json({ok:true, rows}); }
  catch(err){ res.status(500).json({ok:false,error:'Erro ao listar financeiro'}); }
});


// SAAS: permite Super Admin trocar o contexto do painel normal para uma empresa específica.
app.get("/admin-company/:companySlug", requireAuth, (req, res) => {
  try {
    if (!isSuperAdminUser(req.user)) return res.redirect("/admin.html");
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const company = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE slug=? LIMIT 1`).get(companySlug);
    if (!company) return res.status(404).send("Empresa não encontrada");
    if (Number(company.active || 0) !== 1 || String(company.plan_status || "").toUpperCase() === "SUSPENDED") return res.status(403).send("Empresa suspensa ou inativa");

    const cookies = parseCookies(req);
    const cookieName = sessionCookieName(company.slug);
    const token = cookies[cookieName] || cookies.gf_session;
    const session = token ? sessions.get(token) : null;
    if (session) {
      session.companyId = company.id;
      session.companySlug = company.slug;
      sessions.set(token, session);
    }
    res.setHeader("Set-Cookie", `gf_company_slug=${encodeURIComponent(company.slug)}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    return res.redirect(`/c/${encodeURIComponent(company.slug)}/admin`);
  } catch (err) {
    console.error("Erro /admin-company:", err);
    return res.status(500).send("Erro ao abrir painel da empresa");
  }
});

// =========================
// PÁGINAS
// =========================


// SAAS: admin da empresa com URL identificada. Use /c/empresa/admin para não perder o contexto.
app.get('/c/:companySlug/admin', requireAuth, (req, res) => {
  try {
    const companySlug = String(req.params.companySlug || '').trim().toLowerCase();
    const company = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE slug=? LIMIT 1`).get(companySlug);
    if (!company) return res.status(404).send('Empresa não encontrada');
    if (Number(company.active || 0) !== 1 || String(company.plan_status || '').toUpperCase() === 'SUSPENDED') return res.status(403).send('Empresa suspensa ou inativa');
    if (!isSuperAdminUser(req.user) && Number(req.user.company_id || 0) !== Number(company.id)) return res.status(403).send('Usuário não pertence a esta empresa');
    const cookies = parseCookies(req);
    const cookieName = sessionCookieName(company.slug);
    const token = cookies[cookieName] || cookies.gf_session;
    const session = token ? sessions.get(token) : null;
    if (session) { session.companyId = company.id; session.companySlug = company.slug; sessions.set(token, session); }
    res.append('Set-Cookie', `gf_company_slug=${encodeURIComponent(company.slug)}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    return sendCompanyHtml(req, res, 'admin.html', company);
  } catch (err) {
    console.error('Erro /c/:companySlug/admin:', err);
    return res.status(500).send('Erro ao abrir painel da empresa');
  }
});

function redirectAdminToCompanyIfNeeded(req, res) {
  try {
    const cookies = parseCookies(req);
    const token = cookies.gf_session;
    const session = token ? sessions.get(token) : null;
    const companySlug = String(session?.companySlug || cookies.gf_company_slug || "").trim().toLowerCase();

    // Se existe empresa no contexto, a URL correta do painel é /c/empresa/admin.
    // Assim refresh, logout e navegação nunca perdem a empresa atual.
    if (companySlug) {
      return res.redirect(`/c/${encodeURIComponent(companySlug)}/admin`);
    }
  } catch(_){}

  try {
    const cid = currentCompanyId(req) || req.user?.company_id;
    const company = cid ? db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE id=? LIMIT 1`).get(cid) : null;
    return sendCompanyHtml(req, res, "admin.html", company);
  } catch (_) {
    return res.sendFile(path.join(FRONTEND_DIR, "admin.html"));
  }
}

app.get("/admin", requireAuth, (req, res) => {
  return redirectAdminToCompanyIfNeeded(req, res);
});

app.get("/admin.html", requireAuth, (req, res) => {
  return redirectAdminToCompanyIfNeeded(req, res);
});


// Link principal de cada empresa SaaS.
// Ex.: /c/frango-americano -> grava a empresa no cookie e abre o login dela.
app.get("/c/:companySlug", (req, res) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const company = db.prepare(`
      SELECT id, name, slug, logo_url, plan_name, active, plan_status
      FROM companies
      WHERE slug = ?
      LIMIT 1
    `).get(companySlug);

    if (!company) return res.status(404).send("Empresa não encontrada");
    if (Number(company.active || 0) !== 1 || String(company.plan_status || "").toUpperCase() === "SUSPENDED") {
      return res.status(403).send("Empresa suspensa ou inativa");
    }

    res.setHeader("Set-Cookie", `gf_company_slug=${encodeURIComponent(company.slug)}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    return res.redirect(`/login?company=${encodeURIComponent(company.slug)}`);
  } catch (err) {
    console.error("Erro rota /c/:companySlug:", err);
    return res.status(500).send("Erro interno ao abrir empresa");
  }
});

app.get("/c/:companySlug/s/:slug", (req, res) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const company = db.prepare(`SELECT id, name, slug, logo_url, plan_name, plan_status, active FROM companies WHERE slug=? LIMIT 1`).get(companySlug);
    if (!company) return res.status(404).send("Empresa não encontrada");
    if (Number(company.active || 0) !== 1 || String(company.plan_status || "").toUpperCase() === "SUSPENDED") return res.status(403).send("Empresa suspensa ou inativa");
    setCompanyCookie(res, company.slug);
    if (fs.existsSync(path.join(FRONTEND_DIR, "qr.html"))) return sendCompanyHtml(req, res, "qr.html", company);
    if (fs.existsSync(path.join(FRONTEND_DIR, "public.html"))) return sendCompanyHtml(req, res, "public.html", company);
    return res.status(404).send("Arquivo público do QR não encontrado no frontend: qr.html");
  } catch (err) {
    console.error("Erro rota QR empresa:", err);
    return res.status(500).send("Erro interno ao abrir QR da empresa");
  }
});

app.get("/s/:slug", (req, res) => {
  // Compatibilidade com QR antigo /s/:slug.
  // Agora tenta descobrir a empresa dona do setor e injeta nome/logo dela.
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const rowSector = resolvePublicSector('', slug);
    const row = rowSector ? { id: rowSector.company_id, name: rowSector.company_name, slug: rowSector.company_slug, logo_url: rowSector.logo_url, plan_name: rowSector.plan_name, plan_status: rowSector.plan_status, active: rowSector.company_active } : null;
    if (row && Number(row.active || 0) === 1 && String(row.plan_status || "").toUpperCase() !== "SUSPENDED") {
      setCompanyCookie(res, row.slug);
      // Mantém /s/:slug funcionando, mas entrega o QR com a empresa injetada.
      // Não redireciona para não quebrar QR antigo nem links já impressos.
      if (fs.existsSync(path.join(FRONTEND_DIR, "qr.html"))) return sendCompanyHtml(req, res, "qr.html", row);
      if (fs.existsSync(path.join(FRONTEND_DIR, "public.html"))) return sendCompanyHtml(req, res, "public.html", row);
    }
  } catch (err) {
    console.warn("[SAAS] Não foi possível identificar empresa do QR /s/:slug:", err.message);
  }

  const qrPath = path.join(FRONTEND_DIR, "qr.html");
  const legacyPublicPath = path.join(FRONTEND_DIR, "public.html");
  if (fs.existsSync(qrPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(injectQrHistoryModalFix(fs.readFileSync(qrPath, 'utf8'), 'qr.html'));
  }
  if (fs.existsSync(legacyPublicPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(injectQrHistoryModalFix(fs.readFileSync(legacyPublicPath, 'utf8'), 'public.html'));
  }
  return res.status(404).send("Arquivo público do QR não encontrado no frontend: qr.html");
});

app.use(express.static(FRONTEND_DIR));

app.listen(PORT, () => {
  console.log("======================================");
  console.log(" GUARÁ FACILITIES API ATIVA");
  console.log(` http://127.0.0.1:${PORT}`);
  console.log(" Admin padrão:", DEFAULT_ADMIN_EMAIL, "/ senha:", DEFAULT_ADMIN_PASSWORD);
  console.log("======================================");
});

// AJUSTE VALDEMIR V3 - índices extras para deixar Tipos de Problema/Serviços fluido sem misturar empresas.
try {
  if (typeof db !== 'undefined') {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company_active_name_asset ON issue_types(company_id, active, name, asset_name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_types_company_active_asset ON issue_types(company_id, active, asset_name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_assets_company_status_kind_name ON assets(company_id, status, asset_kind, name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_services_company_active_name ON services(company_id, active, name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sectors_company_active_name ON sectors(company_id, active, name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_type_sectors_company_issue_active ON issue_type_sectors(company_id, issue_type_id, active, sector_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_issue_type_sectors_company_sector_active ON issue_type_sectors(company_id, sector_id, active)`).run();
  }
} catch (err) {
  console.warn('[PERF] Índices extras não aplicados:', err.message);
}
