import { useNavigation } from '@react-navigation/native';
import { ClipboardList, Plus } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { useRequestsController, type StatusFilter } from '@/controllers/useRequestsController';
import { REQUEST_STATUSES, STATUS_LABEL } from '@/models/labels';
import { NewsSection } from '../../components/NewsSection';
import { NotificationBell } from '../../components/NotificationBell';
import { PaymentsSummary } from '../../components/PaymentsSummary';
import { RequestCard } from '../../components/RequestCard';
import { Chip, EmptyState, Input, Loading, Row, Screen, Title } from '../../components/ui';
import * as S from './Requests.styles';

const FILTERS: StatusFilter[] = ['ALL', ...REQUEST_STATUSES];

/** Aba "Serviços": os pedidos do cliente ou, para a equipe, todos os serviços da oficina. */
export function RequestsListScreen() {
  const c = useRequestsController();
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const newLabel = c.staff ? 'Registrar serviço' : 'Pedir serviço';

  return (
    <Screen scroll={false}>
      <S.Header $top={insets.top}>
        <Row $between>
          <Title>{c.staff ? 'Serviços' : 'Meus serviços'}</Title>
          <NotificationBell />
        </Row>
        {c.staff && (
          <Input
            placeholder="Buscar por título, cliente ou placa"
            accessibilityLabel="Buscar serviço"
            value={c.search}
            onChangeText={c.setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.space(2) }}>
          {FILTERS.map((status) => (
            <Chip
              key={status}
              label={status === 'ALL' ? 'Todos' : STATUS_LABEL[status]}
              active={c.status === status}
              onPress={() => c.setStatus(status)}
            />
          ))}
        </ScrollView>
      </S.Header>

      {c.loading ? (
        <Loading />
      ) : (
        <FlatList
          data={c.items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: theme.space(4), paddingTop: theme.space(1), paddingBottom: 96, gap: theme.space(3), flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={c.refreshing} onRefresh={c.refresh} tintColor={theme.colors.primary} />}
          onEndReached={c.loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              showCustomer={c.staff}
              onPress={() => navigation.navigate('RequestDetail', { id: item.id })}
            />
          )}
          ListHeaderComponent={
            <>
              {!c.staff && <PaymentsSummary />}
              <NewsSection />
            </>
          }
          ListFooterComponent={c.loadingMore ? <ActivityIndicator color={theme.colors.primary} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title={c.hasFilters ? 'Nenhum serviço encontrado' : c.staff ? 'Nenhum serviço registrado' : 'Você ainda não pediu nenhum serviço'}
              description={
                c.hasFilters
                  ? 'Mude o filtro ou a busca.'
                  : c.staff
                    ? 'Os pedidos dos clientes aparecem aqui. Você também pode registrar um serviço agora.'
                    : 'Toque em "Pedir serviço" para escolher o que precisa. A oficina recebe na hora.'
              }
            />
          }
        />
      )}

      <View style={{ position: 'absolute', right: theme.space(4), bottom: theme.space(4) }}>
        <Pressable accessibilityRole="button" accessibilityLabel={newLabel} onPress={() => navigation.navigate('NewRequest')}>
          {({ pressed }) => (
            <S.Fab $pressed={pressed} style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}>
              <Plus size={20} color={theme.colors.primaryFg} />
              <S.FabLabel>{newLabel}</S.FabLabel>
            </S.Fab>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}
