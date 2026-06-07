import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getParsedSongs, Song } from "../src/data/songsData.js";

// Database types
export interface EventConfig {
  evento_nombre: string;
  artistas: string;
  lugar: string;
  fecha: string;
  restriccion_activa: boolean; // false = test mode (unlimited voting), true = votes restricted by localStorage
  cantidad_artistas?: number;
  artista_1_nombre?: string;
  artista_1_foto?: string;
  artista_1_bio?: string;
  artista_1_instagram?: string;
  artista_1_instagram_show?: boolean;
  artista_1_spotify?: string;
  artista_1_spotify_show?: boolean;
  artista_1_youtube?: string;
  artista_1_youtube_show?: boolean;
  artista_1_web?: string;
  artista_1_web_show?: boolean;
  artista_2_nombre?: string;
  artista_2_foto?: string;
  artista_2_bio?: string;
  artista_2_instagram?: string;
  artista_2_instagram_show?: boolean;
  artista_2_spotify?: string;
  artista_2_spotify_show?: boolean;
  artista_2_youtube?: string;
  artista_2_youtube_show?: boolean;
  artista_2_web?: string;
  artista_2_web_show?: boolean;
  artista_separador?: string;
}

export interface Vote {
  id: string;
  song_id: string;
  created_at: string;
}

// Local Database File Setup
const LOCAL_DB_PATH = path.join(process.cwd(), "database.json");

const DEFAULT_CONFIG: EventConfig = {
  evento_nombre: "Las canciones más lindas de Charly",
  artistas: "Marina Wil & Ian Shifres",
  lugar: "La casa de Lolita",
  fecha: "05.06.2026",
  restriccion_activa: true, // by default restriction is active (test mode is OFF)
  cantidad_artistas: 2,
  artista_1_nombre: "Marina Wil",
  artista_1_foto: "",
  artista_1_bio: "Cantautora y pianista argentina. Con su voz dulce y arreglos sofisticados, recrea la obra de Charly con una sensibilidad única.",
  artista_1_instagram: "marina.wil",
  artista_1_instagram_show: true,
  artista_1_spotify: "",
  artista_1_spotify_show: false,
  artista_1_youtube: "",
  artista_1_youtube_show: false,
  artista_1_web: "",
  artista_1_web_show: false,
  artista_2_nombre: "Ian Shifres",
  artista_2_foto: "",
  artista_2_bio: "Multiinstrumentista, pianista y compositor. Aporta un virtuosismo musical incomparable para dar vida a los clásicos del maestro.",
  artista_2_instagram: "shifrian",
  artista_2_instagram_show: true,
  artista_2_spotify: "",
  artista_2_spotify_show: false,
  artista_2_youtube: "",
  artista_2_youtube_show: false,
  artista_2_web: "",
  artista_2_web_show: false,
  artista_separador: " & ",
};

// Seed initial songs in memory to keep track of valid song IDs
const ALL_SONGS = getParsedSongs();

// Check if Supabase is configured
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const isSupabaseConfigured =
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes("your-project-id") && 
  !supabaseKey.includes("your-anon-key");

let supabaseClient: any = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("🔌 Supabase configuration detected. Attempting to use Supabase...");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.log("📂 No Supabase configuration detected. Running in offline Local JSON Mode.");
}

// Initial Local Storage setup
function getLocalData() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialData = {
      config: DEFAULT_CONFIG,
      votes: [] as Vote[],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const dataStr = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    const parsed = JSON.parse(dataStr);
    if (parsed && parsed.config) {
      parsed.config = { ...DEFAULT_CONFIG, ...parsed.config };
    }
    return parsed;
  } catch (err) {
    console.error("Error reading local database, resetting:", err);
    const initialData = {
      config: DEFAULT_CONFIG,
      votes: [] as Vote[],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

function saveLocalData(data: any) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Global Core DB functions that proxy either to Supabase or Local Data
export async function getConfig(): Promise<EventConfig> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return {
          evento_nombre: data.evento_nombre,
          artistas: data.artistas,
          lugar: data.lugar,
          fecha: data.fecha,
          restriccion_activa: data.restriccion_activa,
          cantidad_artistas: data.cantidad_artistas !== undefined ? data.cantidad_artistas : 2,
          artista_1_nombre: data.artista_1_nombre || "",
          artista_1_foto: data.artista_1_foto || "",
          artista_1_bio: data.artista_1_bio || "",
          artista_1_instagram: data.artista_1_instagram || "",
          artista_1_instagram_show: data.artista_1_instagram_show !== undefined ? !!data.artista_1_instagram_show : true,
          artista_1_spotify: data.artista_1_spotify || "",
          artista_1_spotify_show: !!data.artista_1_spotify_show,
          artista_1_youtube: data.artista_1_youtube || "",
          artista_1_youtube_show: !!data.artista_1_youtube_show,
          artista_1_web: data.artista_1_web || "",
          artista_1_web_show: !!data.artista_1_web_show,
          artista_2_nombre: data.artista_2_nombre || "",
          artista_2_foto: data.artista_2_foto || "",
          artista_2_bio: data.artista_2_bio || "",
          artista_2_instagram: data.artista_2_instagram || "",
          artista_2_instagram_show: data.artista_2_instagram_show !== undefined ? !!data.artista_2_instagram_show : true,
          artista_2_spotify: data.artista_2_spotify || "",
          artista_2_spotify_show: !!data.artista_2_spotify_show,
          artista_2_youtube: data.artista_2_youtube || "",
          artista_2_youtube_show: !!data.artista_2_youtube_show,
          artista_2_web: data.artista_2_web || "",
          artista_2_web_show: !!data.artista_2_web_show,
          artista_separador: data.artista_separador || " & ",
        };
      } else {
        // Seed initial config on Supabase if empty
        console.log("Seeding initial config on Supabase...");
        const { error: seedError } = await supabaseClient
          .from("config")
          .insert([DEFAULT_CONFIG]);
        if (seedError) console.error("Error seeding config in Supabase:", seedError);
        return DEFAULT_CONFIG;
      }
    } catch (err) {
      console.warn("⚠️ Supabase error getting config, falling back to local DB:", err);
    }
  }
  return getLocalData().config;
}

export async function updateConfig(newConfig: EventConfig): Promise<EventConfig> {
  if (supabaseClient) {
    try {
      // First check if any row exists
      const { data: existing, error: checkError } = await supabaseClient
        .from("config")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const { error: updateError } = await supabaseClient
          .from("config")
          .update(newConfig)
          .eq("id", existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabaseClient
          .from("config")
          .insert([newConfig]);
        if (insertError) throw insertError;
      }
      return newConfig;
    } catch (err) {
      console.warn("⚠️ Supabase update config error, falling back to local DB:", err);
    }
  }

  const data = getLocalData();
  data.config = { ...data.config, ...newConfig };
  saveLocalData(data);
  return data.config;
}

export async function submitVote(songId: string): Promise<{ success: boolean; vote?: Vote; message?: string }> {
  // Validate songId is valid
  const songExists = ALL_SONGS.some((s) => s.id === songId);
  if (!songExists) {
    return { success: false, message: "Canción no válida en el catálogo." };
  }

  const timestamp = new Date().toISOString();
  const voteId = Math.random().toString(36).substring(2, 11);

  if (supabaseClient) {
    try {
      // Insert vote in Supabase
      const { data, error } = await supabaseClient
        .from("votes")
        .insert([{ song_id: songId, created_at: timestamp }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, vote: { id: data.id || voteId, song_id: songId, created_at: timestamp } };
    } catch (err) {
      console.warn("⚠️ Supabase vote insertion error, falling back to local DB:", err);
    }
  }

  const data = getLocalData();
  const newVote: Vote = {
    id: voteId,
    song_id: songId,
    created_at: timestamp,
  };
  data.votes.push(newVote);
  saveLocalData(data);
  return { success: true, vote: newVote };
}

export async function removeVote(songId: string): Promise<{ success: boolean; message?: string }> {
  if (supabaseClient) {
    try {
      // Delete the latest vote for this song on Supabase
      // To simulate deleting a user's latest choice accurately:
      const { data: latestVotes, error: fetchError } = await supabaseClient
        .from("votes")
        .select("id")
        .eq("song_id", songId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (latestVotes && latestVotes.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from("votes")
          .delete()
          .eq("id", latestVotes[0].id);

        if (deleteError) throw deleteError;
        return { success: true };
      } else {
        return { success: true, message: "No se encontraron votos para eliminar (ya estaba limpio)." };
      }
    } catch (err) {
      console.warn("⚠️ Supabase vote deletion error, falling back to local DB:", err);
    }
  }

  const data = getLocalData();
  // Find index of the latest vote for this songId
  let lastIndex = -1;
  for (let i = data.votes.length - 1; i >= 0; i--) {
    if (data.votes[i].song_id === songId) {
      lastIndex = i;
      break;
    }
  }

  if (lastIndex !== -1) {
    data.votes.splice(lastIndex, 1);
    saveLocalData(data);
    return { success: true };
  }

  return { success: true, message: "No se encontró ningún voto local para eliminar (ya estaba limpio)." };
}

export async function clearAllVotes(): Promise<{ success: boolean; message?: string }> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from("votes").delete().neq("song_id", "");
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn("⚠️ Supabase error clearing votes, falling back to local DB:", err);
    }
  }

  const data = getLocalData();
  data.votes = [];
  saveLocalData(data);
  return { success: true };
}

export interface SongRank extends Song {
  votesCount: number;
}

export async function getRanking(): Promise<{
  ranking: SongRank[];
  totalVotes: number;
  unvotedCount: number;
  byBanda: Record<string, number>;
  byDecada: Record<string, number>;
}> {
  let votesList: Vote[] = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("votes")
        .select("*");

      if (error) throw error;
      votesList = data || [];
    } catch (err) {
      console.warn("⚠️ Supabase get votes listing error, falling back to local DB:", err);
      votesList = getLocalData().votes;
    }
  } else {
    votesList = getLocalData().votes;
  }

  // Count votes
  const votesMap: Record<string, number> = {};
  votesList.forEach((vote) => {
    votesMap[vote.song_id] = (votesMap[vote.song_id] || 0) + 1;
  });

  // Map to songs
  const ranking: SongRank[] = ALL_SONGS.map((song) => {
    return {
      ...song,
      votesCount: votesMap[song.id] || 0,
    };
  });

  // Sort: highest votes first
  ranking.sort((a, b) => b.votesCount - a.votesCount || a.tema.localeCompare(b.tema));

  // Compute trend statistics
  let totalVotes = votesList.length;
  let unvotedCount = ranking.filter((r) => r.votesCount === 0).length;

  const byBanda: Record<string, number> = {};
  const byDecada: Record<string, number> = {};

  votesList.forEach((vote) => {
    const song = ALL_SONGS.find((s) => s.id === vote.song_id);
    if (song) {
      byBanda[song.banda] = (byBanda[song.banda] || 0) + 1;
      
      // Determine decade
      const decade = `${Math.floor(song.anio / 10) * 10}s`;
      byDecada[decade] = (byDecada[decade] || 0) + 1;
    }
  });

  return {
    ranking,
    totalVotes,
    unvotedCount,
    byBanda,
    byDecada,
  };
}
