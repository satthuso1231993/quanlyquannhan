import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import * as xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(process.cwd(), "Data.xlsx");

// Initialize database
function initDB() {
  if (!fs.existsSync(DATA_FILE)) {
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ id: '_init' }]), "auth_users");
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ id: '_init' }]), "users");
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([{ id: '_init' }]), "personnel");
    const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(DATA_FILE, out);
  }
}

initDB();

function getSheetData(sheetName: string) {
  if (!fs.existsSync(DATA_FILE)) initDB();
  const fileParams = fs.readFileSync(DATA_FILE);
  const wb = xlsx.read(fileParams, { type: 'buffer' });
  if (!wb.Sheets[sheetName]) {
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet([]), sheetName);
    const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(DATA_FILE, out);
    return [];
  }
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
  return data.filter((row: any) => row.id !== '_init').map((row: any) => {
    const { id, ...rest } = row;
    try {
      const parsedRest: any = {};
      for (const key in rest) {
          if (typeof rest[key] === 'string' && (rest[key].startsWith('{') || rest[key].startsWith('['))) {
              try { parsedRest[key] = JSON.parse(rest[key]); } catch { parsedRest[key] = rest[key]; }
          } else {
              parsedRest[key] = rest[key];
          }
      }
      return { id, ...parsedRest };
    } catch {
       return {id, ...rest};
    }
  });
}

function saveSheetData(sheetName: string, items: any[]) {
  const fileParams = fs.readFileSync(DATA_FILE);
  const wb = xlsx.read(fileParams, { type: 'buffer' });
  const flattened = items.map(item => {
    const { id, ...rest } = item;
    const flat: any = { id };
    for (const key in rest) {
        if (typeof rest[key] === 'object' && rest[key] !== null) {
            flat[key] = JSON.stringify(rest[key]);
        } else {
            flat[key] = rest[key];
        }
    }
    return flat;
  });
  
  const ws = xlsx.utils.json_to_sheet(flattened);
  wb.Sheets[sheetName] = ws;
  if (!wb.SheetNames.includes(sheetName)) {
    wb.SheetNames.push(sheetName);
  }
  const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(DATA_FILE, out);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get('/api/db/:collection', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/db/:collection/:id', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      const item = data.find((d: any) => d.id === req.params.id);
      res.json(item || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/db/:collection', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      const id = req.body.id || Math.random().toString(36).substr(2, 9);
      const newItem = { ...req.body, id };
      data.push(newItem);
      saveSheetData(req.params.collection, data);
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/db/:collection/:id', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      const id = req.params.id;
      const index = data.findIndex((d: any) => d.id === id);
      const toSave = { ...req.body, id };
      if (index > -1) {
        data[index] = toSave;
      } else {
        data.push(toSave);
      }
      saveSheetData(req.params.collection, data);
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/db/:collection/:id', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      const id = req.params.id;
      const index = data.findIndex((d: any) => d.id === id);
      if (index > -1) {
        data[index] = { ...data[index], ...req.body, id };
        saveSheetData(req.params.collection, data);
      }
      res.json({ id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/db/:collection/:id', (req, res) => {
    try {
      const data = getSheetData(req.params.collection);
      const id = req.params.id;
      const newData = data.filter((d: any) => d.id !== id);
      saveSheetData(req.params.collection, newData);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Example API for Reports (Server-side calculation)
  app.get("/api/reports/summary", (req, res) => {
    // In a real app, you might fetch from Firestore Admin SDK here
    res.json({ message: "Summary data endpoint ready" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
