import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iptvApi, IPTVCredentials } from '@/lib/iptvApi';

interface IPTVAuthContextType {
  isAuthenticated: boolean;
  credentials: IPTVCredentials | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const IPTVAuthContext = createContext<IPTVAuthContextType | undefined>(undefined);

const CREDENTIALS_KEY = '@doramaflix:iptv_credentials';

export function IPTVAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<IPTVCredentials | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar credenciais salvas ao iniciar o app
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem(CREDENTIALS_KEY);
      
      if (saved) {
        const creds: IPTVCredentials = JSON.parse(saved);
        
        // Tentar autenticar com credenciais salvas
        const isValid = await iptvApi.authenticate(creds.username, creds.password);
        
        if (isValid) {
          setCredentials(creds);
          setIsAuthenticated(true);
        } else {
          // Credenciais inválidas ou expiradas - limpar
          await AsyncStorage.removeItem(CREDENTIALS_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais salvas:', error);
      // Em caso de erro, limpar credenciais
      await AsyncStorage.removeItem(CREDENTIALS_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const isValid = await iptvApi.authenticate(username, password);
      
      if (!isValid) {
        return { 
          success: false, 
          error: 'Usuário ou senha incorretos' 
        };
      }

      const creds: IPTVCredentials = { username, password };
      
      // Salvar credenciais localmente
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      
      setCredentials(creds);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      return { 
        success: false, 
        error: 'Erro ao conectar com o servidor. Verifique sua conexão.' 
      };
    }
  };

  const signOut = async () => {
    try {
      // Limpar credenciais salvas
      await AsyncStorage.removeItem(CREDENTIALS_KEY);
      iptvApi.clearCredentials();
      setCredentials(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <IPTVAuthContext.Provider 
      value={{ 
        isAuthenticated, 
        credentials, 
        loading, 
        signIn, 
        signOut 
      }}
    >
      {children}
    </IPTVAuthContext.Provider>
  );
}

export function useIPTVAuth() {
  const context = useContext(IPTVAuthContext);
  if (context === undefined) {
    throw new Error('useIPTVAuth deve ser usado dentro de IPTVAuthProvider');
  }
  return context;
}