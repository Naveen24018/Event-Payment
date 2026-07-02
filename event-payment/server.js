import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// --- Basic auth middleware for admin-only routes ---
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [user, password] = credentials.split(':');

  if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Invalid credentials');
}

// --- Database setup ---
// Ensure data/ and db.json exist before lowdb tries to read them
import fs from 'fs';
const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbFile) || fs.readFileSync(dbFile, 'utf-8').trim() === '') {
  fs.writeFileSync(dbFile, JSON.stringify({ submissions: [] }));
}
const defaultData = { submissions: [] };
const db = await JSONFilePreset(dbFile, defaultData);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend (public/ folder) as static files
app.use(express.static(path.join(__dirname, 'public')));

// --- API: save a new guest submission ---
app.post('/api/submissions', async (req, res) => {
  try {
    const { name, relation, amount } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ error: 'Name and amount are required' });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const submission = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: String(name).trim().slice(0, 100),
      relation: relation ? String(relation).trim().slice(0, 100) : 'Guest',
      amount: numericAmount,
      createdAt: new Date().toISOString(),
    };

    db.data.submissions.push(submission);
    await db.write();

    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// --- Admin page (password-protected) ---
app.get('/admin.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// --- API: list all submissions (e.g. for the host to review) ---
app.get('/api/submissions', requireAdminAuth, async (req, res) => {
  try {
    await db.read();
    const submissions = [...db.data.submissions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({ submissions });
  } catch (err) {
    console.error('Error reading submissions:', err);
    res.status(500).json({ error: 'Failed to read submissions' });
  }
});

// --- API: simple health check (useful for Render) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
