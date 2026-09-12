import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Database, Cloud } from 'lucide-react';
import { api } from '@/services';
import type { Bucket, BucketCreateInput, BucketProvider, BucketUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

const emptyForm: BucketCreateInput = { name: '', provider: 's3', url: '', config: null };

const providerLabels: Record<BucketProvider, string> = {
  s3: 'Amazon S3',
  gcs: 'Google Cloud Storage',
  azure: 'Azure Blob',
  other: 'Other',
};

export default function AdminBucketsPage() {
  const [rows, setRows] = useState<Bucket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bucket | null>(null);
  const [form, setForm] = useState<BucketCreateInput>(emptyForm);
  const [configText, setConfigText] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Bucket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.buckets
      .list({ search: search || undefined, page, pageSize })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load buckets'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setConfigText('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (b: Bucket) => {
    setEditing(b);
    setForm({ name: b.name, provider: b.provider, url: b.url, config: b.config ?? null });
    setConfigText(b.config ? JSON.stringify(b.config, null, 2) : '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      let parsedConfig: Record<string, string> | null = null;
      if (configText.trim()) {
        try {
          parsedConfig = JSON.parse(configText);
        } catch {
          throw new Error('Config must be valid JSON');
        }
      }
      const body: BucketCreateInput = { ...form, config: parsedConfig };
      if (editing) {
        await api.buckets.update(editing.id, body as BucketUpdateInput);
      } else {
        await api.buckets.create(body);
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
      await api.buckets.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Bucket>[] = [
    { key: 'name', header: 'Bucket Name', render: (b) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Database className="h-4 w-4" />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
      </div>
    ) },
    { key: 'provider', header: 'Provider', render: (b) => <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{providerLabels[b.provider]}</span> },
    { key: 'url', header: 'URL / Config', render: (b) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{b.url}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Bucket Master"
        description="Manage storage providers for video recordings."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New Bucket
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
        rowKey={(b) => b.id}
        actions={(b) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(b)} className="btn-ghost h-8 w-8 p-0" title="Edit" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteTarget(b)} className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Delete" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Bucket' : 'New Bucket'}
        description={editing ? `Editing "${editing.name}"` : 'Configure a storage bucket.'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
              {editing ? 'Save changes' : 'Create bucket'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}
          <div>
            <label className="label">Bucket name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="recordings-primary" />
          </div>
          <div>
            <label className="label">Provider</label>
            <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as BucketProvider })}>
              {Object.entries(providerLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bucket URL</label>
            <input className="input font-mono text-sm" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="s3://my-bucket/path" />
          </div>
          <div>
            <label className="label">Config (JSON, optional)</label>
            <textarea
              className="input min-h-[100px] resize-y font-mono text-xs"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={'{\n  "region": "us-east-1"\n}'}
            />
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete bucket?"
        description={`This will permanently delete "${deleteTarget?.name}".`}
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
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Are you sure? Videos mapped to this bucket may lose their storage reference.</p>
        </div>
      </Modal>
    </div>
  );
}
