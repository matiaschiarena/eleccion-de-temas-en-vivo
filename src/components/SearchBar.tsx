import React, { useState, useEffect, useRef } from "react";
import { Search, Music, Sparkles, Check, X, AlertCircle, Heart, Undo2 } from "lucide-react";
import { Song, EventConfig } from "../types";

interface SearchBarProps {
  songs: Song[];
  votedSongId: string | null;
  onVote: (songId: string) => Promise<void>;
  onCancelVote: (songId: string) => Promise<void>;
  eventConfig: EventConfig;
  isVotingInProgress: boolean;
}

export default function SearchBar({
  songs,
  votedSongId,
  onVote,
  onCancelVote,
  eventConfig,
  isVotingInProgress,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse if voter restriction is bypassed by Test Mode
  const isVoterLockActive = eventConfig.restriccion_activa;

  // Find the details of the already voted song
  const alreadyVotedSong = songs.find((s) => s.id === votedSongId);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalizes text to be lowercase and free of accents/diacritics
  const normalizeText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Update suggestions on query change
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    const filterText = normalizeText(query);
    const filtered = songs
      .filter((song) => {
        return normalizeText(song.tema).includes(filterText);
      })
      .slice(0, 8); // Max 8 autocompleted suggestions
    setSuggestions(filtered);
  }, [query, songs]);

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleConfirmVote = async () => {
    if (!selectedSong) return;
    await onVote(selectedSong.id);
    setSelectedSong(null);
  };

  // Helper to stylize a badge based on Charly's band
  const getBandBadgeStyles = (band: string) => {
    const b = band.toLowerCase();
    if (b.includes("sui generis")) {
      return {
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pill: "bg-emerald-400",
      };
    } else if (b.includes("serú giran") || b.includes("seru giran")) {
      return {
        bg: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
        pill: "bg-[#3B82F6]",
      };
    } else if (b.includes("máquina") || b.includes("maquina")) {
      return {
        bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        pill: "bg-purple-400",
      };
    } else if (b.includes("solista")) {
      return {
        bg: "bg-sky-450/10 text-sky-400 border-sky-400/20",
        pill: "bg-sky-400",
      };
    } else {
      return {
        bg: "bg-[#3B82F6]/10 text-[#3B82F6] border-white/10",
        pill: "bg-[#3B82F6]",
      };
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 animate-fade-in" id="voting-panel">
      
      {/* 1. Voter lock active: display current voted song with cancel option */}
      {isVoterLockActive && alreadyVotedSong ? (
        <div className="mt-2 p-5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-[8.5px] font-mono uppercase tracking-wider rounded-bl-lg border-l border-b border-[#3B82F6]/20">
            ✓ Votado
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3B82F6] text-[#0A0A0A] rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">
              ✓
            </div>
            <div>
              <div className="text-[10px] text-[#3B82F6] font-mono uppercase tracking-wider">Tu elección registrada</div>
              <div className="text-base font-bold text-white leading-tight mt-0.5">"{alreadyVotedSong.tema}"</div>
              <div className="text-[11px] text-gray-400 font-sans mt-0.5">
                {alreadyVotedSong.banda} • <span className="text-gray-300 italic">{alreadyVotedSong.disco}</span> ({alreadyVotedSong.anio})
              </div>
            </div>
          </div>
          
          {isCanceling ? (
            <div className="flex flex-col gap-1.5 items-end w-full md:w-auto mt-2 md:mt-0">
              <span className="text-[10px] text-yellow-450 font-mono text-right">¿Seguro de cambiar tu voto?</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCanceling(false)}
                  className="text-[9px] uppercase text-gray-400 hover:text-white transition-all py-1 px-2 border border-white/10 rounded cursor-pointer"
                >
                  No, mantener
                </button>
                <button
                  type="button"
                  disabled={isVotingInProgress}
                  onClick={async () => {
                    await onCancelVote(alreadyVotedSong.id);
                    setIsCanceling(false);
                  }}
                  className="text-[9px] font-bold uppercase text-red-500 hover:text-red-400 transition-all py-1 px-2 border border-red-500/20 rounded cursor-pointer disabled:opacity-50"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              id="cancel-vote-button"
              disabled={isVotingInProgress}
              onClick={() => setIsCanceling(true)}
              className="text-[10px] font-bold uppercase underline underline-offset-4 text-gray-300 hover:text-[#3B82F6] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 md:mt-0 mt-1"
            >
              Cambiar Voto
            </button>
          )}
        </div>
      ) : selectedSong ? (
        /* 3. Fully Compact Confirmation Screen with no heavy graphic, optimized to prevent scrolling */
        <div id="confirmation-panel" className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 shadow-2xl relative overflow-hidden animate-scale-up text-center">
          <div className="absolute top-2 right-2">
            <button 
              type="button"
              onClick={() => setSelectedSong(null)} 
              className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Cerrar confirmación"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-2 py-1">
            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase font-semibold border bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20">
              {selectedSong.banda}
            </span>
            <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">Confirmá tu voto para el show</p>
            
            <div className="space-y-0.5">
              <h3 className="text-white text-lg font-bold tracking-tight leading-tight">
                "{selectedSong.tema}"
              </h3>
              <p className="text-gray-400 text-xs font-semibold">
                Disco: <span className="text-gray-300 italic">{selectedSong.disco}</span> ({selectedSong.anio})
              </p>
            </div>
          </div>

          {/* Action Buttons styled with tighter padding and small dimensions */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => setSelectedSong(null)}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-[10px] font-bold uppercase transition-all font-mono tracking-wide cursor-pointer"
            >
              Volver
            </button>
            <button
              id="confirm-button"
              disabled={isVotingInProgress}
              type="button"
              onClick={handleConfirmVote}
              className="px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-black font-bold text-[10px] uppercase tracking-wide font-mono shadow-md hover:shadow-[#3B82F6]/20 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Check size={12} />
              {isVotingInProgress ? "Votando..." : "SÍ, VOTAR"}
            </button>
          </div>
        </div>
      ) : (
        /* 2. Standard Search and Autocomplete Engine */
        <div className="space-y-4">
          
          {/* Section banner without any heavy subtitle description, to save screen estate */}
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-light mb-1 text-white">
              ¿Qué canción <span className="italic font-serif text-[#3B82F6]">querés escuchar?</span>
            </h2>
            {!isVoterLockActive && (
              <div className="inline-block mt-1 px-2.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[9px] font-mono rounded-full border border-yellow-500/20 uppercase tracking-wider animate-pulse font-bold">
                ⚡ MODO TEST (Votos ilimitados)
              </div>
            )}
          </div>

          {/* Search box & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="Buscá por nombre, disco..."
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:border-[#3B82F6] transition-all placeholder:text-white/20 text-white outline-none"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/20 hover:text-white transition-all p-1"
                  aria-label="Clean input"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Recommendations Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div 
                id="search-dropdown" 
                className="absolute z-20 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl p-1"
              >
                {suggestions.map((song) => {
                  const tagStyles = getBandBadgeStyles(song.banda);
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleSelectSong(song)}
                      className="w-full text-left px-3 py-2 border-b border-white/5 last:border-none hover:bg-[#3B82F6]/20 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="overflow-hidden">
                        <span className="font-semibold text-xs text-gray-200 group-hover:text-white transition-colors block truncate">
                          {song.tema}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5 block truncate">
                          {song.disco} • {song.anio}
                        </span>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[8px] font-mono uppercase font-semibold border ${tagStyles.bg}`}>
                        {song.banda}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No suggestions banner */}
            {showDropdown && query.trim() && suggestions.length === 0 && (
              <div className="absolute z-20 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-center shadow-2xl animate-fade-in">
                <AlertCircle className="mx-auto text-white/25 mb-1" size={16} />
                <p className="text-xs text-gray-300 font-mono">No encontramos canciones.</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Probá otra palabra clave como "Cli", "Sui" o "Promesas"</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
