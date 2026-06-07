export interface Song {
  id: string;
  banda: string;
  anio: number;
  disco: string;
  tema: string;
}

export interface EventConfig {
  evento_nombre: string;
  artistas: string;
  lugar: string;
  fecha: string;
  restriccion_activa: boolean; // false = test mode on (unlimited), true = test mode off (voter restricted)
  cantidad_artistas?: number; // 1 or 2
  artista_1_nombre?: string;
  artista_1_foto?: string; // base64 or URL
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
  artista_2_foto?: string; // base64 or URL
  artista_2_bio?: string;
  artista_2_instagram?: string;
  artista_2_instagram_show?: boolean;
  artista_2_spotify?: string;
  artista_2_spotify_show?: boolean;
  artista_2_youtube?: string;
  artista_2_youtube_show?: boolean;
  artista_2_web?: string;
  artista_2_web_show?: boolean;
  artista_separador?: string; // e.g. " & ", " y ", " - ", etc.
}

export interface ArtistDetail {
  nombre: string;
  foto: string;
  bio: string;
  instagram: string;
  instagram_show?: boolean;
  spotify?: string;
  spotify_show?: boolean;
  youtube?: string;
  youtube_show?: boolean;
  web?: string;
  web_show?: boolean;
}

export interface SongRank extends Song {
  votesCount: number;
}

export interface StatsData {
  totalVotes: number;
  unvotedCount: number;
  byBanda: Record<string, number>;
  byDecada: Record<string, number>;
}
