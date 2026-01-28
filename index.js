const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ejemplo: mongodb://10.10.2.4:27017/mean
const MONGO_URL = process.env.MONGO_URL || "";
const DB_NAME = process.env.MONGO_DB || "mean";
const COLLECTION = process.env.MONGO_COL || "items";

let mongo = {
  ok: false,
  lastCheck: null,
  error: "not checked yet",
};

let client = null;

async function getCollection() {
  if (!MONGO_URL) throw new Error("MONGO_URL is empty");
  if (!client) {
    client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
  }
  return client.db(DB_NAME).collection(COLLECTION);
}

async function checkMongo() {
  try {
    const col = await getCollection();
    await col.database.command({ ping: 1 });
    mongo = { ok: true, lastCheck: new Date().toISOString(), error: null };
  } catch (e) {
    mongo = { ok: false, lastCheck: new Date().toISOString(), error: String(e.message || e) };
    // Si el cliente quedó en mal estado, lo reseteamos
    try { await client?.close(); } catch {}
    client = null;
  }
}

setInterval(checkMongo, 10_000);
checkMongo();

// Home
app.get("/", (req, res) => {
  res.status(200).send("Node app OK. Prueba /health, /mongo-health y /api/items");
});

// Probe para el balanceador: SIEMPRE 200
app.get("/health", (req, res) => {
  res.status(200).json({ app: "ok", time: new Date().toISOString() });
});

// Estado de Mongo (no rompe el probe)
app.get("/mongo-health", (req, res) => {
  res.status(200).json({ mongoUrlSet: Boolean(MONGO_URL), mongo });
});

// CRUD mínimo
app.get("/api/items", async (req, res) => {
  try {
    const col = await getCollection();
    const items = await col.find({}).sort({ _id: -1 }).limit(50).toArray();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const col = await getCollection();
    const r = await col.insertOne({ name, createdAt: new Date() });
    res.status(201).json({ id: r.insertedId });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    const col = await getCollection();
    const id = new ObjectId(req.params.id);
    const r = await col.deleteOne({ _id: id });
    res.json({ deleted: r.deletedCount });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on ${PORT}`);
});
