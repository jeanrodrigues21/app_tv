import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isAuthenticated, loading: authLoading } = useIPTVAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Se já está autenticado, redirecionar automaticamente
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Preencha usuário e senha');
      return;
    }

    setLoading(true);
    setError('');

    const { success, error: loginError } = await signIn(username, password);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setError(loginError || 'Erro ao fazer login');
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica credenciais salvas
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>DoramaFlix</Text>
          <ActivityIndicator size="large" color="#e50914" style={{ marginTop: 32 }} />
          <Text style={styles.loadingText}>Verificando credenciais...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>DoramaFlix</Text>
        <Text style={styles.subtitle}>Entre com suas credenciais IPTV</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Usuário"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <Text style={styles.helpText}>
          Use suas credenciais do serviço IPTV para acessar
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#e50914',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  error: {
    color: '#e50914',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});