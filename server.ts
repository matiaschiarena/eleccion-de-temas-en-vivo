import express from "express";
import path from "path";
import dotenv from "dotenv";

import { getConfig, updateConfig, submitVote, removeVote, getRanking, clearAllVotes } from "./server/db.js";
import { getParsedSongs } from "./src/data/songsData.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with larger limits for uploaded base64 photos
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Set default passwords
const CONFIG_PASSWORD = process.env.CONFIG_PASSWORD || "eitileda";
const RESULTS_PASSWORD = process.env.RESULTS_PASSWORD || "eitileda";

// Helper middleware for basic API authentication
function checkAuth(expectedPassword: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "No autorizado. Se requiere contraseña." });
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedPassword) {
      res.status(401).json({ error: "Password incorrecto. Acceso denegado." });
      return;
    }
    next();
  };
}

// ==========================================
// API ROUTES
// ==========================================

// Get event configuration
app.get("/api/config", async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: "Error de servidor al obtener configuración" });
  }
});

// Update event configuration (protected by CONFIG_PASSWORD)
app.post("/api/config", checkAuth(CONFIG_PASSWORD), async (req, res) => {
  try {
    const { 
      evento_nombre, 
      artistas, 
      lugar, 
      fecha, 
      restriccion_activa,
      cantidad_artistas,
      artista_1_nombre,
      artista_1_foto,
      artista_1_bio,
      artista_1_instagram,
      artista_1_instagram_show,
      artista_1_spotify,
      artista_1_spotify_show,
      artista_1_youtube,
      artista_1_youtube_show,
      artista_1_web,
      artista_1_web_show,
      artista_2_nombre,
      artista_2_foto,
      artista_2_bio,
      artista_2_instagram,
      artista_2_instagram_show,
      artista_2_spotify,
      artista_2_spotify_show,
      artista_2_youtube,
      artista_2_youtube_show,
      artista_2_web,
      artista_2_web_show,
      artista_separador
    } = req.body;
    
    if (
      evento_nombre === undefined || 
      artistas === undefined || 
      lugar === undefined || 
      fecha === undefined || 
      restriccion_activa === undefined
    ) {
      res.status(400).json({ error: "Faltan campos obligatorios para guardar la configuración" });
      return;
    }

    const updated = await updateConfig({
      evento_nombre,
      artistas,
      lugar,
      fecha,
      restriccion_activa: !!restriccion_activa,
      cantidad_artistas: cantidad_artistas !== undefined ? Number(cantidad_artistas) : undefined,
      artista_1_nombre,
      artista_1_foto,
      artista_1_bio,
      artista_1_instagram,
      artista_1_instagram_show: artista_1_instagram_show !== undefined ? !!artista_1_instagram_show : undefined,
      artista_1_spotify,
      artista_1_spotify_show: artista_1_spotify_show !== undefined ? !!artista_1_spotify_show : undefined,
      artista_1_youtube,
      artista_1_youtube_show: artista_1_youtube_show !== undefined ? !!artista_1_youtube_show : undefined,
      artista_1_web,
      artista_1_web_show: artista_1_web_show !== undefined ? !!artista_1_web_show : undefined,
      artista_2_nombre,
      artista_2_foto,
      artista_2_bio,
      artista_2_instagram,
      artista_2_instagram_show: artista_2_instagram_show !== undefined ? !!artista_2_instagram_show : undefined,
      artista_2_spotify,
      artista_2_spotify_show: artista_2_spotify_show !== undefined ? !!artista_2_spotify_show : undefined,
      artista_2_youtube,
      artista_2_youtube_show: artista_2_youtube_show !== undefined ? !!artista_2_youtube_show : undefined,
      artista_2_web,
      artista_2_web_show: artista_2_web_show !== undefined ? !!artista_2_web_show : undefined,
      artista_separador
    });

    res.json({ success: true, config: updated });
  } catch (err: any) {
    console.error("Error saving config:", err);
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
});

// Get song catalog with dynamic parsed ids
app.get("/api/songs", (req, res) => {
  try {
    const songs = getParsedSongs();
    res.json(songs);
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener catálogo de canciones" });
  }
});

// Submit a new vote
app.post("/api/vote", async (req, res) => {
  try {
    const { song_id } = req.body;
    if (!song_id) {
      res.status(400).json({ error: "ID de canción requerido" });
      return;
    }

    const result = await submitVote(song_id);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error al registrar el voto" });
  }
});

// Remove / cancel previous vote
app.delete("/api/vote", async (req, res) => {
  try {
    const { song_id } = req.body;
    if (!song_id) {
      res.status(400).json({ error: "ID de canción requerido" });
      return;
    }

    const result = await removeVote(song_id);
    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error al remover el voto" });
  }
});

// Admin endpoint: Check configuration password validity
app.post("/api/auth/config", (req, res) => {
  const { password } = req.body;
  if (password === CONFIG_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta" });
  }
});

// Admin endpoint: Check results password validity
app.post("/api/auth/results", (req, res) => {
  const { password } = req.body;
  if (password === RESULTS_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta" });
  }
});

// Get admin live ranked results and statistics (protected by RESULTS_PASSWORD)
app.get("/api/results", checkAuth(RESULTS_PASSWORD), async (req, res) => {
  try {
    const results = await getRanking();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// Clear all votes (protected by RESULTS_PASSWORD)
app.post("/api/results/clear", checkAuth(RESULTS_PASSWORD), async (req, res) => {
  try {
    const result = await clearAllVotes();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Error al borrar los votos del show." });
  }
});


// ==========================================
// VITE OR STATIC FILE SERVING
// ==========================================

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Charly Live Tribute running on http://0.0.0.0:${PORT}`);
    console.log(`🔑 Config pwd default is: '${CONFIG_PASSWORD}'`);
    console.log(`📊 Results pwd default is: '${RESULTS_PASSWORD}'`);
  });
}

if (!process.env.VERCEL) {
  setupServer();
}

export default app;
