import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Link2, User as UserIcon, CirclePlay as PlayCircle } from 'lucide-react';
import { api } from '@/services';
import type { Session, User, UserSessionMapping, UserSessionMappingInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

export default function AdminMappingsPage() {
  const [rows, setRows] = useState<UserSessionMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserSessionMappingInput>({ userId: '', sessionId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserSessionMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.mappings
      .list({ search: search || undefined, page, pageSize })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load mappings'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    Promise.all([
      api.users.list({ page: 1, pageSize: 200 }),
      api.sessions.list({ page: 1, pageSize: 200 }),
    ]).then(([u, s]) => {
      setUsers(u.items);
      setSessions(s.items);
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ userId: users[0]?.id ?? '', sessionId: sessions[0]?.id ?? '' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.mappings.create(form);
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
    setDeleting(true);
    try {
      await api.mappings.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<UserSessionMapping>[] = [
    { key: 'user', header: 'User', render: (m) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {m.user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{m.user?.name ?? m.userId}</p>
          <p className="text-xs text-gray-400">{m.user?.email}</p>
        </div>
      </div>
    ) },
    { key: 'session', header: 'Session', render: (m) => (
      <div className="flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700 dark:text-gray-200">{m.session?.name ?? m.sessionId}</span>
      </div>
    ) },
    { key: 'date', header: 'Session Date', render: (m) => m.session?.date ? new Date(m.session.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
  ];

  return (
    <div>
      <PageHeader
        title="User-Session Mapping"
        description="Assign students to specific class sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Assign Session
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        rowKey={(m) => m.id}
        actions={(m) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setDeleteTarget(m)} className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Remove mapping" aria-label="Remove mapping">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign Session"
        description="Map a user to a class session."
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              Assign
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}
          <div>
            <label className="label">User</label>
            <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
              <option value="">Select user…</option>
              {users.filter((u) => u.role === 'user').map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Session</label>
            <select className="input" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} required>
              <option value="">Select session…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Once assigned, the student will see this session in their "My Sessions" list.</p>
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove mapping?"
        description={`This will unassign "${deleteTarget?.user?.name}" from "${deleteTarget?.session?.name}".`}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </button>
          </>
        }
      >
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <UserIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>The user will lose access to this session's video immediately.</p>
        </div>
      </Modal>
    </div>
  );
}
