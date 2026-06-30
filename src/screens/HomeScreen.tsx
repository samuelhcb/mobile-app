import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [pontos, setPontos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baterPontoLoading, setBaterPontoLoading] = useState(false);

  useEffect(() => {
    carregarPontos();
  }, []);

  const carregarPontos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mobile/pontos-hoje');
      setPontos(Array.isArray(response.data) ? response.data : response.data?.registros || []);
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se funcionário pode bater ponto pelo celular
  const podeBaterPonto = () => {
    if (!user?.permite_mobile) {
      Alert.alert(
        'Acesso Negado',
        'Seu cadastro não permite registro de ponto pelo celular. Entre em contato com o RH.'
      );
      return false;
    }
    return true;
  };

  const getProximoTipo = () => {
    if (pontos.length === 0) return 'ENTRADA';
    const ultimo = pontos[pontos.length - 1].tipo;
    if (ultimo === 'ENTRADA') return 'SAIDA_INTERVALO';
    if (ultimo === 'SAIDA_INTERVALO') return 'RETORNO_INTERVALO';
    if (ultimo === 'RETORNO_INTERVALO') return 'SAIDA';
    return null;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ENTRADA': 'Entrada',
      'SAIDA_INTERVALO': 'Saída Intervalo',
      'RETORNO_INTERVALO': 'Retorno Intervalo',
      'SAIDA': 'Saída',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'ENTRADA': '#10b981',
      'SAIDA_INTERVALO': '#f59e0b',
      'RETORNO_INTERVALO': '#3b82f6',
      'SAIDA': '#ef4444',
    };
    return colors[tipo] || '#4f46e5';
  };

  const iniciarBaterPonto = async () => {
    if (!podeBaterPonto()) return;

    const tipo = getProximoTipo();
    if (!tipo) {
      Alert.alert('Aviso', 'Você já completou sua jornada de hoje!');
      return;
    }

    setBaterPontoLoading(true);

    try {
      const formData = new FormData();
      formData.append('tipo', tipo);

      // Tentar obter localização
      try {
      // @ts-ignore
      const { Location } = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          formData.append('latitude', location.coords.latitude.toString());
          formData.append('longitude', location.coords.longitude.toString());
        }
      } catch (e) {
        console.log('Geolocalização não disponível');
      }

      await api.post('/mobile/ponto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso', `${getTipoLabel(tipo)} registrada com sucesso!`);
      carregarPontos();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao registrar ponto');
    } finally {
      setBaterPontoLoading(false);
    }
  };

  const proximoTipo = getProximoTipo();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={carregarPontos} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {user?.nome?.split(' ')[0]}</Text>
        <Text style={styles.company}>{user?.empresa_nome || 'Empresa'}</Text>
      </View>

      {/* Aviso se não permitido */}
      {!user?.permite_mobile && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Acesso não liberado</Text>
          <Text style={styles.warningText}>
            Seu cadastro não permite registro de ponto pelo celular.{'\n'}
            Entre em contato com o RH da sua empresa.
          </Text>
        </View>
      )}

      {/* Botão de bater ponto */}
      {proximoTipo && (
        <TouchableOpacity
          style={[
            styles.pontoButton,
            { backgroundColor: getTipoColor(proximoTipo) },
            (!user?.permite_mobile || baterPontoLoading) && styles.pontoButtonDisabled,
          ]}
          onPress={iniciarBaterPonto}
          disabled={!user?.permite_mobile || baterPontoLoading}
        >
          <Text style={styles.pontoButtonIcon}>📷</Text>
          <Text style={styles.pontoButtonText}>
            {baterPontoLoading ? 'Processando...' : getTipoLabel(proximoTipo)}
          </Text>
          <Text style={styles.pontoButtonSubtext}>
            Toque para reconhecimento facial
          </Text>
        </TouchableOpacity>
      )}

      {/* Jornada completa */}
      {!proximoTipo && (
        <View style={styles.completedBox}>
          <Text style={styles.completedIcon}>✅</Text>
          <Text style={styles.completedText}>Jornada Completa</Text>
          <Text style={styles.completedSubtext}>Você registrou todos os pontos de hoje</Text>
        </View>
      )}

      {/* Histórico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros de Hoje</Text>
        
        {pontos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Nenhum registro hoje</Text>
            <Text style={styles.emptySubtext}>Toque no botão acima para bater o ponto</Text>
          </View>
        ) : (
          pontos.map((ponto: any, index: number) => (
            <View key={index} style={styles.pontoItem}>
              <View
                style={[
                  styles.pontoIcon,
                  { backgroundColor: getTipoColor(ponto.tipo) + '20' },
                ]}
              >
                <Text style={styles.pontoIconEmoji}>
                  {ponto.tipo === 'ENTRADA' ? '🌅' :
                   ponto.tipo === 'SAIDA_INTERVALO' ? '🍽️' :
                   ponto.tipo === 'RETORNO_INTERVALO' ? '▶️' : '🏠'}
                </Text>
              </View>
              <View style={styles.pontoInfo}>
                <Text style={styles.pontoTipo}>{getTipoLabel(ponto.tipo)}</Text>
                <Text style={styles.pontoHora}>
                  {new Date(ponto.hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {ponto.foto && (
                <View style={styles.faceVerified}>
                  <Text>✓ Face</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Info de permissão */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Informações</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ponto Mobile:</Text>
          <Text style={[
            styles.infoValue,
            user?.permite_mobile ? styles.infoEnabled : styles.infoDisabled
          ]}>
            {user?.permite_mobile ? '✓ Liberado' : '✗ Bloqueado'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reconhecimento Facial:</Text>
          <Text style={[styles.infoValue, styles.infoEnabled]}>✓ Ativo</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair do Aplicativo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 24,
    paddingTop: 60,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  company: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    color: '#a16207',
    fontSize: 14,
    lineHeight: 20,
  },
  pontoButton: {
    margin: 16,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  pontoButtonDisabled: {
    opacity: 0.5,
  },
  pontoButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  pontoButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  pontoButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  completedBox: {
    margin: 16,
    padding: 32,
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  completedText: {
    color: '#065f46',
    fontSize: 20,
    fontWeight: 'bold',
  },
  completedSubtext: {
    color: '#047857',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#f8fafc',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  pontoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pontoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pontoIconEmoji: {
    fontSize: 24,
  },
  pontoInfo: {
    flex: 1,
  },
  pontoTipo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pontoHora: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  faceVerified: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoEnabled: {
    color: '#10b981',
  },
  infoDisabled: {
    color: '#ef4444',
  },
  logoutButton: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
