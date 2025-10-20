import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native';
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
          <UserIcon size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{credentials?.username || 'Usuário'}</Text>
        <Text style={styles.email}>Usuário IPTV</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={20} color="#fff" />
          <Text style={styles.sectionTitle}>Preferências de Reprodução</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Pular introdução automaticamente</Text>
            <Text style={styles.settingDescription}>
              Pula a abertura dos episódios automaticamente
            </Text>
          </View>
          <Switch
            value={preferences.auto_skip_intro}
            onValueChange={value => updatePreference('auto_skip_intro', value)}
            trackColor={{ false: '#333', true: '#e50914' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Pular encerramento automaticamente</Text>
            <Text style={styles.settingDescription}>
              Pula os créditos finais automaticamente
            </Text>
          </View>
          <Switch
            value={preferences.auto_skip_outro}
            onValueChange={value => updatePreference('auto_skip_outro', value)}
            trackColor={{ false: '#333', true: '#e50914' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Reproduzir próximo episódio</Text>
            <Text style={styles.settingDescription}>
              Inicia automaticamente o próximo episódio
            </Text>
          </View>
          <Switch
            value={preferences.auto_play_next}
            onValueChange={value => updatePreference('auto_play_next', value)}
            trackColor={{ false: '#333', true: '#e50914' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qualidade de Vídeo</Text>
        
        {(['auto', 'high', 'medium', 'low'] as const).map((quality) => (
          <Pressable
            key={quality}
            style={styles.settingItem}
            onPress={() => updatePreference('video_quality', quality)}
          >
            <Text style={styles.settingTitle}>
              {preferences.video_quality === quality ? '✓ ' : ''}
              {quality === 'auto' && 'Automático'}
              {quality === 'high' && 'Alta Qualidade'}
              {quality === 'medium' && 'Qualidade Média'}
              {quality === 'low' && 'Baixa Qualidade'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable 
        style={[styles.signOutButton, loading && styles.signOutButtonDisabled]} 
        onPress={handleSignOut}
        disabled={loading}
      >
        <LogOut size={20} color="#fff" />
        <Text style={styles.signOutText}>Sair</Text>
      </Pressable>

      <Text style={styles.version}>DoramaFlix v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    color: '#999',
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
});