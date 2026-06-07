import React from "react";
import { Music, Calendar, MapPin, Sparkles, Instagram, X } from "lucide-react";
import { EventConfig, ArtistDetail } from "../types";

interface HeaderProps {
  config: EventConfig;
  isLoading: boolean;
  onSelectArtist: (artist: ArtistDetail) => void;
}

export default function Header({ config, isLoading, onSelectArtist }: HeaderProps) {
  // Construct artist details matching configuration fields with fallback
  const artista1: ArtistDetail = {
    nombre: config.artista_1_nombre || "Marina Wil",
    foto: config.artista_1_foto || "",
    bio: config.artista_1_bio || "Cantautora y pianista argentina. Con su voz dulce y arreglos sofisticados, recrea la obra de Charly con una sensibilidad única.",
    instagram: config.artista_1_instagram || "",
    instagram_show: config.artista_1_instagram_show !== undefined ? config.artista_1_instagram_show : true,
    spotify: config.artista_1_spotify || "",
    spotify_show: !!config.artista_1_spotify_show,
    youtube: config.artista_1_youtube || "",
    youtube_show: !!config.artista_1_youtube_show,
    web: config.artista_1_web || "",
    web_show: !!config.artista_1_web_show,
  };

  const artista2: ArtistDetail = {
    nombre: config.artista_2_nombre || "Ian Shifres",
    foto: config.artista_2_foto || "",
    bio: config.artista_2_bio || "Multiinstrumentista, pianista y compositor. Aporta un virtuosismo musical incomparable para dar vida a los clásicos del maestro.",
    instagram: config.artista_2_instagram || "",
    instagram_show: config.artista_2_instagram_show !== undefined ? config.artista_2_instagram_show : true,
    spotify: config.artista_2_spotify || "",
    spotify_show: !!config.artista_2_spotify_show,
    youtube: config.artista_2_youtube || "",
    youtube_show: !!config.artista_2_youtube_show,
    web: config.artista_2_web || "",
    web_show: !!config.artista_2_web_show,
  };

  return (
    <header className="relative w-full bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-4 md:px-6">
      {/* Subtle modern ambient highlight */}
      <div className="absolute top-0 left-1/4 w-[100px] h-[100px] md:w-[200px] md:h-[200px] rounded-full bg-[#3B82F6]/5 blur-[40px] md:blur-[60px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center md:items-start gap-3 relative z-10">
        
        {/* Brand & Concert Context */}
        <div className="w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">En Vivo</span>
            </div>
            
            {!config.restriccion_activa && (
              <div className="px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-1 text-[9px] font-bold text-yellow-500 uppercase tracking-widest">
                <span>Modo Test</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-white/5 rounded-md w-2/3 mx-auto md:mx-0"></div>
              <div className="h-4 bg-white/5 rounded-md w-1/2 mx-auto md:mx-0"></div>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-[#3B82F6] font-sans">
                {config.evento_nombre || "Las canciones más lindas de Charly"}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="text-white font-medium">{config.artistas || "Marina Wil & Ian Shifres"}</span>
                <span className="text-white/20 hidden sm:inline">|</span>
                <span>{config.lugar || "La casa de Lolita"}</span>
                <span className="text-white/20 hidden sm:inline">|</span>
                <span className="font-mono">{config.fecha || "05.06.2026"}</span>
              </div>

              {/* Interactive Artist Avatars row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                {config.cantidad_artistas === 1 ? (
                  <button 
                    type="button"
                    onClick={() => onSelectArtist(artista1)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left font-sans cursor-pointer group"
                    aria-label={`Ver información de ${artista1.nombre}`}
                  >
                    {artista1.foto ? (
                      <img 
                        src={artista1.foto} 
                        alt={artista1.nombre} 
                        className="w-8 h-8 rounded-full object-cover border border-[#3B82F6]/30 group-hover:border-[#3B82F6] transition-all flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#3B82F6] font-bold text-[10px] flex items-center justify-center border border-[#3B82F6]/30 font-mono flex-shrink-0">
                        {artista1.nombre.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-white font-bold tracking-tight leading-none">{artista1.nombre}</div>
                      <div className="text-[8px] text-[#3B82F6] font-mono uppercase tracking-wider mt-0.5">Info & Redes ✦</div>
                    </div>
                  </button>
                ) : (
                  <>
                    <button 
                      type="button"
                      onClick={() => onSelectArtist(artista1)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left font-sans cursor-pointer group"
                      aria-label={`Ver información de ${artista1.nombre}`}
                    >
                      {artista1.foto ? (
                        <img 
                          src={artista1.foto} 
                          alt={artista1.nombre} 
                          className="w-8 h-8 rounded-full object-cover border border-[#3B82F6]/30 group-hover:border-[#3B82F6] transition-all flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#3B82F6] font-bold text-[10px] flex items-center justify-center border border-[#3B82F6]/30 font-mono flex-shrink-0">
                          MW
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] text-white font-bold tracking-tight leading-none">{artista1.nombre}</div>
                        <div className="text-[8px] text-[#3B82F6] font-mono uppercase tracking-wider mt-0.5">Info & Redes ✦</div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => onSelectArtist(artista2)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left font-sans cursor-pointer group"
                      aria-label={`Ver información de ${artista2.nombre}`}
                    >
                      {artista2.foto ? (
                        <img 
                          src={artista2.foto} 
                          alt={artista2.nombre} 
                          className="w-8 h-8 rounded-full object-cover border border-[#3B82F6]/30 group-hover:border-[#3B82F6] transition-all flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#3B82F6] font-bold text-[10px] flex items-center justify-center border border-[#3B82F6]/30 font-mono flex-shrink-0">
                          IS
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] text-white font-bold tracking-tight leading-none">{artista2.nombre}</div>
                        <div className="text-[8px] text-[#3B82F6] font-mono uppercase tracking-wider mt-0.5">Info & Redes ✦</div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

      </div>

    </header>
  );
}
