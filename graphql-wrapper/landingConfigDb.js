const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'landing.sqlite3');
const LANDING_META_PATH = path.join(PROJECT_ROOT, 'src', 'config', 'landing-meta.json');

fs.mkdirSync(DB_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS landing_clients (
    client_key TEXT PRIMARY KEY,
    theme TEXT NOT NULL,
    header_logo_name TEXT,
    header_logo_alt TEXT,
    header_logo_width TEXT,
    header_logo_height TEXT,
    footer_logo_name TEXT,
    footer_logo_alt TEXT,
    footer_logo_height TEXT,
    favicon_name TEXT,
    favicon_alt TEXT,
    website TEXT,
    updated_at TEXT NOT NULL
  )
`);

/** Seeds/refreshes landing_clients from landing-meta.json (JSON stays the source of truth for seeding). */
function seedFromLandingMetaJson() {
  if (!fs.existsSync(LANDING_META_PATH)) return;

  const meta = JSON.parse(fs.readFileSync(LANDING_META_PATH, 'utf8'));
  const logoConfig = meta.logo || {};

  const upsert = db.prepare(`
    INSERT INTO landing_clients (
      client_key, theme,
      header_logo_name, header_logo_alt, header_logo_width, header_logo_height,
      footer_logo_name, footer_logo_alt, footer_logo_height,
      favicon_name, favicon_alt, website, updated_at
    ) VALUES (
      :client_key, :theme,
      :header_logo_name, :header_logo_alt, :header_logo_width, :header_logo_height,
      :footer_logo_name, :footer_logo_alt, :footer_logo_height,
      :favicon_name, :favicon_alt, :website, :updated_at
    )
    ON CONFLICT(client_key) DO UPDATE SET
      theme = excluded.theme,
      header_logo_name = excluded.header_logo_name,
      header_logo_alt = excluded.header_logo_alt,
      header_logo_width = excluded.header_logo_width,
      header_logo_height = excluded.header_logo_height,
      footer_logo_name = excluded.footer_logo_name,
      footer_logo_alt = excluded.footer_logo_alt,
      footer_logo_height = excluded.footer_logo_height,
      favicon_name = excluded.favicon_name,
      favicon_alt = excluded.favicon_alt,
      website = excluded.website,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();

  for (const [clientKey, entry] of Object.entries(logoConfig)) {
    const headerLogo = entry['header-logo'] || {};
    const footerLogo = entry['footer-logo'] || {};
    const favicon = entry.favicon || {};

    upsert.run({
      client_key: clientKey,
      theme: entry.theme || 'primary',
      header_logo_name: headerLogo.name || null,
      header_logo_alt: headerLogo.alt || null,
      header_logo_width: headerLogo.width || null,
      header_logo_height: headerLogo.height || null,
      footer_logo_name: footerLogo.name || null,
      footer_logo_alt: footerLogo.alt || null,
      footer_logo_height: footerLogo.height || null,
      favicon_name: favicon.name || null,
      favicon_alt: favicon.alt || null,
      website: entry.website || null,
      updated_at: now
    });
  }
}

function rowToLandingConfig(row) {
  if (!row) return null;

  return {
    clientKey: row.client_key,
    theme: row.theme,
    logo: {
      header: {
        name: row.header_logo_name,
        alt: row.header_logo_alt,
        width: row.header_logo_width,
        height: row.header_logo_height
      },
      footer: {
        name: row.footer_logo_name,
        alt: row.footer_logo_alt,
        height: row.footer_logo_height
      }
    },
    favicon: {
      name: row.favicon_name,
      alt: row.favicon_alt
    },
    website: row.website,
    updatedAt: row.updated_at
  };
}

function getLandingConfig(clientKey) {
  const row = db.prepare('SELECT * FROM landing_clients WHERE client_key = ?').get(clientKey);
  return rowToLandingConfig(row);
}

seedFromLandingMetaJson();

module.exports = { getLandingConfig, seedFromLandingMetaJson };
