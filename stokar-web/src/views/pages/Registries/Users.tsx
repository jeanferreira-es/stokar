import { Pencil, Plus, RotateCcw, UserX, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUsersController, type UserFormInput } from '@/controllers/useRegistriesController';
import { INTERNAL_USER_ROLES, ROLE_LABEL, USER_ROLES, type Tone } from '@/models/labels';
import type { User, UserRole } from '@/models/types';
import { initials } from '@/utils/format';
import {
  Avatar,
  Badge,
  Button,
  CellTitle,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormGrid,
  FormStack,
  HeaderActions,
  Input,
  PageHeader,
  RowActions,
  SearchInput,
  Select,
  Toolbar,
  type Column,
} from '../../components/ui';

const ROLE_TONE: Record<UserRole, Tone> = {
  ADMIN: 'primary',
  MANAGER: 'info',
  OPERATOR: 'success',
  REQUESTER: 'neutral',
  CLIENT: 'warning',
};

const ROLE_HINT: Record<UserRole, string> = {
  ADMIN: 'Acesso total, inclusive usuários',
  MANAGER: 'Cadastros, ajustes e aprovação de solicitações',
  OPERATOR: 'Lança entradas e saídas e atende solicitações',
  REQUESTER: 'Abre e acompanha as próprias solicitações',
  CLIENT: 'Cliente da oficina: usa só o aplicativo',
};

export function UsersPage() {
  const c = useUsersController();

  const columns: Array<Column<User>> = [
    {
      key: 'name',
      header: 'Usuário',
      primary: true,
      cell: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar $size={36}>{initials(u.name)}</Avatar>
          <CellTitle>
            <strong>
              {u.name}
              {u.id === c.me.id && ' (você)'}
            </strong>
            <span>{u.email}</span>
          </CellTitle>
        </div>
      ),
    },
    { key: 'role', header: 'Perfil', cell: (u) => <Badge $tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge> },
    {
      key: 'status',
      header: 'Situação',
      cell: (u) => (u.active ? <Badge $tone="success">Ativo</Badge> : <Badge>Desativado</Badge>),
    },
  ];
  if (c.canManage) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (u) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${u.name}`} onClick={() => c.setEditing(u)}>
            <Pencil />
          </Button>
          {u.id !== c.me.id &&
            (u.active ? (
              <Button variant="ghost" size="icon" aria-label={`Desativar ${u.name}`} onClick={() => c.setRemoving(u)}>
                <UserX />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label={`Reativar ${u.name}`} onClick={() => c.reactivate(u)}>
                <RotateCcw />
              </Button>
            ))}
        </RowActions>
      ),
    });
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1>Usuários</h1>
          <p>Quem acessa o Stokar e o que cada perfil pode fazer.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Novo usuário
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar por nome ou e-mail" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Perfil" value={c.role} onChange={(e) => c.setRole(e.target.value as UserRole | '')}>
          <option value="">Todos os perfis</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(u) => u.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={<EmptyState icon={<Users />} title="Nenhum usuário encontrado" description="Tente outra busca ou perfil." />}
      />

      {c.editing && (
        <UserFormDialog
          user={c.editing === 'new' ? undefined : c.editing}
          isSelf={c.editing !== 'new' && c.editing.id === c.me.id}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Desativar ${c.removing?.name ?? ''}?`}
        description="A pessoa perde o acesso na hora e todas as sessões dela são encerradas. Você pode reativar depois."
        confirmLabel="Desativar usuário"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}

function UserFormDialog(props: {
  user?: User;
  isSelf: boolean;
  saving: boolean;
  onSave: (input: UserFormInput) => void;
  onClose: () => void;
}) {
  const { user } = props;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormInput>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'REQUESTER', password: '' },
  });
  const role = watch('role');

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={user ? 'Editar usuário' : 'Novo usuário'}
      description={user ? 'Trocar o perfil ou a senha encerra as sessões abertas dessa pessoa.' : undefined}
    >
      <FormStack noValidate onSubmit={handleSubmit((v) => props.onSave({ ...v, name: v.name.trim(), email: v.email.trim() }))}>
        <Field label="Nome" error={errors.name?.message}>
          <Input maxLength={120} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        <Field label="E-mail" error={errors.email?.message} hint={user ? 'O e-mail não pode ser alterado' : undefined}>
          <Input
            type="email"
            disabled={!!user}
            maxLength={180}
            {...register('email', {
              validate: (v) => !!user || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'E-mail inválido',
            })}
          />
        </Field>
        <FormGrid>
          <Field label="Perfil" hint={ROLE_HINT[role]}>
            <Select disabled={props.isSelf || user?.role === 'CLIENT'} {...register('role')}>
              {(user?.role === 'CLIENT' ? (['CLIENT'] as UserRole[]) : INTERNAL_USER_ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={user ? 'Nova senha' : 'Senha inicial'}
            hint={user ? 'Deixe em branco para manter a atual' : 'Ao menos 8 caracteres'}
            error={errors.password?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...register('password', {
                validate: (v) => {
                  if (!v) return !!user || 'Defina uma senha inicial';
                  if (v.length < 8) return 'A senha deve ter ao menos 8 caracteres';
                  return v.length <= 72 || 'A senha pode ter até 72 caracteres';
                },
              })}
            />
          </Field>
        </FormGrid>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar usuário
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
