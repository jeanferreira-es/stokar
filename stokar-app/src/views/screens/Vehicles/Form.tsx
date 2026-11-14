import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/contexts/ToastContext';
import { vehiclesService } from '@/models/services/api';
import type { RootScreenProps } from '@/navigation/types';
import { emptyToNull } from '@/utils/format';
import { Button, Card, Screen, Sheet, SheetBody, TextField } from '../../components/ui';

export function VehicleFormScreen({ navigation, route }: RootScreenProps<'VehicleForm'>) {
  const vehicle = route.params?.vehicle;
  const { reloadProfile } = useAppData();
  const toast = useToast();
  const [plate, setPlate] = useState(vehicle?.plate ?? '');
  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '');
  const [color, setColor] = useState(vehicle?.color ?? '');
  const [notes, setNotes] = useState(vehicle?.notes ?? '');
  const [errors, setErrors] = useState<{ model?: string; year?: string }>({});
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: vehicle ? 'Editar veículo' : 'Novo veículo' });
  }, [navigation, vehicle]);

  const done = async (message: string) => {
    await reloadProfile();
    toast.success(message);
    navigation.goBack();
  };

  const save = async () => {
    const yearNumber = year.trim() ? Number(year) : null;
    const next = {
      model: model.trim() ? undefined : 'Informe o modelo',
      year:
        yearNumber === null || (Number.isInteger(yearNumber) && yearNumber >= 1900 && yearNumber <= 2100) ? undefined : 'Ano inválido',
    };
    setErrors(next);
    if (next.model || next.year) return;

    setBusy('save');
    try {
      const input = {
        plate: emptyToNull(plate),
        brand: emptyToNull(brand),
        model: model.trim(),
        year: yearNumber,
        color: emptyToNull(color),
        notes: emptyToNull(notes),
      };
      if (vehicle) await vehiclesService.update(vehicle.id, input);
      else await vehiclesService.create(input);
      await done('Veículo salvo');
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!vehicle) return;
    setBusy('remove');
    try {
      await vehiclesService.remove(vehicle.id);
      setRemoving(false);
      await done('Veículo removido');
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen footer={<Button label="Salvar veículo" loading={busy === 'save'} onPress={() => void save()} />}>
      <Card>
        <TextField label="Modelo" placeholder="Ex.: CG 160" value={model} onChangeText={setModel} error={errors.model} />
        <TextField label="Marca" placeholder="Ex.: Honda" value={brand} onChangeText={setBrand} />
        <TextField
          label="Placa ou nº de série"
          hint="Opcional para equipamentos"
          value={plate}
          onChangeText={setPlate}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
        />
        <TextField label="Ano" value={year} onChangeText={setYear} error={errors.year} keyboardType="number-pad" maxLength={4} />
        <TextField label="Cor" value={color} onChangeText={setColor} />
        <TextField label="Observações" value={notes} onChangeText={setNotes} multiline maxLength={2000} />
      </Card>

      {vehicle && <Button label="Remover veículo" variant="danger" icon={Trash2} onPress={() => setRemoving(true)} />}

      <Sheet
        visible={removing}
        onClose={() => setRemoving(false)}
        title="Remover este veículo?"
        description="Ele deixa de aparecer nos novos pedidos. O histórico de serviços é mantido."
      >
        <SheetBody>
          <Button label="Remover" variant="danger" loading={busy === 'remove'} onPress={() => void remove()} />
          <Button label="Manter" variant="ghost" onPress={() => setRemoving(false)} />
        </SheetBody>
      </Sheet>
    </Screen>
  );
}
