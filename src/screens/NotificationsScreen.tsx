import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../services/api';

const NotificationsScreen: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [eventosRecentes, setEventosRecentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [resumoResponse, mensagensResponse] = await Promise.all([
        api.get('/mobile/resumo'),
        api.get('/mensagens?limit=10'),
      ]);

      const data = resumoResponse.data || {};
      const mensagensData = mensagensResponse.data || {};
      const listaMensagens = mensagensData.data || mensagensData.mensagens || [];

      setNotificacoes([
        { id: 'pontos', titulo: 'Pontos de hoje', detalhe: `${data.pontosHoje ?? 0}` },
        { id: 'banco', titulo: 'Banco de horas', detalhe: `${data.bancoHoras ?? '0h'}` },
        { id: 'faltas', titulo: 'Faltas', detalhe: `${data.faltas ?? 0}` },
        { id: 'atestados', titulo: 'Atestados', detalhe: `${data.atestados ?? 0}` },
        { id: 'escalas', titulo: 'Escalas', detalhe: `${data.escalas ?? 0}` },
        { id: 'solicitacoes', titulo: 'Solicitações pendentes', detalhe: `${data.solicitacoesPendentes ?? 0}` },
        { id: 'avisos', titulo: 'Avisos da empresa', detalhe: `${data.avisos ?? 0}` },
        { id: 'mensagens', titulo: 'Mensagens não lidas', detalhe: `${data.mensagensNaoLidas ?? 0}` },
      ]);

      setMensagens(listaMensagens);
      setEventosRecentes([
        {
          id: 'resumo-ponto',
          titulo: 'Registro de ponto confirmado',
          tipo: 'ponto',
          mensagem: 'Seu registro de ponto foi realizado com sucesso.',
          criado_em: new Date().toISOString(),
        },
        ...listaMensagens.slice(0, 4).map((mensagem) => ({
          id: `msg-${mensagem.id}`,
          titulo: mensagem.titulo || 'Mensagem',
          tipo: 'mensagem',
          mensagem: mensagem.conteudo || '',
          status: mensagem.status || 'ENVIADA',
          criado_em: mensagem.criado_em,
        })),
      ]);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotificacoes([]);
      setMensagens([]);
      setEventosRecentes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const pontosRecentes = eventosRecentes.filter((item) => item.tipo === 'ponto');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Central de Notificações</Text>
        <Text style={styles.subtitle}>Resumo rápido do que importa agora</Text>
      </View>

      <View style={styles.grid}>
        {notificacoes.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardValue}>{item.detalhe}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionIcon}>🕒</Text>
            <Text style={styles.sectionTitle}>Pontos recentes</Text>
          </View>
          <Text style={styles.sectionCounter}>{pontosRecentes.length}</Text>
        </View>
        {pontosRecentes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum ponto recente encontrado.</Text>
          </View>
        ) : (
          pontosRecentes.map((item) => (
            <View key={item.id} style={[styles.messageCard, styles.pointCard]}>
              <View style={styles.messageTopRow}>
                <Text style={styles.messageTitle}>{item.titulo}</Text>
                <Text style={[styles.messageBadge, styles.pointBadge]}>PONTO</Text>
              </View>
              <Text style={styles.messageBody} numberOfLines={3}>
                {item.mensagem || ''}
              </Text>
              <Text style={styles.messageMeta}>
                {item.criado_em ? new Date(item.criado_em).toLocaleString('pt-BR') : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionIcon}>✉️</Text>
            <Text style={styles.sectionTitle}>Mensagens recentes</Text>
          </View>
          <Text style={styles.sectionCounter}>{mensagens.length}</Text>
        </View>
        {mensagens.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma mensagem recente encontrada.</Text>
          </View>
        ) : (
          mensagens.map((mensagem) => (
            <View key={mensagem.id} style={styles.messageCard}>
              <View style={styles.messageTopRow}>
                <Text style={styles.messageTitle}>{mensagem.titulo || 'Mensagem'}</Text>
                <Text style={styles.messageBadge}>{mensagem.status || 'ENVIADA'}</Text>
              </View>
              <Text style={styles.messageBody} numberOfLines={3}>
                {mensagem.conteudo || ''}
              </Text>
              <Text style={styles.messageMeta}>
                {mensagem.criado_em ? new Date(mensagem.criado_em).toLocaleString('pt-BR') : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={carregar}>
        <Text style={styles.actionButtonText}>Atualizar agora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 28 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748b' },
  grid: { paddingHorizontal: 20 },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  cardValue: { marginTop: 8, fontSize: 22, fontWeight: '800', color: '#0f172a' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { color: '#64748b', fontSize: 13 },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pointCard: {
    borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc',
  },
  messageTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  messageTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#0f172a' },
  messageBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pointBadge: {
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  messageBody: { fontSize: 13, color: '#475569', lineHeight: 19 },
  messageMeta: { marginTop: 8, fontSize: 11, color: '#94a3b8' },
  actionButton: {
    margin: 20,
    marginTop: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default NotificationsScreen;