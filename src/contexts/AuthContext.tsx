import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  empresa_id: number;
  permite_mobile: boolean;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      const sincronizado = await AsyncStorage.getItem('push_token_sincronizado');
      const pushToken = await AsyncStorage.getItem('push_token');
      const usuarioLogado = JSON.parse(storedUser);
      if (sincronizado === 'false' && pushToken) {
        api.post('/mobile/push-token', { funcionario_id: usuarioLogado.id, push_token: pushToken })
          .then(() => AsyncStorage.setItem('push_token_sincronizado', 'true'))
          .catch(err => console.log('Retentativa silenciosa falhou, tentará na próxima', err));
      } else {
        await registrarPushToken(usuarioLogado);
      }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login-mobile', { email, senha });
      const { token, funcionario } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(funcionario));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(funcionario);
      await registrarPushToken(funcionario);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer login');
    }
  };

  const registrarPushToken = async (funcionario: User) => {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      let status = permissions.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      if (!token?.data) return;
    await AsyncStorage.setItem('push_token', token.data);
    await AsyncStorage.setItem('push_token_sincronizado', 'true');

      console.log('Expo push token:', token.data);
      await api.post('/mobile/push-token', {
        funcionario_id: funcionario.id,
        push_token: token.data,
      });
      await AsyncStorage.setItem('push_token', token.data);
    } catch (error) {
    console.warn('Falha ao registrar token na API. Será retentado.', error);
    await AsyncStorage.setItem('push_token_sincronizado', 'false');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
