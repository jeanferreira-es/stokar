import { Car, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/contexts/ToastContext';
import type { RootScreenProps } from '@/navigation/types';
import { vehicleLabel } from '@/utils/format';
import { Button, Divider, EmptyState, Group, ListItem, Loading, Screen } from '../../components/ui';

/** "Meus veículos": os veículos e equipamentos do cliente, usados ao pedir um serviço. */
export function VehiclesScreen({ navigation }: RootScreenProps<'Vehicles'>) {
  const { profile, reloadProfile } = useAppData();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await reloadProfile();
    } catch (error) {
      toast.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!profile) return <Loading />;
  const vehicles = profile.vehicles.filter((v) => v.active);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      footer={<Button label="Adicionar veículo" icon={Plus} onPress={() => navigation.navigate('VehicleForm')} />}
    >
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Nenhum veículo cadastrado"
          description="Cadastre seu carro, moto ou equipamento para a oficina saber em qual deles é o serviço."
        />
      ) : (
        <Group>
          {vehicles.map((vehicle, index) => (
            <Fragmented key={vehicle.id} first={index === 0}>
              <ListItem
                icon={Car}
                title={vehicleLabel(vehicle)}
                subtitle={[vehicle.color, vehicle.notes].filter(Boolean).join(' · ') || undefined}
                onPress={() => navigation.navigate('VehicleForm', { vehicle })}
              />
            </Fragmented>
          ))}
        </Group>
      )}
    </Screen>
  );
}

/** Coloca o divisor entre as linhas (não antes da primeira). */
function Fragmented({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <>
      {!first && <Divider />}
      {children}
    </>
  );
}
