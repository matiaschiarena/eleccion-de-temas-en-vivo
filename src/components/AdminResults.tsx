import React, { useState, useMemo } from "react";
import { Award, Layers, BarChart3, Filter, RefreshCw, Calendar, Music, Disc, Loader2, ChevronDown, ChevronUp, FileText, BarChart2, TrendingUp, Info, PieChart } from "lucide-react";
import { jsPDF } from "jspdf";
import { SongRank, StatsData, Song } from "../types";

interface AdminResultsProps {
  ranking: SongRank[];
  stats: StatsData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onLogOut: () => void;
  onClearAll: () => Promise<void>;
}

export default function AdminResults({
  ranking,
  stats,
  isLoading,
  onRefresh,
  onLogOut,
  onClearAll,
}: AdminResultsProps) {
  // Clear status states
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Collapsible Stats Block configuration
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [chartMetric, setChartMetric] = useState<"bandas" | "discos" | "anios">("bandas");

  // Filters State
  const [selectedBanda, setSelectedBanda] = useState<string>("TODAS");
  const [selectedDisco, setSelectedDisco] = useState<string>("TODOS");
  const [selectedAnio, setSelectedAnio] = useState<string>("TODOS");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Dynamically extract filter lists from the parsed ranking (all songs)
  const filtersData = useMemo(() => {
    const bandas = new Set<string>();
    const discos = new Set<string>();
    const anios = new Set<number>();

    ranking.forEach((song) => {
      if (song.banda) bandas.add(song.banda);
      if (song.disco) discos.add(song.disco);
      if (song.anio) anios.add(song.anio);
    });

    return {
      bandas: ["TODAS", ...Array.from(bandas).sort()],
      discos: ["TODOS", ...Array.from(discos).sort()],
      anios: ["TODOS", ...Array.from(anios).sort((a, b) => b - a).map(String)],
    };
  }, [ranking]);

  // Reset secondary filters if Band changes to keep them contextually relevant
  const handleBandaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBanda(e.target.value);
    setSelectedDisco("TODOS"); // Reset album as it varies per band
  };

  // Filtered Ranking computed on the fly (Only include songs with at least one vote)
  const filteredRanking = useMemo(() => {
    return ranking.filter((song) => {
      const matchBanda = selectedBanda === "TODAS" || song.banda === selectedBanda;
      const matchDisco = selectedDisco === "TODOS" || song.disco === selectedDisco;
      const matchAnio = selectedAnio === "TODOS" || String(song.anio) === selectedAnio;
      return matchBanda && matchDisco && matchAnio && song.votesCount > 0;
    });
  }, [ranking, selectedBanda, selectedDisco, selectedAnio]);

  // Top voted song in current subset
  const topVotedInFilter = useMemo(() => {
    if (filteredRanking.length === 0) return null;
    const sorted = [...filteredRanking].sort((a, b) => b.votesCount - a.votesCount);
    return sorted[0].votesCount > 0 ? sorted[0] : null;
  }, [filteredRanking]);

  // Contextual Dynamic Albums: list only albums relevant for the selected band
  const availableDiscos = useMemo(() => {
    if (selectedBanda === "TODAS") return filtersData.discos;
    
    const bandDiscos = new Set<string>();
    ranking.forEach((song) => {
      if (song.banda === selectedBanda) {
        bandDiscos.add(song.disco);
      }
    });
    return ["TODOS", ...Array.from(bandDiscos).sort()];
  }, [selectedBanda, ranking, filtersData.discos]);

  // Calculate percentages and statistics
  const maxVotes = useMemo(() => {
    if (ranking.length === 0) return 1;
    return Math.max(...ranking.map((s) => s.votesCount), 1);
  }, [ranking]);

  const totalVotesCount = stats?.totalVotes || 0;

  // Aggregated detailed statistics computed from client-side array
  // We count the number of UNIQUE songs chosen/voted per band, album, and year to keep the analysis precise.
  const detailedStats = useMemo(() => {
    const bandaVotes: Record<string, number> = {};
    const discoVotes: Record<string, number> = {};
    const anioVotes: Record<number, number> = {};
    
    ranking.forEach((song) => {
      if (song.votesCount > 0) {
        // Banda (ensure clean matching)
        const b = song.banda || "Otros";
        bandaVotes[b] = (bandaVotes[b] || 0) + 1; // Count 1 unique song chosen
        
        // Disco
        const d = song.disco || "Sin Disco";
        discoVotes[d] = (discoVotes[d] || 0) + 1; // Count 1 unique song chosen
        
        // Año
        const a = song.anio;
        if (a) {
          anioVotes[a] = (anioVotes[a] || 0) + 1; // Count 1 unique song chosen
        }
      }
    });

    const bandas = Object.entries(bandaVotes).sort((a, b) => b[1] - a[1]);
    const discos = Object.entries(discoVotes).sort((a, b) => b[1] - a[1]);
    const anios = Object.entries(anioVotes).sort((a, b) => b[1] - a[1]); // sorted descending by unique chosen themes

    return {
      bandas,
      discos,
      anios,
      hasVotes: bandas.length > 0
    };
  }, [ranking]);

  const totalUniqueVotedSongs = useMemo(() => {
    return ranking.filter(song => song.votesCount > 0).length;
  }, [ranking]);

  // Export beautiful detailed PDF report of song votes and stats 
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const accentColorRGB = [59, 130, 246]; // Blue [#3B82F6]

    // Title Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(18, 18, 18);
    doc.text("REPORTE DE VOTACIÓN - CHARLY RECITAL", 15, 22);

    // Decorative underline bar
    doc.setFillColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.rect(15, 26, 40, 1.5, "F");

    // Header Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de Generación: ${new Date().toLocaleString()}`, 15, 33);
    doc.text("Sistema de Votación Charly García - Votos en Vivo", 15, 37);

    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.3);
    doc.line(15, 41, 195, 41);

    let y = 50;

    // Summary block section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.text("1. RESUMEN EN VIVO", 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    
    doc.text(`Total de Votantes o Votos Registrados: ${totalVotesCount} votos`, 15, y);
    y += 6;
    doc.text(`Temas que recibieron al menos un voto: ${filteredRanking.length} temas`, 15, y);
    y += 6;

    if (topVotedInFilter) {
      doc.text(`Tema Favorito del Público: "${topVotedInFilter.tema}" con ${topVotedInFilter.votesCount} votos (${Math.round((topVotedInFilter.votesCount / Math.max(totalVotesCount, 1)) * 100)}% de los votos totales).`, 15, y);
      y += 10;
    } else {
      y += 4;
    }

    doc.line(15, y, 195, y);
    y += 10;

    // Part A: Bands & Projects
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.text("2. DISTRIBUCIÓN DE TEMAS ELEGIDOS POR BANDA DE ORIGEN", 15, y);
    y += 8;

    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text("Nombre del Proyecto / Grupo", 15, y);
    doc.text("Temas Elegidos", 110, y);
    doc.text("Porcentaje", 160, y);
    y += 4;
    doc.line(15, y, 195, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    if (detailedStats.bandas.length === 0) {
      doc.text("No se registraron votos aún.", 15, y);
      y += 8;
    } else {
      detailedStats.bandas.forEach(([banda, votos]) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const p = Math.round((votos / Math.max(totalUniqueVotedSongs, 1)) * 100);
        doc.text(banda, 15, y);
        doc.text(`${votos} ${votos === 1 ? "tema" : "temas"}`, 110, y);
        doc.text(`${p}%`, 160, y);
        y += 7;
      });
    }

    // Part B: Discos & Albums
    y += 6;
    if (y > 220) { doc.addPage(); y = 20; }
    else { doc.line(15, y, 195, y); y += 10; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.text("3. DISTRIBUCIÓN DE TEMAS ELEGIDOS POR DISCO / ÁLBUM", 15, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text("Título del Álbum", 15, y);
    doc.text("Temas Elegidos", 110, y);
    doc.text("Porcentaje", 160, y);
    y += 4;
    doc.line(15, y, 195, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    if (detailedStats.discos.length === 0) {
      doc.text("No se registraron votos aún.", 15, y);
      y += 8;
    } else {
      detailedStats.discos.slice(0, 15).forEach(([disco, votos]) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const p = Math.round((votos / Math.max(totalUniqueVotedSongs, 1)) * 100);
        doc.text(disco, 15, y);
        doc.text(`${votos} ${votos === 1 ? "tema" : "temas"}`, 110, y);
        doc.text(`${p}%`, 160, y);
        y += 7;
      });
      if (detailedStats.discos.length > 15) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(120, 120, 120);
        doc.text(`* Mostrando los primeros 15 discos de un total de ${detailedStats.discos.length}`, 15, y);
        y += 7;
      }
    }

    // Part C: Years
    y += 5;
    if (y > 220) { doc.addPage(); y = 20; }
    else { doc.line(15, y, 195, y); y += 10; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.text("4. DISTRIBUCIÓN DE TEMAS ELEGIDOS POR AÑO DE LANZAMIENTO", 15, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text("Año", 15, y);
    doc.text("Temas Elegidos", 110, y);
    doc.text("Porcentaje", 160, y);
    y += 4;
    doc.line(15, y, 195, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    if (detailedStats.anios.length === 0) {
      doc.text("No se registraron votos aún.", 15, y);
      y += 8;
    } else {
      detailedStats.anios.slice(0, 15).forEach(([anio, votos]) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const p = Math.round((votos / Math.max(totalUniqueVotedSongs, 1)) * 100);
        doc.text(`Año ${anio}`, 15, y);
        doc.text(`${votos} ${votos === 1 ? "tema" : "temas"}`, 110, y);
        doc.text(`${p}%`, 160, y);
        y += 7;
      });
    }

    // New Page: Complete Track Rankings List
    doc.addPage();
    y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.text("5. DETALLE DE CANCIONES Y TEMAS ELEGIDOS (RANKING COMPLETO)", 15, y);
    y += 5;
    
    doc.setFillColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.rect(15, y, 30, 1, "F");
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text("Pos", 15, y);
    doc.text("Tema", 25, y);
    doc.text("Banda", 105, y);
    doc.text("Disco (Año)", 150, y);
    doc.text("Votos", 185, y);
    y += 4;
    doc.line(15, y, 195, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 45, 45);

    let rankPos = 1;
    filteredRanking.forEach((song) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(String(rankPos), 15, y);
      doc.text(song.tema.length > 38 ? song.tema.substring(0, 36) + "..." : song.tema, 25, y);
      doc.text(song.banda.length > 22 ? song.banda.substring(0, 20) + "..." : song.banda, 105, y);
      doc.text(`${song.disco.length > 18 ? song.disco.substring(0, 16) + "..." : song.disco} (${song.anio})`, 150, y);
      doc.text(String(song.votesCount), 185, y);
      y += 6.5;
      rankPos++;
    });

    const fileDate = new Date().toISOString().split("T")[0];
    doc.save(`votos_recital_charly_${fileDate}.pdf`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in" id="results-panel">
      
      {/* Panel header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="text-[#3B82F6] animate-pulse" size={20} />
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">
            Resultados de Votación en Vivo
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="refresh-results-btn"
            disabled={isLoading}
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white font-mono text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </button>
          
          <button
            onClick={onLogOut}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-mono text-xs transition-colors uppercase cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>

      {/* Grid: Overview Quick Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total de Votos:</span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalVotesCount}</span>
            <span className="text-xs font-mono text-gray-500">votos</span>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Favorito Recital:</span>
          <div className="mt-2 text-gray-200 font-sans truncate">
            {topVotedInFilter ? (
              <span className="font-bold text-[#3B82F6] text-sm block truncate pr-1">
                "{topVotedInFilter.tema}"
              </span>
            ) : (
              <span className="text-gray-500 text-xs italic">Aún sin votos</span>
            )}
            <span className="text-[10px] font-mono text-gray-500 block truncate mt-0.5">
              {topVotedInFilter ? `${topVotedInFilter.votesCount} votos (${Math.round((topVotedInFilter.votesCount / Math.max(totalVotesCount, 1)) * 100)}%)` : "---"}
            </span>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Temas mostrados:</span>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{filteredRanking.length}</span>
            <span className="text-xs font-mono text-gray-500">/ {ranking.length}</span>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Banda Líder:</span>
          <div className="mt-2 text-gray-200 font-mono text-xs truncate">
            {stats && Object.keys(stats.byBanda).length > 0 ? (
              (() => {
                const leading = Object.entries(stats.byBanda).sort((a, b) => b[1] - a[1])[0];
                return (
                  <>
                    <span className="font-bold text-[#3B82F6] text-sm block truncate">{leading[0]}</span>
                    <span className="text-[10px] text-gray-500">{leading[1]} votos</span>
                  </>
                );
              })()
            ) : (
              <span className="text-gray-500 text-xs italic block mt-1">Sin tendencias</span>
            )}
          </div>
        </div>

      </div>

      {/* Main Ranking Display */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-6">
        <div className="px-5 py-4 bg-[#0A0A0A] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-200 font-sans flex items-center gap-1.5">
              <Award size={15} className="text-[#3B82F6]" />
              Tabla de Votos Directa
            </h3>
            <span className="text-[10px] font-mono text-gray-500">
              Ordenado de mayor a menor votos acumulados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                isFiltersExpanded || selectedBanda !== "TODAS" || selectedDisco !== "TODOS" || selectedAnio !== "TODOS"
                  ? "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6] font-bold"
                  : "bg-[#0A0A0A] border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Filter size={12} />
              Filtrar Canciones
              {isFiltersExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {/* Collapsible Dropdown Filter Container inside Card */}
        {isFiltersExpanded && (
          <div className="px-5 py-4 border-b border-white/5 bg-[#121212] space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Band Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Banda Charly:</label>
                <div className="relative">
                  <select
                    id="filter-band"
                    value={selectedBanda}
                    onChange={handleBandaChange}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none outline-none font-sans cursor-pointer h-9"
                  >
                    {filtersData.bandas.map((banda) => (
                      <option key={banda} value={banda}>{banda}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pr-1 text-gray-500">
                    <Music size={11} className="text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Disco / Album Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Disco / Álbum:</label>
                <div className="relative">
                  <select
                    id="filter-album"
                    value={selectedDisco}
                    onChange={(e) => setSelectedDisco(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none outline-none font-sans cursor-pointer h-9"
                  >
                    {availableDiscos.map((disco) => (
                      <option key={disco} value={disco}>{disco}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pr-1 text-gray-500">
                    <Disc size={11} className="text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Year selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Año Lanzamiento:</label>
                <div className="relative">
                  <select
                    id="filter-year"
                    value={selectedAnio}
                    onChange={(e) => setSelectedAnio(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none outline-none font-mono cursor-pointer h-9"
                  >
                    {filtersData.anios.map((anio) => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pr-1 text-gray-500">
                    <Calendar size={11} className="text-gray-500" />
                  </div>
                </div>
              </div>

            </div>

            {/* Clear filters shortcut */}
            {(selectedBanda !== "TODAS" || selectedDisco !== "TODOS" || selectedAnio !== "TODOS") && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBanda("TODAS");
                    setSelectedDisco("TODOS");
                    setSelectedAnio("TODOS");
                  }}
                  className="text-[10px] font-mono text-[#3B82F6] hover:text-[#3B82F6]/85 underline underline-offset-2 flex items-center gap-1 bg-transparent hover:bg-white/5 px-2.5 py-1 rounded cursor-pointer transition-colors"
                >
                  Limpiar Filtros de Búsqueda
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic active filters summary when collapsed */}
        {!isFiltersExpanded && (selectedBanda !== "TODAS" || selectedDisco !== "TODOS" || selectedAnio !== "TODOS") && (
          <div className="px-5 py-2.5 border-b border-white/5 bg-[#141414] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-[10px] font-sans text-gray-400 flex-wrap">
              <span className="font-semibold text-gray-300">Filtros activos:</span>
              {selectedBanda !== "TODAS" && (
                <span className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-2.5 py-0.5 rounded-full font-mono text-[9px]">
                  Banda: {selectedBanda}
                </span>
              )}
              {selectedDisco !== "TODOS" && (
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono text-[9px]">
                  Disco: {selectedDisco}
                </span>
              )}
              {selectedAnio !== "TODOS" && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono text-[9px]">
                  Año: {selectedAnio}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedBanda("TODAS");
                setSelectedDisco("TODOS");
                setSelectedAnio("TODOS");
              }}
              className="text-[10px] font-mono text-[#3B82F6] hover:text-[#3B82F6]/85 underline cursor-pointer"
            >
              [X] Ver todos
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#3B82F6]" size={24} />
            <p className="text-sm font-mono">Buscando tendencias creadas...</p>
          </div>
        ) : filteredRanking.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-mono text-xs">
            No hay canciones con votos para mostrar bajo los filtros actuales.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {filteredRanking.map((song, index) => {
              const percent = Math.max(Math.round((song.votesCount / maxVotes) * 100), 2);
              const hasVotes = song.votesCount > 0;
              const formattedNum = String(index + 1).padStart(2, '0');
              
              return (
                <div key={song.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-center justify-between gap-6 group last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      {/* Numerical position - Sleek layout */}
                      <span className="text-2xl font-bold text-white/20 italic w-8 text-left">
                        {formattedNum}
                      </span>
                      
                      <p className={`font-semibold text-sm truncate ${hasVotes ? "text-white group-hover:text-[#3B82F6]" : "text-gray-400"} transition-colors`}>
                        "{song.tema}"
                      </p>
                    </div>

                    <div className="mt-1 flex items-center gap-2 flex-wrap pl-12 text-[10px] text-gray-400 font-sans">
                      <span className="text-gray-300 font-semibold">{song.banda}</span>
                      <span>•</span>
                      <span className="italic font-serif">"{song.disco}" ({song.anio})</span>
                    </div>

                    {/* Bar indicator matching Sleek Theme */}
                    <div className="mt-2.5 pl-12 max-w-sm">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            hasVotes 
                              ? "bg-gradient-to-r from-[#3B82F6] to-indigo-500" 
                              : "bg-white/10"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Numeric Count Capsule */}
                  <div className="flex-shrink-0 text-right min-w-16">
                    <div className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 font-mono text-xs font-bold leading-none ${
                      hasVotes 
                        ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30" 
                        : "bg-[#0A0A0A] text-gray-500 border border-white/5"
                    }`}>
                      {song.votesCount} {song.votesCount === 1 ? "voto" : "votos"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsible advanced analysis & diagrams panel */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden mb-6 shadow-xl transition-all duration-300" id="stats-accordion-panel">
        <div 
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className="px-5 py-4 bg-[#111111] border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] select-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <PieChart size={18} className="text-[#3B82F6]" />
            <div>
              <h3 className="font-bold text-sm text-white font-sans">
                Estadísticas del Recital
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Distribución por bandas, discos y años de temas elegidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleExportPDF}
              disabled={totalVotesCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3B82F6] hover:bg-[#3B82F6]/90 border border-transparent text-white font-mono text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Exportar Reporte Completo en Formato PDF"
            >
              <FileText size={12} />
              Exportar PDF
            </button>
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isStatsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isStatsExpanded && (
          <div className="p-5 space-y-5 animate-fade-in">
            {totalVotesCount === 0 ? (
              <div className="p-6 text-center text-gray-400 font-mono text-xs">
                Sin datos suficientes. Registre votos para habilitar los análisis estadísticos.
              </div>
            ) : (
              <div className="min-h-[220px]">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                      <TrendingUp size={13} className="text-[#3B82F6]" />
                      Estadísticas
                    </span>
                    
                    {/* Toggle dynamic metric shown */}
                    <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5 gap-1 self-start">
                      <button
                        type="button"
                        onClick={() => setChartMetric("bandas")}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer ${
                          chartMetric === "bandas" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Banda
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric("discos")}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer ${
                          chartMetric === "discos" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Disco (Top 8)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric("anios")}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer ${
                          chartMetric === "anios" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Año
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Graphic container */}
                  <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-3.5">
                    {(() => {
                      let data: [string, number][] = [];
                      if (chartMetric === "bandas") {
                        data = detailedStats.bandas;
                      } else if (chartMetric === "discos") {
                        data = detailedStats.discos.slice(0, 8);
                      } else {
                        data = detailedStats.anios;
                      }

                      if (data.length === 0) {
                        return <p className="text-center py-8 text-gray-500 font-mono text-xs">Sin votos registrados en este segmento.</p>;
                      }

                      const maxVal = Math.max(...data.map(d => d[1]), 1);

                      return (
                        <div className="space-y-3">
                          {data.map(([label, value]) => {
                            const percentOfTotal = Math.round((value / Math.max(totalUniqueVotedSongs, 1)) * 100);
                            const widthPercent = Math.max(Math.round((value / maxVal) * 100), 2);
                            
                            return (
                              <div key={label} className="space-y-1 group">
                                <div className="flex justify-between text-[11px] font-mono text-gray-300">
                                  <span className="truncate max-w-[200px] text-gray-200 group-hover:text-[#3B82F6] transition-colors font-sans font-bold">
                                    {chartMetric === "anios" ? `Año ${label}` : label}
                                  </span>
                                  <span className="flex-shrink-0 text-gray-400 font-semibold pl-2">
                                    {value} {value === 1 ? "tema elegido" : "temas elegidos"} <span className="text-gray-500 text-[10px]">({percentOfTotal}%)</span>
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex">
                                  <div
                                    style={{ width: `${widthPercent}%` }}
                                    className="bg-gradient-to-r from-[#3B82F6] to-indigo-500 h-full rounded-full transition-all duration-700 ease-out hover:brightness-110 animate-scale-up"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dangerous Zone / Borrar datos */}
      <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
        <div className="text-center max-w-sm space-y-1">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-500">Zona de Peligro</h4>
          <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
            Borrar los datos eliminará definitivamente todos los votos registrados hasta el momento. Esta acción no se puede deshacer.
          </p>
        </div>
        
        {isConfirmingClear ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in bg-red-950/10 border border-red-500/20 p-3.5 rounded-xl">
            <span className="text-[11px] font-mono text-yellow-500">¿Confirmás eliminar todos los votos acumulados?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsClearing(true);
                  try {
                    await onClearAll();
                  } finally {
                    setIsClearing(false);
                    setIsConfirmingClear(false);
                  }
                }}
                disabled={isClearing}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {isClearing ? "Eliminando..." : "Sí, borrar votos"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="px-4 py-2 rounded-xl border border-red-500/20 hover:border-red-500/40 hover:bg-red-950/10 text-red-400 hover:text-red-300 font-mono text-xs font-bold uppercase transition-all tracking-wide cursor-pointer"
          >
            Borrar Datos de Votación
          </button>
        )}
      </div>

    </div>
  );
}
