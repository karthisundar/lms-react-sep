import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Film, Link2 } from 'lucide-react';
import { api } from '@/services';
import type { Bucket, Session, Video, VideoCreateInput, VideoUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

const emptyForm: VideoCreateInput = { title: '', filename: '', url: '', sessionId: '', bucketId: '' };

export default function AdminVideosPage() {
  const [rows, setRows] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoCreateInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.videos
      .list({ search: search || undefined, page, pageSize })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load videos'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Load sessions + buckets for dropdowns
  useEffect(() => {
    Promise.all([
      api.sessions.list({ page: 1, pageSize: 200 }),
      api.buckets.list({ page: 1, pageSize: 200 }),
    ]).then(([s, b]) => {
      setSessions(s.items);
      setBuckets(b.items);
    }).catch(() => {});
  }, []);

  const sessionName = (id: string) => sessions.find((s) => s.id === id)?.name ?? id;
  const bucketName = (id?: string) => (id ? buckets.find((b) => b.id === id)?.name ?? id : '—');

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sessionId: sessions[0]?.id ?? '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (v: Video) => {
    setEditing(v);
    setForm({ title: v.title, filename: v.filename ?? '', url: v.url, sessionId: v.sessionId, bucketId: v.bucketId ?? '' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body: VideoCreateInput = {
        ...form,
        bucketId: form.bucketId || undefined,
        filename: form.filename || undefined,
      };
      if (editing) {
        await api.videos.update(editing.id, body as VideoUpdateInput);
      } else {
        await api.videos.create(body);
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
      await api.videos.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Video>[] = [
    { key: 'title', header: 'Title', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          <Film className="h-4 w-4" />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{v.title}</span>
      </div>
    ) },
    { key: 'filename', header: 'Filename', render: (v) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{v.filename ?? '—'}</span> },
    { key: 'sessionId', header: 'Session', render: (v) => <span className="text-gray-600 dark:text-gray-300">{sessionName(v.sessionId)}</span> },
    { key: 'bucketId', header: 'Bucket', render: (v) => <span className="text-gray-500 dark:text-gray-400">{bucketName(v.bucketId)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Video Master"
        description="Upload video URLs and map them to sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New Video
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
        rowKey={(v) => v.id}
        actions={(v) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(v)} className="btn-ghost h-8 w-8 p-0" title="Edit" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(v)} className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Delete" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Video' : 'New Video'}
        description={editing ? `Editing "${editing.title}"` : 'Add a video by filename or URL.'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              {editing ? 'Save changes' : 'Create video'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}
          <div>
            <label className="label">Video title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Intro to TypeScript — Recording" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Filename (optional)</label>
              <input className="input font-mono text-sm" value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} placeholder="intro-ts.mp4" />
            </div>
            <div>
              <label className="label">Video URL</label>
              <input className="input font-mono text-sm" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://…/signed-url" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Map to session</label>
              <select className="input" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} required>
                <option value="">Select session…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Bucket (optional)</label>
              <select className="input" value={form.bucketId} onChange={(e) => setForm({ ...form, bucketId: e.target.value })}>
                <option value="">No bucket</option>
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Provide a direct or signed URL. No file upload is needed — the backend handles streaming.</p>
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete video?"
        description={`This will permanently delete "${deleteTarget?.title}".`}
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this video?</p>
      </Modal>
    </div>
  );
}
