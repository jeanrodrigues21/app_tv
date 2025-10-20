export interface Dorama {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  banner_url: string | null;
  year: number | null;
  country: string | null;
  rating: number | null;
  total_episodes: number;
  status: 'ongoing' | 'completed';
  genres: string[];
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  dorama_id: string;
  episode_number: number;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration_seconds: number;
  intro_start: number;
  intro_end: number;
  outro_start: number;
  created_at: string;
}

export interface WatchProgress {
  id: string;
  user_id: string;
  episode_id: string;
  dorama_id: string;
  progress_seconds: number;
  completed: boolean;
  last_watched: string;
}

export interface MyList {
  id: string;
  user_id: string;
  dorama_id: string;
  added_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  auto_skip_intro: boolean;
  auto_skip_outro: boolean;
  auto_play_next: boolean;
  video_quality: string;
  subtitle_language: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoramaWithProgress extends Dorama {
  watch_progress?: WatchProgress;
  in_my_list?: boolean;
  next_episode?: Episode;
}
