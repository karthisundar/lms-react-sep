import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Session, SessionCreateInput, SessionStatus, SessionUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

const emptyForm: SessionCreateInput = { name: '', description: '', date: '', status: 'draft' };

export default function AdminSessionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState<SessionCreateInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.sessions
      .list({ search: search || undefined, page, pageSize })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, date: s.date.slice(0, 10), status: s.status });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body: SessionCreateInput = { ...form, date: new Date(form.date).toISOString() };
      if (editing) {
        await api.sessions.update(editing.id, body as SessionUpdateInput);
      } else {
        await api.sessions.create(body);
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
    setDeleting(true);
    try {
      await api.sessions.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Session>[] = [
    { key: 'name', header: 'Name', render: (s) => <span className="font-medium text-gray-900 dark:text-white">{s.name}</span> },
    { key: 'description', header: 'Description', render: (s) => <span className="line-clamp-1 max-w-xs text-gray-500 dark:text-gray-400">{s.description}</span> },
    { key: 'date', header: 'Date', render: (s) => new Date(s.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Session Master"
        description="Create, edit, and manage class sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New Session
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
        rowKey={(s) => s.id}
        actions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => navigate(`/admin/sessions/${s.id}`)} className="btn-ghost h-8 w-8 p-0" title="View" aria-label="View">
              <Eye className="h-4 w-4" />
            </button>
            <button onClick={() => openEdit(s)} className="btn-ghost h-8 w-8 p-0" title="Edit" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(s)} className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Delete" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Session' : 'New Session'}
        description={editing ? `Editing "${editing.name}"` : 'Create a new class session.'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              {editing ? 'Save changes' : 'Create session'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}
          <div>
            <label className="label">Session name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Intro to TypeScript" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this session covers…" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SessionStatus })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete session?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this session?</p>
      </Modal>
    </div>
  );
}
