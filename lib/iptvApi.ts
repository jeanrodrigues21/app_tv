const API_URL = 'https://api.pxbetapp.win';

export interface IPTVSeries {
  series_id: string;
  name: string;
  cover?: string;
  genre?: string;
  releaseDate?: string;
  plot?: string;
  cast?: string;
  director?: string;
  rating?: string;
  backdrop_path?: string[];
  num_seasons?: number;
  original_series_id?: string; // Adicionar para guardar ID original
}

export interface IPTVSeason {
  season_number: number;
  name: string;
  episode_count: number;
  overview?: string;
  air_date?: string;
  cover?: string;
}

export interface IPTVEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: {
    duration?: string;
    plot?: string;
    rating?: string;
  };
  season?: number;
}

export interface IPTVSeriesInfo {
  info: IPTVSeries;
  seasons: IPTVSeason[];
  episodes: { [seasonNumber: string]: IPTVEpisode[] };
}

export interface IPTVCredentials {
  username: string;
  password: string;
}

class IPTVApi {
  private credentials: IPTVCredentials | null = null;

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
  }

  clearCredentials() {
    this.credentials = null;
  }

  getCredentials(): IPTVCredentials | null {
    return this.credentials;
  }

  // Gerar ID estável baseado no nome da série
  generateStableSeriesId(seriesName: string): string {
    try {
      // Remover espaços e caracteres especiais, converter para lowercase
      return seriesName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    } catch (error) {
      console.warn('Erro ao gerar ID estável:', error);
      return seriesName.replace(/\s+/g, '_').toLowerCase();
    }
  }

  private async apiRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.credentials) {
      throw new Error('Credenciais não configuradas');
    }

    const url = new URL(`${API_URL}/player_api.php`);
    url.searchParams.set('username', this.credentials.username);
    url.searchParams.set('password', this.credentials.password);
    url.searchParams.set('action', action);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro na API IPTV:', error);
      throw error;
    }
  }

  async authenticate(username: string, password: string): Promise<boolean> {
    this.setCredentials(username, password);
    
    try {
      await this.apiRequest('get_series');
      return true;
    } catch (error) {
      this.clearCredentials();
      return false;
    }
  }

  async getSeries(): Promise<IPTVSeries[]> {
    const data = await this.apiRequest('get_series');
    const series = Array.isArray(data) ? data : Object.values(data);
    
    // Adicionar IDs estáveis mantendo ID original
    const processedSeries = series.map(s => ({
      ...s,
      original_series_id: s.series_id, // Guardar ID original
      series_id: this.generateStableSeriesId(s.name || s.series_id), // Usar ID estável
    }));
    
    return processedSeries;
  }

  async getSeriesInfo(stableSeriesId: string): Promise<IPTVSeriesInfo> {
    // stableSeriesId é o ID estável (ex: "proteja_sua_sorte")
    // Mas precisamos do ID original para chamar a API
    
    // Buscar todas as séries para encontrar o ID original
    const allSeries = await this.getSeries();
    const series = allSeries.find(s => s.series_id === stableSeriesId);
    
    if (!series) {
      throw new Error(`Série com ID ${stableSeriesId} não encontrada`);
    }

    // Usar o ID original para chamar a API
    const originalId = series.original_series_id || series.series_id;
    
    const data = await this.apiRequest('get_series_info', { series_id: originalId });
    return data;
  }

  getStreamUrl(episodeId: string): string {
    if (!this.credentials) {
      throw new Error('Credenciais não configuradas');
    }

    return `${API_URL}/hls/${this.credentials.username}/${this.credentials.password}/${episodeId}/index.m3u8`;
  }

  async getCategories(): Promise<any[]> {
    try {
      const data = await this.apiRequest('get_series_categories');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('API não suporta categorias:', error);
      return [];
    }
  }
}

export const iptvApi = new IPTVApi();