import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Settings, User as UserIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';

const PREFERENCES_KEY = '@doramaflix:preferences';

interface UserPreferences {
  auto_skip_intro: boolean;
  auto_skip_outro: boolean;
  auto_play_next: boolean;
  video_quality: 'auto' | 'high' | 'medium' | 'low';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  auto_skip_intro: true,
  auto_skip_outro: false,
  auto_play_next: true,
  video_quality: 'auto',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { credentials, signOut } = useIPTVAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [focusedButton, setFocusedButton] = useState<string | null>(null);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <UserIcon size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{credentials?.username || 'Usuário'}</Text>
        <Text style={styles.email}>Usuário IPTV</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={28} color="#e50914" />
          <Text style={styles.sectionTitle}>Reprodução Automática</Text>
        </View>

        <QualityOption
          label="Pular abertura"
          selected={preferences.auto_skip_intro}
          onPress={() => updatePreference('auto_skip_intro', !preferences.auto_skip_intro)}
          isFocused={focusedButton === 'intro'}
          onFocus={() => setFocusedButton('intro')}
          onBlur={() => setFocusedButton(null)}
        />

        <QualityOption
          label="Pular encerramento"
          selected={preferences.auto_skip_outro}
          onPress={() => updatePreference('auto_skip_outro', !preferences.auto_skip_outro)}
          isFocused={focusedButton === 'outro'}
          onFocus={() => setFocusedButton('outro')}
          onBlur={() => setFocusedButton(null)}
        />

        <QualityOption
          label="Próximo episódio automático"
          selected={preferences.auto_play_next}
          onPress={() => updatePreference('auto_play_next', !preferences.auto_play_next)}
          isFocused={focusedButton === 'next'}
          onFocus={() => setFocusedButton('next')}
          onBlur={() => setFocusedButton(null)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qualidade de Vídeo</Text>

        {(['auto', 'high', 'medium', 'low'] as const).map((quality) => (
          <Pressable
            key={quality}
            style={[
              styles.qualityButton,
              preferences.video_quality === quality && styles.qualityButtonActive,
              focusedButton === quality && styles.buttonFocused,
            ]}
            onPress={() => updatePreference('video_quality', quality)}
            onFocus={() => setFocusedButton(quality)}
            onBlur={() => setFocusedButton(null)}
          >
            <Text style={[
              styles.qualityText,
              preferences.video_quality === quality && styles.qualityTextActive,
            ]}>
              {preferences.video_quality === quality && '✓ '}
              {quality === 'auto' && 'Automático'}
              {quality === 'high' && 'Alta Qualidade'}
              {quality === 'medium' && 'Qualidade Média'}
              {quality === 'low' && 'Baixa Qualidade'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.signOutButton,
          loading && styles.signOutButtonDisabled,
          focusedButton === 'logout' && styles.buttonFocused,
        ]}
        onPress={handleSignOut}
        disabled={loading}
        onFocus={() => setFocusedButton('logout')}
        onBlur={() => setFocusedButton(null)}
      >
        <LogOut size={28} color="#fff" />
        <Text style={styles.signOutText}>Sair</Text>
      </Pressable>

      <Text style={styles.version}>DoramaFlix v1.0.0</Text>
    </ScrollView>
  );
}

function QualityOption({
  label,
  selected,
  onPress,
  isFocused,
  onFocus,
  onBlur,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.toggleOption,
        isFocused && styles.buttonFocused,
      ]}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[
        styles.toggle,
        selected && styles.toggleActive,
      ]}>
        <View style={[
          styles.toggleThumb,
          selected && styles.toggleThumbActive,
        ]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  email: {
    color: '#999',
    fontSize: 20,
  },
  section: {
    padding: 48,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  toggle: {
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleActive: {
    backgroundColor: '#e50914',
  },
  toggleThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  qualityButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#e50914',
  },
  qualityText: {
    color: '#999',
    fontSize: 22,
    fontWeight: '600',
  },
  qualityTextActive: {
    color: '#e50914',
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    margin: 48,
    padding: 24,
    backgroundColor: '#e50914',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  version: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonFocused: {
    borderColor: '#e50914',
    backgroundColor: '#0a0a0a',
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 12,
  },
});
