import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import api from '../services/api';

const PointsScreen: React.FC = () => {
  const [pontos, setPontos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mobile/pontos-hoje');
      setPontos(Array.isArray(response.data) ? response.data : (response.data?.registros || []));
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
      setPontos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const entrada = pontos.find((p) => p.tipo === 'ENTRADA');
    const saidaIntervalo = pontos.find((p) => p.tipo === 'SAIDA_INTERVALO');
    const retornoIntervalo = pontos.find((p) => p.tipo === 'RETORNO_INTERVALO');
    const saida = pontos.find((p) => p.tipo === 'SAIDA');

    return {
      entrada: entrada?.hora_registro || entrada?.hora || null,
      saidaIntervalo: saidaIntervalo?.hora_registro || saidaIntervalo?.hora || null,
      retornoIntervalo: retornoIntervalo?.hora_registro || retornoIntervalo?.hora || null,
      saida: saida?.hora_registro || saida?.hora || null,
    };
  }, [pontos]);

  const formatTime = (value: any) => {
    if (!value) return '--:--';
    try {
      return new Date(value).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTRADA: 'Entrada',
      SAIDA_INTERVALO: 'Saída intervalo',
      RETORNO_INTERVALO: 'Retorno intervalo',
      SAIDA: 'Saída',
    };
    return labels[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      ENTRADA: '🌅',
      SAIDA_INTERVALO: '🍽️',
      RETORNO_INTERVALO: '▶️',
      SAIDA: '🏠',
    };
    return icons[tipo] || '🕒';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Resumo do dia</Text>
        <Text style={styles.title}>Pontos de Hoje</Text>
        <Text style={styles.subtitle}>Confira suas marcações de entrada, intervalo e saída.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🌅</Text>
          <Text style={styles.summaryLabel}>Entrada</Text>
          <Text style={styles.summaryValue}>{formatTime(resumo.entrada)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🍽️</Text>
          <Text style={styles.summaryLabel}>Saída intervalo</Text>
          <Text style={styles.summaryValue}>{formatTime(resumo.saidaIntervalo)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>▶️</Text>
          <Text style={styles.summaryLabel}>Retorno</Text>
          <Text style={styles.summaryValue}>{formatTime(resumo.retornoIntervalo)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🏠</Text>
          <Text style={styles.summaryLabel}>Saída</Text>
          <Text style={styles.summaryValue}>{formatTime(resumo.saida)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Linha do tempo</Text>
          <Text style={styles.sectionCounter}>{pontos.length}</Text>
        </View>
        {pontos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum ponto registrado hoje.</Text>
          </View>
        ) : (
          pontos.map((ponto, index) => (
            <View key={ponto.id || index} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.tipoWrap}>
                  <Text style={styles.tipoIcon}>{getTipoIcon(ponto.tipo)}</Text>
                  <Text style={styles.tipo}>{getTipoLabel(ponto.tipo)}</Text>
                </View>
                <Text style={styles.hora}>{formatTime(ponto.hora_registro || ponto.hora)}</Text>
              </View>
              <Text style={styles.meta}>
                {ponto.data ? new Date(ponto.data).toLocaleDateString('pt-BR') : ''}
              </Text>
              <Text style={styles.meta}>
                {ponto.observacao || 'Registro realizado com sucesso.'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: {
    margin: 20,
    marginBottom: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#0f172a',
  },
  heroLabel: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { marginTop: 6, fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#e0e7ff', lineHeight: 20 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryIcon: { fontSize: 20, marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  summaryValue: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#0f172a' },
  section: { paddingHorizontal: 20, marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  sectionCounter: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { color: '#64748b', fontSize: 13 },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipoWrap: { flexDirection: 'row', alignItems: 'center' },
  tipoIcon: { fontSize: 18, marginRight: 10 },
  tipo: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  hora: { fontSize: 14, fontWeight: '800', color: '#4f46e5' },
  meta: { marginTop: 6, fontSize: 12, color: '#64748b' },
});

export default PointsScreen;