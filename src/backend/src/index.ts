import express from 'express';
import bodyParser from 'body-parser';
import { Log } from '../../Logging-Middleware/logger';


const app = express();
app.use(bodyParser.json());

const db: Record<string, { longUrl: string; expiry: number }> = {};

function generateCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isValidShortcode(code: string): boolean {
  return /^[a-zA-Z0-9]{4,10}$/.test(code);
}

app.post('/shorten', (req, res) => {
  try {
    const { longUrl, validityInMinutes, shortcode } = req.body;

    if (!longUrl) {
      throw new Error("Missing 'longUrl'");
    }

    let code = shortcode || generateCode();
    if (!isValidShortcode(code)) throw new Error("Invalid shortcode format");

    if (db[code]) throw new Error("Shortcode already exists");

    const expiry = Date.now() + ((validityInMinutes || 30) * 60 * 1000); // default 30 mins
    db[code] = { longUrl, expiry };

    Log("backend", "info", "route", `Short URL created: ${code}`);
    res.status(201).json({ shortUrl: `http://localhost:3000/${code}`, code });
  } catch (err: any) {
    Log("backend", "error", "route", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/:shortcode', (req, res) => {
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

  Log("backend", "info", "route", `Redirecting: ${shortcode} -> ${entry.longUrl}`);
  res.redirect(entry.longUrl);
});

app.listen(3000, () => {
  Log("backend", "info", "route", "Server started on port 3000");
});
