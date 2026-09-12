import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, User as UserIcon, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { userService } from '@/services';
import type { Role, User, UserCreateInput, UserFormMode, UserUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  user_ref_id: string;
  is_active: boolean;
  role: Role;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  password: '',
  phoneNumber: '',
  user_ref_id: '',
  is_active: true,
  role: 'user',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<UserFormMode>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    userService
      .getAllUsers({ page, pageSize, search: search || undefined })
      .then((res) => {
        setRows(res.row || res.items || []);
        setTotal(res.totalItem ?? res.total ?? 0);
        setTotalPages(res.totalPage ?? Math.max(1, Math.ceil((res.totalItem ?? res.total ?? 0) / pageSize)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      ...emptyForm,
      user_ref_id: '',
    });
    setShowPassword(false);
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setMode('edit');
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '', // Blank by default, acts as optional change password field
      phoneNumber: u.phoneNumber || u.phone_number || '',
      user_ref_id: u.user_ref_id || '',
      is_active: u.is_active,
      role: u.role || 'user',
    });
    setShowPassword(false);
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const validateForm = (): string | null => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      return 'Name is required and cannot be empty.';
    }
    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      return 'Email is required.';
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    const isCreateMode = mode === 'create' || form.user_ref_id === '';
    if (isCreateMode) {
      if (!form.password) {
        return 'Password is required when creating a new user.';
      }
      if (form.password.length < 4) {
        return 'Password must be at least 4 characters long.';
      }
    } else if (form.password && form.password.length < 4) {
      return 'New password must be at least 4 characters long.';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErr = validateForm();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    setSaving(true);
    try {
      const isEditMode = mode === 'edit' && Boolean(form.user_ref_id || editing?.user_ref_id);
      if (isEditMode) {
        // Edit mode: MUST send selected user's user_ref_id (never user_id)
        // If password is empty, do NOT send/change password
        const targetRefId = form.user_ref_id || editing?.user_ref_id || '';
        const body: UserUpdateInput = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim(),
          user_ref_id: targetRefId,
          is_active: form.is_active,
          role: form.role,
          ...(form.password.trim() ? { password: btoa(form.password.trim()) } : {}),
        };
        await userService.createUser(body);
        setSuccessMessage(`User "${form.name.trim()}" updated successfully.`);
      } else {
        // Create mode: MUST send user_ref_id: "" (key must exist in payload)
        // Password is encoded with btoa()
        const encodedPassword = btoa(form.password.trim());
        const body: UserCreateInput = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: encodedPassword,
          phoneNumber: form.phoneNumber.trim(),
          user_ref_id: '',
          is_active: form.is_active,
          role: form.role,
        };
        await userService.createUser(body);
        setSuccessMessage(`User "${form.name.trim()}" created successfully.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetRefId = deleteTarget.user_ref_id || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete user: missing user_ref_id');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Delete API requires user_ref_id in payload: { user_ref_id }
      await userService.deleteUser({ user_ref_id: targetRefId });
      setSuccessMessage(`User "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);

      // If deleting the last item on current page (and page > 1), move to previous valid page
      if (rows.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {u.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {u.email}
              {(u.phoneNumber || u.phone_number) && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">· {u.phoneNumber || u.phone_number}</span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span
          className={`badge capitalize ${
            u.role === 'admin'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          }`}
        >
          {u.role === 'admin' ? (
            <ShieldCheck className="h-3 w-3 inline mr-1" />
          ) : (
            <UserIcon className="h-3 w-3 inline mr-1" />
          )}
          {u.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <span
          className={`badge ${
            u.is_active
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
              u.is_active ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (u) =>
        u.createdAt
          ? new Date(u.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage application users, roles, account statuses, and credentials."
        action={
          <button onClick={openCreate} className="btn-primary" id="add-user-btn">
            <Plus className="h-4 w-4" /> Add User
          </button>
        }
      />

      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 underline hover:text-emerald-800 dark:text-emerald-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        totalPages={totalPages}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        searchValue={search}
        rowKey={(u) => u.user_ref_id || u.id || String(u.user_id)}
        emptyMessage="No users found."
        actions={(u) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(u)}
              className="btn-ghost h-8 w-8 p-0"
              title="Edit user"
              aria-label="Edit user"
              id={`edit-user-${u.user_ref_id || u.id}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(u)}
              className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete user"
              aria-label="Delete user"
              id={`delete-user-${u.user_ref_id || u.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'edit' ? 'Edit User' : 'Add User'}
        description={
          mode === 'edit' && editing
            ? `Update user account details for "${editing.name}".`
            : 'Create a new user account on the platform.'
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              id="save-user-btn"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Create user'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label" htmlFor="user-name">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="user-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ada Lovelace"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="user-email">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="user-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="ada@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="user-phone">
              Phone Number
            </label>
            <input
              id="user-phone"
              type="tel"
              className="input"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="label" htmlFor="user-password">
              {mode === 'edit' ? 'New Password (optional)' : 'Password'}{' '}
              <span className="text-red-500">{mode === 'edit' ? '' : '*'}</span>
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={mode !== 'edit'}
                placeholder={mode === 'edit' ? 'Leave blank to keep existing password' : '••••••••'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {mode === 'edit'
                ? 'Only enter a password if you wish to change it. Passwords are automatically encoded.'
                : 'Password will be encoded with btoa() before transmission.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="user-role">Role</label>
              <select
                id="user-role"
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="user">Student / User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="user-status">Account Status</label>
              <select
                id="user-status"
                className="input"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete User?"
        description={`This will permanently delete "${deleteTarget?.name}" (${deleteTarget?.email}). This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger"
              id="confirm-delete-user-btn"
            >
              {deleting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this user?
            </p>
            <p className="mt-1 text-xs">
              All associated session mappings and account access for this user will be removed.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
