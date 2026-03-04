const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFile } = require('child_process');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PORT = process.env.PORT || 4444;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'sync-doc.js');

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function resolveDocIdFromLookup(queryKey, queryValue) {
  if (!queryValue) return null;
  if (queryKey === 'docid' || queryKey === 'doc_id') return queryValue;

  const primaryLookupPath = path.join(PROJECT_ROOT, 'public', 'snapshots', '_lookup.json');
  const legacyLookupPath = path.join(PROJECT_ROOT, 'public', 'data_cache', '_lookup.json');
  const lookupPath = fs.existsSync(primaryLookupPath) ? primaryLookupPath : legacyLookupPath;

  if (!fs.existsSync(lookupPath)) return null;

  try {
    const lookup = JSON.parse(fs.readFileSync(lookupPath, 'utf8'));
    const normalizedKey = queryKey === 'doc_id' ? 'docid' : queryKey;
    const map = lookup?.[normalizedKey] || lookup?.[queryKey] || {};
    return map[String(queryValue).toLowerCase()] || null;
  } catch {
    return null;
  }
}

function runSyncDoc(docId) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [SYNC_SCRIPT_PATH, docId],
      {
        cwd: PROJECT_ROOT,
        timeout: 10 * 60 * 1000,
        env: process.env,
        maxBuffer: 1024 * 1024 * 20
      },
      (error, stdout, stderr) => {
        if (error) {
          const message = String(stderr || stdout || error.message || '').trim();
          if (/not recognized as an internal or external command/i.test(message)) {
            reject(new Error('sync-doc failed: mongoexport is not installed or not in PATH.'));
            return;
          }

          const condensed = message.split(/\r?\n/).slice(0, 6).join(' ');
          reject(new Error(condensed || 'sync-doc failed'));
          return;
        }

        resolve({
          stdout: String(stdout || ''),
          stderr: String(stderr || '')
        });
      }
    );
  });
}

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, `http://localhost:${PORT}`);

    if (requestUrl.pathname === '/health') {
      return jsonResponse(res, 200, {
        status: 'ok',
        port: Number(PORT)
      });
    }

    if (requestUrl.pathname === '/sync-doc') {
      if (req.method !== 'POST') {
        return jsonResponse(res, 405, { error: 'Method Not Allowed' });
      }

      const body = await parseRequestBody(req);
      const parsed = body ? JSON.parse(body) : {};
      const queryKey = String(parsed.key || 'docid').toLowerCase();
      const queryValue = String(parsed.value || '').trim();

      if (!queryValue) {
        return jsonResponse(res, 400, { error: 'Missing key/value for sync request' });
      }

      const docId = resolveDocIdFromLookup(queryKey, queryValue);
      if (!docId) {
        return jsonResponse(res, 404, {
          error: `Unable to resolve docid from ${queryKey}`
        });
      }

      const result = await runSyncDoc(docId);
      return jsonResponse(res, 200, {
        ok: true,
        docid: docId,
        output: result.stdout
      });
    }

    return jsonResponse(res, 404, { error: 'Not Found' });
  } catch (error) {
    return jsonResponse(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`Lightweight wrapper running at http://localhost:${PORT}`);
  console.log('Endpoints: GET /health, POST /sync-doc');
});
