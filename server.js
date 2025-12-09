const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// archivo de base de datos
const dbPath = path.join(__dirname, "caminatas.db");
const db = new sqlite3.Database(dbPath);

// carpeta para imágenes de blog
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// configuración de multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

// servir archivos estáticos de imágenes subidas
app.use("/uploads", express.static(uploadDir));

db.serialize(() => {
  // CAMINATAS (con precio)
  db.run(`
    CREATE TABLE IF NOT EXISTS caminatas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      modalidad TEXT NOT NULL,
      dificultad TEXT NOT NULL,
      fecha TEXT NOT NULL,
      lugar TEXT NOT NULL,
      imagen TEXT,
      descripcionCorta TEXT,
      precio INTEGER NOT NULL
    )
  `);

  // USUARIOS
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      telefono TEXT,
      password TEXT NOT NULL,
      documento TEXT,
      fechaNacimiento TEXT,
      nit TEXT,
      representante TEXT,
      numeroParticipantes INTEGER
    )
  `);

  // INSCRIPCIONES
  db.run(`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL,
      caminataId INTEGER NOT NULL,
      estado TEXT NOT NULL,
      fecha TEXT NOT NULL,
      seguro TEXT NOT NULL,
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id),
      FOREIGN KEY (caminataId) REFERENCES caminatas(id)
    )
  `);

  // RESEÑAS
  db.run(`
    CREATE TABLE IF NOT EXISTS resenas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL,
      caminataId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      respuestaAdmin TEXT,
      fecha TEXT NOT NULL,
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id),
      FOREIGN KEY (caminataId) REFERENCES caminatas(id)
    )
  `);

  // BLOG: publicaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      imagenUrl TEXT,
      videoUrl TEXT,
      fecha TEXT NOT NULL,
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `);

  // BLOG: comentarios
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      usuarioId INTEGER NOT NULL,
      texto TEXT NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (postId) REFERENCES blog_posts(id),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `);

  // BLOG: ratings
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      usuarioId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      UNIQUE (postId, usuarioId),
      FOREIGN KEY (postId) REFERENCES blog_posts(id),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `);

  // BLOG: favoritos (a futuro)
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      usuarioId INTEGER NOT NULL,
      UNIQUE (postId, usuarioId),
      FOREIGN KEY (postId) REFERENCES blog_posts(id),
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `);

  // CAMINATAS DE PRUEBA (10, con precio)
  db.get("SELECT COUNT(*) as cnt FROM caminatas", (err, row) => {
    if (row && row.cnt === 0) {
      const stmt = db.prepare(`
        INSERT INTO caminatas
          (nombre, tipo, modalidad, dificultad, fecha, lugar, imagen, descripcionCorta, precio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        "El Santuario de Cóndores",
        "Deportiva",
        "Montaña",
        "Alta",
        "2026-01-20",
        "Páramo de la Ventana, cerca al Nevado del Ruiz",
        "/img/santuario-1.jpg",
        "Caminata de alta montaña de varios días para montañistas experimentados, con observación de cóndores y refugios.",
        180000
      );

      stmt.run(
        "Ruta del Café Escondido",
        "Recreativa",
        "Senderismo",
        "Baja",
        "2026-02-05",
        "Zona rural de Filandia, Quindío",
        "/img/carrusel-1.jpg",
        "Paseo entre cafetales, bambúes y cascadas con degustación de café y almuerzo típico.",
        95000
      );

      stmt.run(
        "El Desafío de la Ciénaga",
        "Deportiva",
        "Senderismo avanzado",
        "Alta",
        "2026-03-10",
        "Humedales del Magdalena",
        "/img/cienaga-3.jpeg",
        "Caminata de resistencia en manglares y humedales, ideal para entrenamiento de ultra-fondo.",
        160000
      );

      stmt.run(
        "Sendero de los Petroglifos",
        "Recreativa",
        "Histórica",
        "Media",
        "2026-04-15",
        "Cerca de San Agustín, Huila",
        "/img/petro-4.jpg",
        "Recorrido entre selva y sitios arqueológicos con antiguos grabados indígenas.",
        110000
      );

      stmt.run(
        "Reto Extremo: Pico del Jaguar",
        "Competencia",
        "Montaña",
        "Alta",
        "2026-05-20",
        "Sierra Nevada de Santa Marta",
        "/img/pico-5.webp",
        "Competencia de alta exigencia en selva y montaña, con patrocinador y registro de ganadores.",
        250000
      );

      stmt.run(
        "Oasis de la Guajira",
        "Recreativa",
        "Paisaje desértico",
        "Media",
        "2026-06-10",
        "Cabo de la Vela, La Guajira",
        "/img/carrusel-4.jpg",
        "Caminata costera por paisajes semidesérticos y playas vírgenes con comunidades Wayuu.",
        120000
      );

      stmt.run(
        "Travesía de los Siete Colores",
        "Deportiva",
        "Entrenamiento",
        "Media",
        "2026-07-05",
        "Cordillera Oriental, Boyacá",
        "/img/cañon-7.jpeg",
        "Ruta de subidas y bajadas entre montañas de colores minerales para ganar desnivel.",
        140000
      );

      stmt.run(
        "La Cascada Esmeralda",
        "Recreativa",
        "Fluvial",
        "Baja",
        "2026-08-12",
        "Cerca de Leticia, Amazonas",
        "/img/cascada-8.jpeg",
        "Caminata corta por selva tropical hacia una cascada y piscina natural en el Amazonas.",
        130000
      );

      stmt.run(
        "El Balcón de Bogotá",
        "Deportiva",
        "Entrenamiento urbano",
        "Media",
        "2026-09-01",
        "Cerro cercano a Bogotá",
        "/img/potosi-9.jpeg",
        "Desafío vertical de alta intensidad con vista panorámica, ideal para grupos corporativos.",
        90000
      );

      stmt.run(
        "La Laguna Misteriosa",
        "Recreativa",
        "Mística",
        "Media",
        "2026-10-05",
        "Páramos del Sumapaz",
        "/img/sumapaz-10.jpeg",
        "Caminata a una laguna de altura rodeada de frailejones, con enfoque en conservación de páramo.",
        125000
      );

      stmt.finalize();
    }
  });

  // USUARIOS DE PRUEBA
  db.get("SELECT COUNT(*) as cnt FROM usuarios", (err, row) => {
    if (row && row.cnt === 0) {
      const stmt = db.prepare(`
        INSERT INTO usuarios
        (tipo, nombre, email, telefono, password, documento, fechaNacimiento, nit, representante, numeroParticipantes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        "natural",
        "Usuario Prueba",
        "user@demo.com",
        "3000000000",
        "123456",
        "12345678",
        "1990-01-01",
        null,
        null,
        null
      );

      stmt.run(
        "juridica",
        "Empresa Demo",
        "empresa@demo.com",
        "3222222222",
        "empresa123",
        null,
        null,
        "901234567",
        "Representante Demo",
        25
      );

      stmt.run(
        "juridica",
        "Admin Empresa",
        "admin@demo.com",
        "3111111111",
        "admin123",
        null,
        null,
        "900123456",
        "Admin General",
        50
      );

      stmt.finalize();
    }
  });

  // INSCRIPCIONES DE PRUEBA
  db.get("SELECT COUNT(*) as cnt FROM inscripciones", (err, row) => {
    if (row && row.cnt === 0) {
      const stmt = db.prepare(`
        INSERT INTO inscripciones (usuarioId, caminataId, estado, fecha, seguro)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(1, 1, "completado", "2025-12-01", "basico");
      stmt.run(1, 2, "completado", "2025-12-05", "deportivo");
      stmt.run(1, 3, "completado", "2025-12-08", "basico");

      stmt.finalize();
    }
  });
});

// ENDPOINTS

// caminatas
app.get("/api/caminatas", (req, res) => {
  db.all("SELECT * FROM caminatas", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// registrar usuario
app.post("/api/usuarios", (req, res) => {
  const {
    tipo,
    nombre,
    email,
    telefono,
    password,
    documento,
    fechaNacimiento,
    nit,
    representante,
    numeroParticipantes,
  } = req.body;

  const sql = `
    INSERT INTO usuarios
    (tipo, nombre, email, telefono, password, documento, fechaNacimiento, nit, representante, numeroParticipantes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      tipo,
      nombre,
      email,
      telefono,
      password,
      documento || null,
      fechaNacimiento || null,
      nit || null,
      representante || null,
      numeroParticipantes || null,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT id, tipo, nombre, email, numeroParticipantes
    FROM usuarios
    WHERE email = ? AND password = ?
  `;

  db.get(sql, [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Credenciales inválidas" });

    const rol = row.email === "admin@demo.com" ? "admin" : "usuario";

    res.json({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      tipo: row.tipo,
      numeroParticipantes: row.numeroParticipantes,
      rol,
    });
  });
});

// caminatas del usuario
app.get("/api/usuarios/:id/caminatas", (req, res) => {
  const usuarioId = req.params.id;
  const sql = `
    SELECT i.id as inscripcionId, i.fecha, i.estado, i.seguro,
           c.id as caminataId, c.nombre
    FROM inscripciones i
    JOIN caminatas c ON i.caminataId = c.id
    WHERE i.usuarioId = ?
  `;
  db.all(sql, [usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// crear inscripción
app.post("/api/inscripciones", (req, res) => {
  const { usuarioId, caminataId, seguro } = req.body;
  if (!usuarioId || !caminataId || !seguro) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const sql = `
    INSERT INTO inscripciones (usuarioId, caminataId, estado, fecha, seguro)
    VALUES (?, ?, 'inscrito', ?, ?)
  `;
  db.run(sql, [usuarioId, caminataId, fechaHoy, seguro], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// crear reseña
app.post("/api/resenas", (req, res) => {
  const { usuarioId, caminataId, rating, comentario } = req.body;

  const sqlCheck = `
    SELECT 1 FROM inscripciones
    WHERE usuarioId = ? AND caminataId = ? AND estado = 'completado'
  `;

  db.get(sqlCheck, [usuarioId, caminataId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      return res.status(403).json({
        error:
          "Solo los usuarios que han participado en esta caminata pueden dejar reseñas.",
      });
    }

    const sqlInsert = `
      INSERT INTO resenas
      (usuarioId, caminataId, rating, comentario, fecha)
      VALUES (?, ?, ?, ?, ?)
    `;
    const fecha = new Date().toISOString();

    db.run(
      sqlInsert,
      [usuarioId, caminataId, rating, comentario, fecha],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ id: this.lastID });
      }
    );
  });
});

// listar reseñas de una caminata
app.get("/api/caminatas/:id/resenas", (req, res) => {
  const caminataId = req.params.id;
  const sql = `
    SELECT r.id, r.rating, r.comentario, r.respuestaAdmin, r.fecha,
           u.nombre as autorNombre,
           c.nombre as caminataNombre
    FROM resenas r
    JOIN usuarios u ON r.usuarioId = u.id
    JOIN caminatas c ON r.caminataId = c.id
    WHERE r.caminataId = ?
    ORDER BY r.fecha DESC
  `;
  db.all(sql, [caminataId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// responder reseña como admin
app.post("/api/resenas/:id/responder", (req, res) => {
  const resenaId = req.params.id;
  const { adminId, respuesta } = req.body;

  const sqlAdmin = `SELECT email FROM usuarios WHERE id = ?`;
  db.get(sqlAdmin, [adminId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.email !== "admin@demo.com") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const sqlUpdate = `
      UPDATE resenas
      SET respuestaAdmin = ?
      WHERE id = ?
    `;
    db.run(sqlUpdate, [respuesta, resenaId], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ updated: this.changes });
    });
  });
});

// BLOG: subir imagen
app.post("/api/blog/upload-image", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se recibió archivo" });
  }
  const url = `http://localhost:4000/uploads/${req.file.filename}`;
  res.json({ url });
});

// BLOG: listar posts
app.get("/api/blog/posts", (req, res) => {
  const sql = `
    SELECT p.id, p.titulo, p.contenido, p.imagenUrl, p.videoUrl, p.fecha,
           u.nombre AS autorNombre,
           IFNULL(AVG(r.rating), 0) AS ratingPromedio,
           COUNT(DISTINCT c.id) AS totalComentarios
    FROM blog_posts p
    JOIN usuarios u ON p.usuarioId = u.id
    LEFT JOIN blog_ratings r ON r.postId = p.id
    LEFT JOIN blog_comentarios c ON c.postId = p.id
    GROUP BY p.id
    ORDER BY p.fecha DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// BLOG: crear post
app.post("/api/blog/posts", (req, res) => {
  const { usuarioId, titulo, contenido, imagenUrl, videoUrl } = req.body;
  if (!usuarioId || !titulo || !contenido) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const fecha = new Date().toISOString();
  const sql = `
    INSERT INTO blog_posts (usuarioId, titulo, contenido, imagenUrl, videoUrl, fecha)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [usuarioId, titulo, contenido, imagenUrl || null, videoUrl || null, fecha],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// BLOG: comentar post
app.post("/api/blog/posts/:id/comentarios", (req, res) => {
  const postId = req.params.id;
  const { usuarioId, texto } = req.body;
  if (!usuarioId || !texto) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const fecha = new Date().toISOString();
  const sql = `
    INSERT INTO blog_comentarios (postId, usuarioId, texto, fecha)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [postId, usuarioId, texto, fecha], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// BLOG: obtener comentarios de un post
app.get("/api/blog/posts/:id/comentarios", (req, res) => {
  const postId = req.params.id;
  const sql = `
    SELECT c.id, c.texto, c.fecha, u.nombre AS autorNombre
    FROM blog_comentarios c
    JOIN usuarios u ON c.usuarioId = u.id
    WHERE c.postId = ?
    ORDER BY c.fecha ASC
  `;
  db.all(sql, [postId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// BLOG: calificar post
app.post("/api/blog/posts/:id/rating", (req, res) => {
  const postId = req.params.id;
  const { usuarioId, rating } = req.body;
  if (!usuarioId || !rating) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  const sql = `
    INSERT INTO blog_ratings (postId, usuarioId, rating)
    VALUES (?, ?, ?)
    ON CONFLICT(postId, usuarioId) DO UPDATE SET rating = excluded.rating
  `;
  db.run(sql, [postId, usuarioId, rating], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log("Backend escuchando en http://localhost:" + PORT);
});
