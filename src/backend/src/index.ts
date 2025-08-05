import express from 'express';
import bodyParser from 'body-parser';
import { Log } from '../../Logging-Middleware/logger';

const app = express();
app.use(bodyParser.json());

// In-memory store for shortened URLs and stats
const db: Record<string, {
  longUrl: string;
  expiry: number;
  createdAt: number;
  clicks: Array<{
    timestamp: number;
    referrer?: string;
    location?: string;
  }>;
}> = {};

// Generate a shortcode of given length
function generateCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate shortcode format (alphanumeric, 4–10 chars)
function isValidShortcode(code: string): boolean {
  return /^[a-zA-Z0-9]{4,10}$/.test(code);
}

// Create short URL
app.post('/shorturls', (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;

    if (!url) {
      throw new Error("Missing 'url'");
    }

    let code = shortcode || generateCode();

    if (!isValidShortcode(code)) {
      throw new Error("Invalid shortcode format");
    }

    if (db[code]) {
      throw new Error("Shortcode already exists");
    }

    const expiry = Date.now() + ((validity || 30) * 60 * 1000); // default 30 minutes

    db[code] = {
      longUrl: url,
      expiry,
      createdAt: Date.now(),
      clicks: []
    };

    Log("backend", "info", "route", `Short URL created: ${code} for ${url}`);
    res.status(201).json({
      shortLink: `http://localhost:3000/shorturls/${code}`,
      expiry: new Date(expiry).toISOString()
    });
  } catch (err: any) {
    Log("backend", "error", "route", err.message);
    res.status(400).json({ error: err.message });
  }
});

// Redirect using shortcode
app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const entry = db[shortcode];

  if (!entry) {
    Log("backend", "warn", "route", `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: "Shortcode does not exist" });
  }

  if (Date.now() > entry.expiry) {
    delete db[shortcode];
    Log("backend", "info", "route", `Expired shortcode: ${shortcode}`);
    return res.status(410).json({ error: "Link has expired" });
  }

  entry.clicks.push({
    timestamp: Date.now(),
    referrer: req.get('Referrer') || undefined,
    location: "unknown" // placeholder
  });

  Log("backend", "info", "route", `Redirecting shortcode: ${shortcode} -> ${entry.longUrl}`);
  res.redirect(entry.longUrl);
});

// Get stats for a shortcode
app.get('/shorturls/:shortcode/stats', (req, res) => {
  const { shortcode } = req.params;
  const entry = db[shortcode];

  if (!entry) {
    Log("backend", "warn", "route", `Stats not found: ${shortcode}`);
    return res.status(404).json({ error: "Shortcode does not exist" });
  }

  const response = {
    originalUrl: entry.longUrl,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiry: new Date(entry.expiry).toISOString(),
    totalClicks: entry.clicks.length,
    clicks: entry.clicks.map(click => ({
      timestamp: new Date(click.timestamp).toISOString(),
      referrer: click.referrer,
      location: click.location
    }))
  };

  Log("backend", "info", "route", `Stats retrieved for shortcode: ${shortcode}`);
  res.json(response);
});

// Server start
app.listen(3000, () => {
  Log("backend", "info", "route", "Server started on port 3000");
});
