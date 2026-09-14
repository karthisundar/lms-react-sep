import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Database, CheckCircle2 } from 'lucide-react';
import { bucketMasterService } from '@/services';
import type { Bucket, BucketCreateInput, BucketUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

interface BucketFormData {
  bucketRefId: string;
  bucketName: string;
  serviceUrl: string;
  status: number;
}

const emptyForm: BucketFormData = {
  bucketRefId: '',
  bucketName: '',
  serviceUrl: '',
  status: 1,
};

export default function AdminBucketsPage() {
  const [rows, setRows] = useState<Bucket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bucket | null>(null);
  const [form, setForm] = useState<BucketFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Bucket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((targetPage = page) => {
    setLoading(true);
    setError(null);
    bucketMasterService
      .getAllBuckets({ page: targetPage, pageSize, search: search || undefined })
      .then((res) => {
        const extractedRows = res.row || res.items || [];
        const extractedTotal = Number(res.totalItem ?? res.total ?? 0);
        const calculatedTotalPages = Math.max(1, Math.ceil(extractedTotal / pageSize));
        const extractedTotalPages = Number(res.totalPage ?? calculatedTotalPages);

        // Edge case: if current page is greater than totalPage and we have pages, navigate to totalPage
        if (targetPage > extractedTotalPages && extractedTotalPages > 0) {
          setPage(extractedTotalPages);
          return;
        }

        setRows(extractedRows);
        setTotal(extractedTotal);
        setTotalPages(extractedTotalPages);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load buckets'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      bucketRefId: '',
      bucketName: '',
      serviceUrl: '',
      status: 1,
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (b: Bucket) => {
    setMode('edit');
    setEditing(b);
    setForm({
      bucketRefId: b.bucketRefId,
      bucketName: b.bucketName || b.name || '',
      serviceUrl: b.serviceUrl || b.url || '',
      status: typeof b.status === 'number' ? b.status : 1,
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    // Call single record endpoint using bucketRefId if available
    if (b.bucketRefId) {
      bucketMasterService
        .getBucket(b.bucketRefId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              bucketRefId: fetched.bucketRefId || b.bucketRefId,
              bucketName: fetched.bucketName || fetched.name || b.bucketName || '',
              serviceUrl: fetched.serviceUrl || fetched.url || b.serviceUrl || '',
              status: typeof fetched.status === 'number' ? fetched.status : b.status,
            });
          }
        })
        .catch(() => {
          // Keep existing row values on failure
        });
    }
  };

  const validateForm = (): string | null => {
    const trimmedName = form.bucketName.trim();
    if (!trimmedName) {
      return 'Bucket Name is required and cannot be empty.';
    }

    const trimmedUrl = form.serviceUrl.trim();
    if (!trimmedUrl) {
      return 'Service URL is required and cannot be empty.';
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
      const isEditMode = mode === 'edit' && Boolean(form.bucketRefId || editing?.bucketRefId);
      const targetRefId = isEditMode ? (form.bucketRefId || editing?.bucketRefId || '') : '';

      const payload: BucketCreateInput | BucketUpdateInput = {
        bucketRefId: targetRefId,
        bucketName: form.bucketName.trim(),
        serviceUrl: form.serviceUrl.trim(),
        status: Number(form.status),
      };

      await bucketMasterService.createBucket(payload);

      if (isEditMode) {
        setSuccessMessage(`Bucket "${form.bucketName.trim()}" updated successfully.`);
      } else {
        setSuccessMessage(`Bucket "${form.bucketName.trim()}" created successfully.`);
      }

      setModalOpen(false);
      load(page);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetRefId = deleteTarget.bucketRefId;
    if (!targetRefId) {
      setError('Unable to delete bucket: missing bucketRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Delete API requires bucketRefId in payload: { bucketRefId }
      await bucketMasterService.deleteBucket({ bucketRefId: targetRefId });
      setSuccessMessage(`Bucket "${deleteTarget.bucketName || deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);

      // Edge case: If deleting the only item on current page (and page > 1), move to previous valid page
      if (rows.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        load(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Bucket>[] = [
    {
      key: 'bucketName',
      header: 'Bucket Name',
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{b.bucketName || b.name}</p>
            {b.bucketRefId && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500" title={b.bucketRefId}>
                Ref: {b.bucketRefId.length > 18 ? `${b.bucketRefId.slice(0, 18)}…` : b.bucketRefId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'serviceUrl',
      header: 'Service URL',
      render: (b) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 break-all">
          {b.serviceUrl || b.url || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => {
        const isActive = b.status === 1;
        return (
          <span
            className={`badge ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            }`}
          >
            <span
              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                isActive ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (b) =>
        b.createdAt
          ? new Date(b.createdAt).toLocaleDateString(undefined, {
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
        title="Bucket Master"
        description="Manage cloud storage buckets and service endpoints."
        action={
          <button onClick={openCreate} className="btn-primary" id="add-bucket-btn">
            <Plus className="h-4 w-4" /> Add Bucket
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
        rowKey={(b) => b.bucketRefId || String(b.bucketId)}
        emptyMessage="No buckets found."
        actions={(b) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(b)}
              className="btn-ghost h-8 w-8 p-0"
              title="Edit bucket"
              aria-label="Edit bucket"
              id={`edit-bucket-${b.bucketRefId}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(b)}
              className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete bucket"
              aria-label="Delete bucket"
              id={`delete-bucket-${b.bucketRefId}`}
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
        title={mode === 'edit' ? 'Edit Bucket' : 'Add Bucket'}
        description={
          mode === 'edit' && editing
            ? `Update bucket details for "${editing.bucketName || editing.name}".`
            : 'Configure a new storage bucket service.'
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
              id="save-bucket-btn"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Create bucket'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label" htmlFor="bucket-name">
              Bucket Name <span className="text-red-500">*</span>
            </label>
            <input
              id="bucket-name"
              className="input"
              value={form.bucketName}
              onChange={(e) => setForm({ ...form, bucketName: e.target.value })}
              required
              placeholder="e.g. main-recordings-bucket"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="bucket-service-url">
              Service URL <span className="text-red-500">*</span>
            </label>
            <input
              id="bucket-service-url"
              className="input font-mono text-sm"
              value={form.serviceUrl}
              onChange={(e) => setForm({ ...form, serviceUrl: e.target.value })}
              required
              placeholder="e.g. https://storage.googleapis.com/main-recordings"
            />
          </div>

          <div>
            <label className="label" htmlFor="bucket-status">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="bucket-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Bucket?"
        description={`This will permanently delete "${deleteTarget?.bucketName || deleteTarget?.name}". This action cannot be undone.`}
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
              id="confirm-delete-bucket-btn"
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
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this bucket?
            </p>
            <p className="mt-1 text-xs">
              Storage references linked to this bucket will be removed.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
