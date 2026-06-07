import React, { useState, useEffect } from "react";
import { Music, Sliders, BarChart3, Lock, ShieldAlert, Sparkles, HelpCircle, Instagram, Youtube, Globe, X } from "lucide-react";
import { Song, EventConfig, SongRank, StatsData, ArtistDetail } from "./types";
import { getParsedSongs } from "./data/songsData";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import PasswordModal from "./components/PasswordModal";
import AdminConfig from "./components/AdminConfig";
import AdminResults from "./components/AdminResults";

export default function App() {
  // Navigation & View tabs state
  const [activeTab, setActiveTab] = useState<"public" | "admin-config" | "admin-results">("public");
  const [selectedArtist, setSelectedArtist] = useState<ArtistDetail | null>(null);

  // Core Configuration & Catalog State
  const [songs, setSongs] = useState<Song[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    evento_nombre: "Las canciones más lindas de Charly",
    artistas: "Marina Wil & Ian Shifres",
    lugar: "La casa de Lolita",
    fecha: "05.06.2026",
    restriccion_activa: true,
  });

  // Local Vote Tracking
  const [votedSongId, setVotedSongId] = useState<string | null>(null);

  // Results Tab data state
  const [ranking, setRanking] = useState<SongRank[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Loading States
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isVotingInProgress, setIsVotingInProgress] = useState(false);

  // Authentication locks tokens
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [resultsToken, setResultsToken] = useState<string | null>(null);

  // Custom Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sync / bypass votedSongId based on test mode (restriccion_activa)
  useEffect(() => {
    if (!eventConfig.restriccion_activa) {
      // Test Mode is ON: clear restriction block so they can vote repeatedly
      setVotedSongId(null);
    } else {
      // Test Mode is OFF: check localStorage for any previous recorded vote
      const storedVote = localStorage.getItem("yaVoto");
      if (storedVote) {
        setVotedSongId(storedVote);
      } else {
        setVotedSongId(null);
      }
    }
  }, [eventConfig.restriccion_activa]);

  // 1. Load initial resources from backend APIs
  useEffect(() => {
    // Fetch song catalog
    fetch("/api/songs")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Song[]) => {
        setSongs(data);
        setIsLoadingSongs(false);
      })
      .catch(() => {
        // Fallback compilation offline parsed seeds if API fails
        setSongs(getParsedSongs());
        setIsLoadingSongs(false);
      });

    // Fetch dynamic event config
    fetch("/api/config")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: EventConfig) => {
        setEventConfig(data);
        setIsLoadingConfig(false);
      })
      .catch((err) => {
        console.error("No se pudo cargar la config, usando defaults", err);
        setIsLoadingConfig(false);
      });
  }, []);

  // 2. Fetch or update live results ranking
  const fetchRankingData = async (passwordToken?: string) => {
    const token = passwordToken || resultsToken;
    if (!token) return;

    setIsLoadingResults(true);
    try {
      const res = await fetch("/api/results", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // If password is stale or rejected, revoke it
        setResultsToken(null);
        throw new Error();
      }
      const data = await res.json();
      setRanking(data.ranking || []);
      setStats({
        totalVotes: data.totalVotes || 0,
        unvotedCount: data.unvotedCount || 0,
        byBanda: data.byBanda || {},
        byDecada: data.byDecada || {},
      });
    } catch (err) {
      console.error("Error al buscar ranking", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Trigger ranking reload when Results Tab loads or refreshes
  useEffect(() => {
    if (activeTab === "admin-results" && resultsToken) {
      fetchRankingData();
    }
  }, [activeTab, resultsToken]);

  // 3. Action: Register a dynamic vote
  const handleVote = async (songId: string) => {
    setIsVotingInProgress(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        showToast(errObj.error || "No se pudo registrar el voto.", "error");
        return;
      }

      // Successful vote
      // Save client context in localstorage if restriction is active
      if (eventConfig.restriccion_activa) {
        localStorage.setItem("yaVoto", songId);
        setVotedSongId(songId);
        showToast("¡Voto registrado con éxito!");
      } else {
        showToast("¡Voto registrado con éxito (Modo Test / Votos ilimitados)!");
      }
    } catch (err) {
      showToast("Error de red al registrar tu voto.", "error");
    } finally {
      setIsVotingInProgress(false);
    }
  };

  // 4. Action: Cancel/Delete a previous vote
  const handleCancelVote = async (songId: string) => {
    setIsVotingInProgress(true);
    try {
      const res = await fetch("/api/vote", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        showToast(errObj.error || "No se pudo cancelar el voto en el servidor.", "error");
        return;
      }

      // Successful cancel, clear tracking flag
      localStorage.removeItem("yaVoto");
      setVotedSongId(null);
      showToast("Voto cancelado. Ya podés elegir otra canción.");
    } catch (err) {
      showToast("Error de red al cancelar tu voto.", "error");
    } finally {
      setIsVotingInProgress(false);
    }
  };

  // 5. Admin validation: Config password check
  const handleVerifyConfigPassword = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAdminToken(password);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // 6. Admin validation: Results password check
  const handleVerifyResultsPassword = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setResultsToken(password);
        // Load actual rankings immediately on success
        await fetchRankingData(password);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // 7. Config persistence: save changes in real time
  const handleSaveShowConfig = async (newConfig: EventConfig): Promise<boolean> => {
    if (!adminToken) return false;

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(newConfig),
      });

      if (res.ok) {
        const resData = await res.json();
        setEventConfig(resData.config);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // 8. Action: Clear all votes recorded
  const handleClearAllVotes = async () => {
    if (!resultsToken) return;
    try {
      const res = await fetch("/api/results/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resultsToken}`,
        },
      });

      if (res.ok) {
        showToast("Se borraron todos los votos del show exitosamente.");
        localStorage.removeItem("yaVoto"); // Clear local storage too
        setVotedSongId(null);
        await fetchRankingData(resultsToken);
      } else {
        const errObj = await res.json();
        showToast(errObj.error || "No se pudieron borrar los votos.", "error");
      }
    } catch (err) {
      showToast("Error de red al intentar restaurar votos.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#3B82F6] selection:text-black">
      
      {/* 1. Global Interactive Header Banner */}
      <Header config={eventConfig} isLoading={isLoadingConfig} onSelectArtist={setSelectedArtist} />

      {/* 2. Primary Dashboard Viewport Switcher */}
      <main className="flex-grow py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/2 to-transparent opacity-20 pointer-events-none" />
        
        {activeTab === "public" ? (
          /* A. PUBLIC VIEW */
          <SearchBar
            songs={songs}
            votedSongId={votedSongId}
            onVote={handleVote}
            onCancelVote={handleCancelVote}
            eventConfig={eventConfig}
            isVotingInProgress={isVotingInProgress}
          />
        ) : activeTab === "admin-config" ? (
          /* B. ADMIN CONFIGURATION VIEW (Password Locked) */
          !adminToken ? (
            <div className="px-4 py-8">
              <PasswordModal
                title="Consola de Ajustes"
                description="Ingresa la contraseña de configuración configurada para modificar el evento"
                placeholder="Contraseña de Configuración..."
                onConfirm={handleVerifyConfigPassword}
                onCancel={() => setActiveTab("public")}
              />
            </div>
          ) : (
            <AdminConfig
              currentConfig={eventConfig}
              onSaveConfig={handleSaveShowConfig}
              onLogOut={() => {
                setAdminToken(null);
                setActiveTab("public");
              }}
            />
          )
        ) : (
          /* C. LIVE RESULTS RANKING VIEW (Password Locked) */
          !resultsToken ? (
            <div className="px-4 py-8">
              <PasswordModal
                title="Visualizador de Resultados"
                description="Ingresa la contraseña de resultados para monitorear el ranking del recital"
                placeholder="Contraseña de Resultados..."
                onConfirm={handleVerifyResultsPassword}
                onCancel={() => setActiveTab("public")}
              />
            </div>
          ) : (
            <AdminResults
              ranking={ranking}
              stats={stats}
              isLoading={isLoadingResults}
              onRefresh={async () => {
                await fetchRankingData();
              }}
              onLogOut={() => {
                setResultsToken(null);
                setActiveTab("public");
              }}
              onClearAll={handleClearAllVotes}
            />
          )
        )}
      </main>

      {/* Discreet Footer with Admin Access */}
      <footer className="w-full py-8 mt-auto border-t border-white/5 bg-[#070707] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[10px] text-zinc-650 font-mono uppercase tracking-widest leading-none">
          © {new Date().getFullYear()} {eventConfig.evento_nombre || "Recital de Canciones"}
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab("admin-config");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-[9px] text-zinc-500 hover:text-[#3B82F6] font-mono uppercase tracking-wider transition-colors cursor-pointer hover:underline"
          >
            Ajustes de Evento
          </button>
          <span className="text-zinc-800 text-[10px] select-none">|</span>
          <button
            onClick={() => {
              setActiveTab("admin-results");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-[9px] text-zinc-500 hover:text-[#3B82F6] font-mono uppercase tracking-wider transition-colors cursor-pointer hover:underline"
          >
            Ver Resultados
          </button>
        </div>
      </footer>

      {/* Floating Modern Custom Toast Notification Banner */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl p-4 shadow-2xl border flex items-center gap-3 animate-slide-up ${
            toast.type === "success" 
              ? "bg-[#1A1A1A] border-[#3B82F6]/30 text-white" 
              : "bg-[#1C1111] border-red-500/30 text-white"
          }`}
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === "success" ? "bg-[#3B82F6] animate-pulse" : "bg-red-500 animate-pulse"}`} />
          <span className="text-xs font-mono uppercase tracking-wide flex-1 leading-normal">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="text-white/40 hover:text-white transition-colors text-xs font-sans font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Artist biography backdrop modal popup */}
      {selectedArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1A1A] border border-white/10 max-w-sm w-full rounded-2xl p-6 relative shadow-2xl animate-scale-up text-center self-center my-auto max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            <button
              type="button"
              onClick={() => setSelectedArtist(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={16} />
            </button>

            {/* Photo inside popup */}
            <div className="mb-4 flex justify-center">
              {selectedArtist.foto ? (
                <img
                  src={selectedArtist.foto}
                  alt={selectedArtist.nombre}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#3B82F6]/30 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-black border-2 border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] text-xl font-black font-sans shadow-lg">
                  {selectedArtist.nombre.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-white font-sans uppercase tracking-tight">
              {selectedArtist.nombre}
            </h3>

            {/* Biography text content with customizable styles */}
            <div className="mt-3 text-gray-300 text-xs leading-relaxed max-h-40 overflow-y-auto px-1 scrollbar-thin">
              {selectedArtist.bio ? (
                <p className="whitespace-pre-line text-center">{selectedArtist.bio}</p>
              ) : (
                <p className="italic text-gray-550">Biografía para {selectedArtist.nombre} no configurada aún.</p>
              )}
            </div>

            {/* Social Links buttons list */}
            {((selectedArtist.instagram && (selectedArtist.instagram_show !== false)) ||
              (selectedArtist.spotify && (selectedArtist.spotify_show !== false)) ||
              (selectedArtist.youtube && (selectedArtist.youtube_show !== false)) ||
              (selectedArtist.web && (selectedArtist.web_show !== false))) && (
              <div className="mt-5 pt-4 border-t border-white/5 space-y-2.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#3B82F6] font-bold block mb-2 text-center">Conectar con el Artista</span>
                <div className="flex flex-col gap-2">
                  
                  {/* Instagram */}
                  {selectedArtist.instagram && (selectedArtist.instagram_show !== false) && (
                    <a
                      href={`https://instagram.com/${selectedArtist.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-white/5 hover:border-white/10 hover:bg-white/5 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 group"
                    >
                      <Instagram size={14} className="text-pink-500 group-hover:scale-110 transition-transform" />
                      <span>Instagram @{selectedArtist.instagram}</span>
                    </a>
                  )}

                  {/* Spotify */}
                  {selectedArtist.spotify && (selectedArtist.spotify_show !== false) && (
                    <a
                      href={selectedArtist.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-white/5 hover:border-white/10 hover:bg-white/5 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 group"
                    >
                      <Music size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>Spotify</span>
                    </a>
                  )}

                  {/* YouTube */}
                  {selectedArtist.youtube && (selectedArtist.youtube_show !== false) && (
                    <a
                      href={selectedArtist.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-white/5 hover:border-white/10 hover:bg-white/5 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 group"
                    >
                      <Youtube size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {/* Web */}
                  {selectedArtist.web && (selectedArtist.web_show !== false) && (
                    <a
                      href={selectedArtist.web.startsWith("http") ? selectedArtist.web : `https://${selectedArtist.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-white/5 hover:border-white/10 hover:bg-white/5 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 group"
                    >
                      <Globe size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Sitio Web / Enlace</span>
                    </a>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
export { App };
