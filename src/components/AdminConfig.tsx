import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, RotateCw, AlertCircle, HelpCircle, ToggleLeft, ToggleRight, Instagram, Youtube, Music, Globe } from "lucide-react";
import { EventConfig } from "../types";

interface AdminConfigProps {
  currentConfig: EventConfig;
  onSaveConfig: (updatedConfig: EventConfig) => Promise<boolean>;
  onLogOut: () => void;
}

export default function AdminConfig({ currentConfig, onSaveConfig, onLogOut }: AdminConfigProps) {
  const [formData, setFormData] = useState<EventConfig>({
    ...currentConfig,
    cantidad_artistas: currentConfig.cantidad_artistas || 2,
    artista_1_nombre: currentConfig.artista_1_nombre || "Marina Wil",
    artista_1_foto: currentConfig.artista_1_foto || "",
    artista_1_bio: currentConfig.artista_1_bio || "",
    artista_1_instagram: currentConfig.artista_1_instagram || "",
    artista_1_instagram_show: currentConfig.artista_1_instagram_show !== undefined ? currentConfig.artista_1_instagram_show : true,
    artista_1_spotify: currentConfig.artista_1_spotify || "",
    artista_1_spotify_show: !!currentConfig.artista_1_spotify_show,
    artista_1_youtube: currentConfig.artista_1_youtube || "",
    artista_1_youtube_show: !!currentConfig.artista_1_youtube_show,
    artista_1_web: currentConfig.artista_1_web || "",
    artista_1_web_show: !!currentConfig.artista_1_web_show,
    artista_2_nombre: currentConfig.artista_2_nombre || "Ian Shifres",
    artista_2_foto: currentConfig.artista_2_foto || "",
    artista_2_bio: currentConfig.artista_2_bio || "",
    artista_2_instagram: currentConfig.artista_2_instagram || "",
    artista_2_instagram_show: currentConfig.artista_2_instagram_show !== undefined ? currentConfig.artista_2_instagram_show : true,
    artista_2_spotify: currentConfig.artista_2_spotify || "",
    artista_2_spotify_show: !!currentConfig.artista_2_spotify_show,
    artista_2_youtube: currentConfig.artista_2_youtube || "",
    artista_2_youtube_show: !!currentConfig.artista_2_youtube_show,
    artista_2_web: currentConfig.artista_2_web || "",
    artista_2_web_show: !!currentConfig.artista_2_web_show,
    artista_separador: currentConfig.artista_separador || " & ",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initial configuration changes in the parent
  useEffect(() => {
    setFormData({
      ...currentConfig,
      cantidad_artistas: currentConfig.cantidad_artistas || 2,
      artista_1_nombre: currentConfig.artista_1_nombre || "Marina Wil",
      artista_1_foto: currentConfig.artista_1_foto || "",
      artista_1_bio: currentConfig.artista_1_bio || "",
      artista_1_instagram: currentConfig.artista_1_instagram || "",
      artista_1_instagram_show: currentConfig.artista_1_instagram_show !== undefined ? currentConfig.artista_1_instagram_show : true,
      artista_1_spotify: currentConfig.artista_1_spotify || "",
      artista_1_spotify_show: !!currentConfig.artista_1_spotify_show,
      artista_1_youtube: currentConfig.artista_1_youtube || "",
      artista_1_youtube_show: !!currentConfig.artista_1_youtube_show,
      artista_1_web: currentConfig.artista_1_web || "",
      artista_1_web_show: !!currentConfig.artista_1_web_show,
      artista_2_nombre: currentConfig.artista_2_nombre || "Ian Shifres",
      artista_2_foto: currentConfig.artista_2_foto || "",
      artista_2_bio: currentConfig.artista_2_bio || "",
      artista_2_instagram: currentConfig.artista_2_instagram || "",
      artista_2_instagram_show: currentConfig.artista_2_instagram_show !== undefined ? currentConfig.artista_2_instagram_show : true,
      artista_2_spotify: currentConfig.artista_2_spotify || "",
      artista_2_spotify_show: !!currentConfig.artista_2_spotify_show,
      artista_2_youtube: currentConfig.artista_2_youtube || "",
      artista_2_youtube_show: !!currentConfig.artista_2_youtube_show,
      artista_2_web: currentConfig.artista_2_web || "",
      artista_2_web_show: !!currentConfig.artista_2_web_show,
      artista_separador: currentConfig.artista_separador || " & ",
    });
  }, [currentConfig]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, artistId: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit to 3MB to keep base64 storage fast/efficient)
    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen elegida es muy grande. Elegí una menor a 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (artistId === 1) {
        setFormData((prev) => ({ ...prev, artista_1_foto: base64String }));
      } else {
        setFormData((prev) => ({ ...prev, artista_2_foto: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (artistId: 1 | 2) => {
    if (artistId === 1) {
      setFormData((prev) => ({ ...prev, artista_1_foto: "" }));
    } else {
      setFormData((prev) => ({ ...prev, artista_2_foto: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    // Dynamic compilation of the "artistas" field for backward compatibility
    const updatedForm = { ...formData };
    if (updatedForm.cantidad_artistas === 1) {
      updatedForm.artistas = updatedForm.artista_1_nombre || "";
    } else {
      let separator = updatedForm.artista_separador || " & ";
      const trimmedSep = separator.trim();
      if (trimmedSep) {
        separator = ` ${trimmedSep} `;
      }
      updatedForm.artista_separador = separator;
      updatedForm.artistas = `${updatedForm.artista_1_nombre || ""}${separator}${updatedForm.artista_2_nombre || ""}`;
    }

    try {
      const success = await onSaveConfig(updatedForm);
      if (success) {
        setSaveSuccess(true);
        // Clear success checkmark after 4 seconds
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage("Error de conexión. No se pudieron guardar los cambios.");
      }
    } catch (err) {
      setErrorMessage("No se pudo completar la operación.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper values for clarity
  // Modo Test ON = restriccion_activa is false
  const isTestMode = !formData.restriccion_activa;

  const handleToggleTestMode = () => {
    setFormData((prev) => ({
      ...prev,
      restriccion_activa: !prev.restriccion_activa,
    }));
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-in" id="config-panel">
      
      {/* Container Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-2.5">
          <Sliders className="text-[#3B82F6]" size={18} />
          <h2 className="text-lg font-bold text-white tracking-tight font-sans">
            Configuración del Show
          </h2>
        </div>
        <button
          onClick={onLogOut}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-mono transition-all uppercase cursor-pointer"
        >
          Cerrar Admin
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Detail Fields Grid */}
        <div className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
              Nombre del Evento:
            </label>
            <input
              type="text"
              required
              value={formData.evento_nombre}
              onChange={(e) => setFormData({ ...formData, evento_nombre: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-4 py-2.5 text-white outline-none text-sm transition-all"
              placeholder="e.g., Las canciones más lindas de Charly"
            />
          </div>

          {/* Cantidad de Artistas Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
              Cantidad de Artistas:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, cantidad_artistas: 1 }))}
                className={`py-2 px-4 rounded-xl border text-xs font-mono font-bold uppercase transition-all tracking-wider ${
                  formData.cantidad_artistas === 1
                    ? "bg-[#3B82F6] text-black border-[#3B82F6]"
                    : "bg-[#0A0A0A] text-gray-400 border-white/10 hover:bg-white/5"
                }`}
              >
                1 Artista
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, cantidad_artistas: 2 }))}
                className={`py-2 px-4 rounded-xl border text-xs font-mono font-bold uppercase transition-all tracking-wider ${
                  formData.cantidad_artistas === 2
                    ? "bg-[#3B82F6] text-black border-[#3B82F6]"
                    : "bg-[#0A0A0A] text-gray-400 border-white/10 hover:bg-white/5"
                }`}
              >
                2 Artistas
              </button>
            </div>
          </div>

          {/* ARTIST 1 BLOCK */}
          <div className="p-4 border border-white/5 rounded-xl bg-black/35 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-[#3B82F6] uppercase font-mono tracking-wider">
                Artista 1 {formData.cantidad_artistas === 2 ? "(Principal)" : ""}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Nombre:</label>
                <input
                  type="text"
                  required
                  value={formData.artista_1_nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_nombre: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-2 text-white outline-none text-xs transition-all"
                  placeholder="e.g., Marina Wil"
                />
              </div>

              {/* Base64 & URL Photo Uploader artist 1 */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide block">Foto:</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {formData.artista_1_foto ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900 flex items-center justify-center">
                      <img
                        src={formData.artista_1_foto}
                        alt="Preview Artista 1"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(1)}
                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-500 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-white/20 flex-shrink-0 flex flex-col items-center justify-center text-gray-500 font-mono text-[9px] bg-black">
                      SIN FOTO
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    {/* File Upload Hidden Input */}
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0A0A0A] hover:bg-white/5 text-[10px] font-mono uppercase text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
                        <span>Subir Archivo Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 1)}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[9px] text-gray-500 font-mono">Max 3MB</span>
                    </div>

                    {/* URL Link Input */}
                    <input
                      type="text"
                      value={formData.artista_1_foto}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_foto: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-lg px-2.5 py-1 text-white outline-none text-[10px] placeholder:text-gray-600 transition-all font-mono"
                      placeholder="...o pega una URL de imagen directa"
                    />
                  </div>
                </div>
              </div>

              {/* Bio & Instagram */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Breve Biografía:</label>
                <textarea
                  value={formData.artista_1_bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_bio: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-2 text-white outline-none text-xs transition-all placeholder:text-gray-600 resize-none"
                  placeholder="Información que verá el usuario cuando haga clic en la foto..."
                />
              </div>

              {/* Enlaces y Redes de Artista 1 */}
              <div className="space-y-3.5 border-t border-white/5 pt-4">
                <span className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-wider block font-bold">
                  Redes & Enlaces de Artista 1 (con interruptor On/Off)
                </span>

                <div className="space-y-3">
                  {/* Instagram */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                        <Instagram size={14} className="text-pink-500" />
                        <span>Instagram</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, artista_1_instagram_show: !prev.artista_1_instagram_show }))}
                          className="focus:outline-none cursor-pointer"
                        >
                          {formData.artista_1_instagram_show ? (
                            <ToggleRight size={26} className="text-[#3B82F6]" />
                          ) : (
                            <ToggleLeft size={26} className="text-white/20" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs font-mono">@</span>
                      <input
                        type="text"
                        value={formData.artista_1_instagram || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_instagram: e.target.value.replace("@", "") }))}
                        className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl pl-7 pr-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-600"
                        placeholder="ej: usuario_instagram"
                      />
                    </div>
                  </div>

                  {/* Spotify */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                        <Music size={14} className="text-emerald-500" />
                        <span>Spotify</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, artista_1_spotify_show: !prev.artista_1_spotify_show }))}
                          className="focus:outline-none cursor-pointer"
                        >
                          {formData.artista_1_spotify_show ? (
                            <ToggleRight size={26} className="text-[#3B82F6]" />
                          ) : (
                            <ToggleLeft size={26} className="text-white/20" />
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.artista_1_spotify || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_spotify: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                      placeholder="ej: https://open.spotify.com/artist/..."
                    />
                  </div>

                  {/* YouTube */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                        <Youtube size={14} className="text-red-500" />
                        <span>YouTube</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, artista_1_youtube_show: !prev.artista_1_youtube_show }))}
                          className="focus:outline-none cursor-pointer"
                        >
                          {formData.artista_1_youtube_show ? (
                            <ToggleRight size={26} className="text-[#3B82F6]" />
                          ) : (
                            <ToggleLeft size={26} className="text-white/20" />
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.artista_1_youtube || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_youtube: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                      placeholder="ej: https://youtube.com/@..."
                    />
                  </div>

                  {/* Web */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                        <Globe size={14} className="text-blue-400" />
                        <span>Sitio Web / Enlace</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, artista_1_web_show: !prev.artista_1_web_show }))}
                          className="focus:outline-none cursor-pointer"
                        >
                          {formData.artista_1_web_show ? (
                            <ToggleRight size={26} className="text-[#3B82F6]" />
                          ) : (
                            <ToggleLeft size={26} className="text-white/20" />
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.artista_1_web || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_1_web: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                      placeholder="ej: https://miweboficial.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC ARTIST 2 BLOCK */}
          {formData.cantidad_artistas === 2 && (
            <>
              {/* Separador Custom Selection */}
              <div className="space-y-1.5 px-1 py-0.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                  Separador de Artistas:
                </label>
                <input
                  type="text"
                  required
                  value={formData.artista_separador}
                  onChange={(e) => setFormData((prev) => ({ ...prev, artista_separador: e.target.value }))}
                  className="w-20 bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs text-center font-mono"
                  placeholder=" & "
                />
              </div>

              <div className="p-4 border border-white/5 rounded-xl bg-black/35 space-y-4">
                <span className="text-xs font-bold text-[#3B82F6] uppercase font-mono tracking-wider block border-b border-white/5 pb-2">
                  Artista 2
                </span>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Nombre:</label>
                    <input
                      type="text"
                      required
                      value={formData.artista_2_nombre}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_nombre: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-2 text-white outline-none text-xs transition-all"
                      placeholder="e.g., Ian Shifres"
                    />
                  </div>

                  {/* Base64 & URL Photo Uploader artist 2 */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide block">Foto:</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {formData.artista_2_foto ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-zinc-900 flex items-center justify-center">
                          <img
                            src={formData.artista_2_foto}
                            alt="Preview Artista 2"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(2)}
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-500 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-white/20 flex-shrink-0 flex flex-col items-center justify-center text-gray-500 font-mono text-[9px] bg-black">
                          SIN FOTO
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0A0A0A] hover:bg-white/5 text-[10px] font-mono uppercase text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
                            <span>Subir Archivo Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 2)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[9px] text-gray-500 font-mono">Max 3MB</span>
                        </div>

                        <input
                          type="text"
                          value={formData.artista_2_foto}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_foto: e.target.value }))}
                          className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-lg px-2.5 py-1 text-white outline-none text-[10px] placeholder:text-gray-600 transition-all font-mono"
                          placeholder="...o pega una URL de imagen directa"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio & Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wide">Breve Biografía:</label>
                    <textarea
                      value={formData.artista_2_bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_bio: e.target.value }))}
                      rows={2}
                      className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-2 text-white outline-none text-xs transition-all placeholder:text-gray-600 resize-none"
                      placeholder="Información que verá el usuario cuando haga clic en la foto..."
                    />
                  </div>

                  {/* Enlaces y Redes de Artista 2 */}
                  <div className="space-y-3.5 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-wider block font-bold">
                      Redes & Enlaces de Artista 2 (con interruptor On/Off)
                    </span>

                    <div className="space-y-3">
                      {/* Instagram */}
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                            <Instagram size={14} className="text-pink-500" />
                            <span>Instagram</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, artista_2_instagram_show: !prev.artista_2_instagram_show }))}
                              className="focus:outline-none cursor-pointer"
                            >
                              {formData.artista_2_instagram_show ? (
                                <ToggleRight size={26} className="text-[#3B82F6]" />
                              ) : (
                                <ToggleLeft size={26} className="text-white/20" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs font-mono">@</span>
                          <input
                            type="text"
                            value={formData.artista_2_instagram || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_instagram: e.target.value.replace("@", "") }))}
                            className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl pl-7 pr-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-650"
                            placeholder="ej: usuario_instagram"
                          />
                        </div>
                      </div>

                      {/* Spotify */}
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                            <Music size={14} className="text-emerald-500" />
                            <span>Spotify</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, artista_2_spotify_show: !prev.artista_2_spotify_show }))}
                              className="focus:outline-none cursor-pointer"
                            >
                              {formData.artista_2_spotify_show ? (
                                <ToggleRight size={26} className="text-[#3B82F6]" />
                              ) : (
                                <ToggleLeft size={26} className="text-white/20" />
                              )}
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.artista_2_spotify || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_spotify: e.target.value }))}
                          className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                          placeholder="ej: https://open.spotify.com/artist/..."
                        />
                      </div>

                      {/* YouTube */}
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                            <Youtube size={14} className="text-red-500" />
                            <span>YouTube</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, artista_2_youtube_show: !prev.artista_2_youtube_show }))}
                              className="focus:outline-none cursor-pointer"
                            >
                              {formData.artista_2_youtube_show ? (
                                <ToggleRight size={26} className="text-[#3B82F6]" />
                              ) : (
                                <ToggleLeft size={26} className="text-white/20" />
                              )}
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.artista_2_youtube || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_youtube: e.target.value }))}
                          className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                          placeholder="ej: https://youtube.com/@..."
                        />
                      </div>

                      {/* Web */}
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase">
                            <Globe size={14} className="text-blue-400" />
                            <span>Sitio Web / Enlace</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400">Mostrar:</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, artista_2_web_show: !prev.artista_2_web_show }))}
                              className="focus:outline-none cursor-pointer"
                            >
                              {formData.artista_2_web_show ? (
                                <ToggleRight size={26} className="text-[#3B82F6]" />
                              ) : (
                                <ToggleLeft size={26} className="text-white/20" />
                              )}
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.artista_2_web || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, artista_2_web: e.target.value }))}
                          className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-3 py-1.5 text-white outline-none text-xs transition-all placeholder:text-gray-500"
                          placeholder="ej: https://miweboficial.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Place & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                Lugar del Concierto:
              </label>
              <input
                type="text"
                required
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-4 py-2.5 text-white outline-none text-sm transition-all"
                placeholder="e.g., La casa de Lolita"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                Fecha programada:
              </label>
              <input
                type="text"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#3B82F6] rounded-xl px-4 py-2.5 text-white outline-none text-sm transition-all font-mono"
                placeholder="e.g., 05.06.2026"
              />
            </div>
          </div>

        </div>

        {/* Voter Restriction Control ("Modo Test") */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 space-y-4 animate-scale-up">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-200">
                Modo Test (Votos Masivos)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Cuando está <strong className="text-[#3B82F6]">ON</strong>, ignora el bloqueo de 1 voto por teléfono, permitiendo enviar votos ilimitados para probar el ranking en vivo. Cuando está <strong className="text-red-400">OFF</strong>, restringe la votadora estrictamente a un voto por persona via localStorage.
              </p>
            </div>
            
            <button
              type="button"
              id="test-mode-toggle"
              onClick={handleToggleTestMode}
              className="flex-shrink-0 transition-colors focus:outline-none p-1 cursor-pointer"
              aria-label="Toggle test mode"
            >
              {isTestMode ? (
                <ToggleRight size={38} className="text-[#3B82F6]" />
              ) : (
                <ToggleLeft size={38} className="text-white/20" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500">Restricción actual:</span>
            {isTestMode ? (
              <span className="text-[#3B82F6] font-bold bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/20">
                DESACTIVADA (Modo Test en ON ✔)
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVA (Modo Test en OFF 🔒)
              </span>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-3 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 animate-bounce" />
            <span>Configuración guardada correctamente. Se actualizará en vivo inmediatamente.</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs px-3.5 py-3 rounded-xl flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <button
          id="save-config-btn"
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#3B82F6]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] cursor-pointer"
        >
          {isSaving ? (
            <>
              <RotateCw size={14} className="animate-spin" />
              Guardando cambios...
            </>
          ) : (
            <>
              <Save size={14} />
              GUARDAR CONFIGURACIÓN EN VIVO
            </>
          )}
        </button>

        {/* Developer Credit */}
        <div className="pt-4 mt-6 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Desarrollado por Matías A. Chiarena
          </p>
        </div>

      </form>
    </div>
  );
}
