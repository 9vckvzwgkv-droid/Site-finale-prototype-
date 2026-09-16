import express from "express";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET =
  process.env.JWT_SECRET || (!isProd ? "dev-only-change-me" : null);
if (!JWT_SECRET) throw new Error("JWT_SECRET est obligatoire en production.");
const dbDir = path.join(__dirname, "data");
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, "maelie.sqlite"));
db.pragma("journal_mode=WAL");
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,first_name TEXT DEFAULT '',last_name TEXT DEFAULT '',role TEXT DEFAULT 'customer',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT DEFAULT '',price_cents INTEGER NOT NULL CHECK(price_cents>=0),old_price_cents INTEGER,image TEXT NOT NULL,badge TEXT DEFAULT '',stock INTEGER DEFAULT 0 CHECK(stock>=0),active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,number TEXT UNIQUE NOT NULL,email TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',subtotal_cents INTEGER NOT NULL,shipping_cents INTEGER NOT NULL,discount_cents INTEGER DEFAULT 0,total_cents INTEGER NOT NULL,address_json TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER NOT NULL,name TEXT NOT NULL,price_cents INTEGER NOT NULL,quantity INTEGER NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(product_id) REFERENCES products(id));`);
const statuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const adminEmail = (
    process.env.ADMIN_EMAIL || "admin@maelie.local"
  ).toLowerCase(),
  adminPassword =
    process.env.ADMIN_PASSWORD || (!isProd ? "ChangeMe123!" : null);
if (
  adminPassword &&
  !db.prepare("SELECT id FROM users WHERE email=?").get(adminEmail)
)
  db.prepare(
    "INSERT INTO users(email,password_hash,first_name,last_name,role) VALUES(?,?,?,?,?)",
  ).run(
    adminEmail,
    bcrypt.hashSync(adminPassword, 12),
    "Admin",
    "MAELIE",
    "admin",
  );
const seed = [
  [
    "robe-eclat",
    "Robe Éclat",
    "Mode",
    "Une robe fluide et lumineuse.",
    6990,
    8990,
    "img/produits/robe-eclat.svg",
    "Bestseller",
    12,
  ],
  [
    "bracelet-luna",
    "Bracelet Luna",
    "Bijoux",
    "Un bracelet délicat et lumineux.",
    2990,
    null,
    "img/produits/bracelet-luna.svg",
    "Nouveau",
    25,
  ],
  [
    "collier-perle",
    "Collier Perlé",
    "Bijoux",
    "Un collier raffiné aux lignes intemporelles.",
    3490,
    4490,
    "img/produits/collier-perle.svg",
    "-22%",
    18,
  ],
  [
    "bague-rose",
    "Bague Rose",
    "Bijoux",
    "Une bague fine et lumineuse.",
    2490,
    null,
    "img/produits/bague-rose.svg",
    "",
    30,
  ],
  [
    "bougie-fleurie",
    "Bougie Fleurie",
    "Maison",
    "Une bougie parfumée aux notes florales.",
    2490,
    2990,
    "img/produits/bougie-fleurie.svg",
    "Coup de cœur",
    40,
  ],
  [
    "bougie-vanille",
    "Bougie Vanille",
    "Maison",
    "Une senteur douce et réconfortante.",
    1990,
    null,
    "img/produits/bougie-vanille.svg",
    "",
    35,
  ],
  [
    "coffret-elegance",
    "Coffret Élégance",
    "Coffrets",
    "Une parenthèse élégante à offrir.",
    5990,
    6990,
    "img/produits/coffret-elegance.svg",
    "Idée cadeau",
    16,
  ],
  [
    "diffuseur-floral",
    "Diffuseur Floral",
    "Maison",
    "Un parfum discret pour votre intérieur.",
    3990,
    4990,
    "img/produits/diffuseur-floral.svg",
    "-20%",
    20,
  ],
  [
    "chemise-satin",
    "Chemise Satin",
    "Mode",
    "Une coupe souple et satinée.",
    4490,
    null,
    "img/produits/chemise-satin.svg",
    "Nouveau",
    10,
  ],
  [
    "pochette-nacre",
    "Pochette Nacre",
    "Accessoires",
    "Une pochette chic pour vos essentiels.",
    3290,
    3990,
    "img/produits/pochette-nacre.svg",
    "-18%",
    14,
  ],
  [
    "bougie-coton",
    "Bougie Coton",
    "Maison",
    "Une fragrance propre et douce.",
    2290,
    null,
    "img/produits/bougie-coton.svg",
    "Nouveau",
    35,
  ],
  [
    "coffret-douceur",
    "Coffret Douceur",
    "Coffrets",
    "Une sélection généreuse à offrir.",
    6990,
    7990,
    "img/produits/coffret-douceur.svg",
    "Cadeau",
    16,
  ],
  [
    "sac-maelie",
    "Sac Maelie",
    "Accessoires",
    "Un sac souple et structuré.",
    5490,
    null,
    "img/produits/sac-maelie.svg",
    "Signature",
    12,
  ],
  [
    "boucles-nacre",
    "Boucles Nacre",
    "Bijoux",
    "Des boucles délicates aux reflets nacrés.",
    2790,
    null,
    "img/produits/boucles-nacre.svg",
    "",
    22,
  ],
  [
    "parfum-rose",
    "Brume Rose",
    "Beauté",
    "Une brume légère aux notes poudrées.",
    3690,
    4290,
    "img/produits/parfum-rose.svg",
    "Nouveau",
    15,
  ],
  [
    "porte-cartes",
    "Porte-cartes Nacre",
    "Accessoires",
    "Un essentiel élégant du quotidien.",
    2190,
    null,
    "img/produits/porte-cartes.svg",
    "",
    28,
  ],
  [
    "echarpe-douceur",
    "Écharpe Douceur",
    "Mode",
    "Une écharpe légère et enveloppante.",
    3990,
    null,
    "img/produits/echarpe-douceur.svg",
    "",
    18,
  ],
  [
    "set-rituel",
    "Set Rituel Maison",
    "Maison",
    "Un trio parfumé pour votre rituel douceur.",
    4990,
    5990,
    "img/produits/set-rituel.svg",
    "Coup de cœur",
    14,
  ],
];
if (!db.prepare("SELECT id FROM products LIMIT 1").get()) {
  const q = db.prepare(
    "INSERT INTO products(slug,name,category,description,price_cents,old_price_cents,image,badge,stock) VALUES(?,?,?,?,?,?,?,?,?)",
  );
  const tx = db.transaction(() => seed.forEach((x) => q.run(...x)));
  tx();
}
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
const hits = new Map();
app.use("/api/auth", (req, res, next) => {
  const now = Date.now(),
    key = req.ip;
  const x = hits.get(key) || { n: 0, t: now };
  if (now - x.t > 15 * 60e3) {
    x.n = 0;
    x.t = now;
  }
  x.n++;
  hits.set(key, x);
  if (x.n > 60)
    return res
      .status(429)
      .json({ error: "Trop de tentatives, réessayez plus tard." });
  next();
});
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET)
      return res.status(501).send("Webhook non configuré");
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      if (event.type === "checkout.session.completed") {
      }
      res.json({ received: true });
    } catch (e) {
      res.status(400).send(`Webhook Error: ${e.message}`);
    }
  },
);
app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));
const sign = (u) =>
  jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
const auth = (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) throw 0;
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Authentification requise" });
  }
};
const admin = (req, res, next) =>
  auth(req, res, () =>
    req.user.role === "admin"
      ? next()
      : res.status(403).json({ error: "Accès administrateur refusé" }),
  );
const cleanEmail = (e) =>
  String(e || "")
    .trim()
    .toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
app.get("/api/products", (req, res) => {
  let { category, search, maxPrice, sort } = req.query,
    sql = "SELECT * FROM products WHERE active=1",
    p = [];
  if (category) {
    sql += " AND category=?";
    p.push(String(category).slice(0, 40));
  }
  if (search) {
    const q = String(search).slice(0, 80);
    sql += " AND (name LIKE ? OR description LIKE ?)";
    p.push(`%${q}%`, `%${q}%`);
  }
  if (maxPrice && Number.isFinite(Number(maxPrice))) {
    sql += " AND price_cents<=?";
    p.push(Math.round(Number(maxPrice) * 100));
  }
  sql +=
    " ORDER BY " +
    ({
      price_asc: "price_cents ASC",
      price_desc: "price_cents DESC",
      name: "name ASC",
      newest: "created_at DESC",
    }[sort] || "id DESC");
  res.json(db.prepare(sql).all(...p));
});
app.get("/api/products/:slug", (req, res) => {
  const p = db
    .prepare("SELECT * FROM products WHERE slug=? AND active=1")
    .get(req.params.slug);
  p ? res.json(p) : res.status(404).json({ error: "Produit introuvable" });
});
app.post("/api/auth/register", async (req, res) => {
  const { email, password, firstName = "", lastName = "" } = req.body || {},
    e = cleanEmail(email);
  if (!validEmail(e) || typeof password !== "string" || password.length < 8)
    return res
      .status(400)
      .json({
        error: "Email valide et mot de passe de 8 caractères minimum requis.",
      });
  try {
    const r = db
      .prepare(
        "INSERT INTO users(email,password_hash,first_name,last_name) VALUES(?,?,?,?)",
      )
      .run(
        e,
        await bcrypt.hash(password, 12),
        String(firstName).slice(0, 60),
        String(lastName).slice(0, 60),
      );
    const u = db
      .prepare(
        "SELECT id,email,first_name firstName,last_name lastName,role FROM users WHERE id=?",
      )
      .get(r.lastInsertRowid);
    res.status(201).json({ token: sign(u), user: u });
  } catch {
    res.status(409).json({ error: "Cette adresse email est déjà utilisée." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const e = cleanEmail(req.body?.email);
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(e);
  if (
    !u ||
    !(await bcrypt.compare(String(req.body?.password || ""), u.password_hash))
  )
    return res.status(401).json({ error: "Identifiants incorrects." });
  res.json({
    token: sign(u),
    user: {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
    },
  });
});
app.get("/api/me", auth, (req, res) => {
  const u = db
    .prepare(
      "SELECT id,email,first_name firstName,last_name lastName,role,created_at createdAt FROM users WHERE id=?",
    )
    .get(req.user.id);
  res.json(u);
});
app.get("/api/orders", auth, (req, res) =>
  res.json(
    db
      .prepare(
        "SELECT id,number,status,total_cents totalCents,created_at createdAt FROM orders WHERE user_id=? ORDER BY id DESC",
      )
      .all(req.user.id),
  ),
);
app.post("/api/orders", auth, (req, res) => {
  const { items, address, coupon } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 50)
    return res.status(400).json({ error: "Panier invalide." });
  if (
    !address ||
    !validEmail(address.email) ||
    !address.address ||
    !address.zip ||
    !address.city
  )
    return res.status(400).json({ error: "Adresse de livraison incomplète." });
  const get = db.prepare("SELECT * FROM products WHERE id=? AND active=1");
  let subtotal = 0,
    rows = [];
  for (const i of items) {
    const p = get.get(Number(i.id));
    const q = Number(i.quantity);
    if (!p || !Number.isInteger(q) || q < 1 || q > 99 || p.stock < q)
      return res
        .status(400)
        .json({ error: `Stock insuffisant pour ${p?.name || "un produit"}.` });
    subtotal += p.price_cents * q;
    rows.push([p, q]);
  }
  const discount = coupon === "MAELIE10" ? Math.round(subtotal * 0.1) : 0,
    shipping = subtotal - discount >= 8000 ? 0 : 490,
    total = subtotal - discount + shipping,
    number =
      "MAE-" +
      new Date().getFullYear() +
      "-" +
      crypto.randomBytes(3).toString("hex").toUpperCase();
  const tx = db.transaction(() => {
    const o = db
      .prepare(
        "INSERT INTO orders(user_id,number,email,subtotal_cents,shipping_cents,discount_cents,total_cents,address_json) VALUES(?,?,?,?,?,?,?,?)",
      )
      .run(
        req.user.id,
        number,
        cleanEmail(address.email),
        subtotal,
        shipping,
        discount,
        total,
        JSON.stringify(address),
      );
    const oi = db.prepare(
        "INSERT INTO order_items(order_id,product_id,name,price_cents,quantity) VALUES(?,?,?,?,?)",
      ),
      up = db.prepare(
        "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
      );
    for (const [p, q] of rows) {
      const u = up.run(q, p.id, q);
      if (!u.changes) throw new Error("STOCK");
      oi.run(o.lastInsertRowid, p.id, p.name, p.price_cents, q);
    }
    return o.lastInsertRowid;
  });
  try {
    const id = tx();
    res
      .status(201)
      .json({
        id,
        number,
        status: "pending",
        subtotalCents: subtotal,
        shippingCents: shipping,
        discountCents: discount,
        totalCents: total,
      });
  } catch (e) {
    res
      .status(409)
      .json({
        error:
          "La commande n’a pas pu être finalisée, veuillez vérifier le stock.",
      });
  }
});
app.post("/api/payment/checkout", auth, async (req, res) => {
  if (!stripe) return res.status(501).json({ error: "Stripe non configuré." });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Panier vide." });
  const get = db.prepare("SELECT * FROM products WHERE id=? AND active=1");
  const line_items = [];
  for (const i of items) {
    const p = get.get(Number(i.id)),
      q = Number(i.quantity);
    if (!p || !Number.isInteger(q) || q < 1 || q > 99 || p.stock < q)
      return res.status(400).json({ error: "Produit ou stock invalide." });
    line_items.push({
      price_data: {
        currency: "eur",
        product_data: { name: p.name },
        unit_amount: p.price_cents,
      },
      quantity: q,
    });
  }
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const s = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${base}/commande.html?paid=1`,
    cancel_url: `${base}/panier.html?cancelled=1`,
    customer_email: req.user.email,
    metadata: { userId: String(req.user.id) },
  });
  res.json({ url: s.url });
});
app.get("/api/admin/products", admin, (req, res) =>
  res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()),
);
app.post("/api/admin/products", admin, (req, res) => {
  const p = req.body || {};
  if (!p.name || !p.slug || !Number.isFinite(Number(p.price)))
    return res.status(400).json({ error: "Produit incomplet." });
  try {
    const r = db
      .prepare(
        "INSERT INTO products(slug,name,category,description,price_cents,old_price_cents,image,badge,stock,active) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        p.slug,
        p.name,
        p.category || "Autres",
        p.description || "",
        Math.round(Number(p.price) * 100),
        p.oldPrice ? Math.round(Number(p.oldPrice) * 100) : null,
        p.image || "img/produits/robe-eclat.svg",
        p.badge || "",
        Math.max(0, Number(p.stock) || 0),
        p.active === false ? 0 : 1,
      );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch {
    res.status(409).json({ error: "Slug déjà utilisé." });
  }
});
app.patch("/api/admin/products/:id", admin, (req, res) => {
  const p = req.body || {};
  db.prepare(
    "UPDATE products SET name=COALESCE(?,name),category=COALESCE(?,category),description=COALESCE(?,description),price_cents=COALESCE(?,price_cents),old_price_cents=COALESCE(?,old_price_cents),badge=COALESCE(?,badge),stock=COALESCE(?,stock),active=COALESCE(?,active) WHERE id=?",
  ).run(
    p.name,
    p.category,
    p.description,
    p.price != null ? Math.round(Number(p.price) * 100) : null,
    p.oldPrice != null ? Math.round(Number(p.oldPrice) * 100) : null,
    p.badge,
    p.stock != null ? Math.max(0, Number(p.stock)) : null,
    p.active == null ? null : p.active ? 1 : 0,
    Number(req.params.id),
  );
  res.json({ ok: true });
});
app.get("/api/admin/orders", admin, (req, res) =>
  res.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all()),
);
app.patch("/api/admin/orders/:id", admin, (req, res) => {
  const s = req.body?.status;
  if (!statuses.includes(s))
    return res.status(400).json({ error: "Statut invalide." });
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(
    s,
    Number(req.params.id),
  );
  res.json({ ok: true });
});
app.get("/api/health", (req, res) =>
  res.json({ ok: true, app: "MAELIE", version: "6.0.0" }),
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "admin.html")),
);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur." });
});
app.listen(PORT, () => console.log(`MAELIE → http://localhost:${PORT}`));
