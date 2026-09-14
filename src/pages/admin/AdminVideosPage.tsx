import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Film, Link2, CheckCircle2 } from 'lucide-react';
import { videoService, sessionMasterService, bucketMasterService } from '@/services';
import type { Bucket, Session, Video, VideoCreateInput, VideoUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner } from '@/components/ui';

interface VideoFormData {
  videoRefId: string;
  title: string;
  filename: string;
  url: string;
  sessionId: string;
  bucketId: string;
}

const emptyForm: VideoFormData = {
  videoRefId: '',
  title: '',
  filename: '',
  url: '',
  sessionId: '',
  bucketId: '',
};

export default function AdminVideosPage() {
  const [rows, setRows] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load sessions and buckets for selection dropdowns and table lookup
  useEffect(() => {
    Promise.all([
      sessionMasterService.getAllSessions({ page: 1, pageSize: 200 }),
      bucketMasterService.getAllBuckets({ page: 1, pageSize: 200 }),
    ])
      .then(([sRes, bRes]) => {
        setSessions(sRes.row || sRes.items || []);
        setBuckets(bRes.row || bRes.items || []);
      })
      .catch(() => {});
  }, []);

  const getSessionName = (sessionId: string) => {
    if (!sessionId) return '—';
    const s = sessions.find((item) => item.sessionRefId === sessionId || item.id === sessionId);
    return s?.sessionName || s?.name || sessionId;
  };

  const getBucketName = (bucketId: string) => {
    if (!bucketId) return '—';
    const b = buckets.find(
      (item) => item.bucketRefId === bucketId || item.id === bucketId || String(item.bucketId) === bucketId
    );
    return b?.bucketName || b?.name || bucketId;
  };

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      videoService
        .getAllVideos({ page: targetPage, pageSize, search: search || undefined })
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
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load videos'))
        .finally(() => setLoading(false));
    },
    [page, pageSize, search]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    const defaultSessionId = sessions[0]?.sessionRefId || sessions[0]?.id || '';
    const defaultBucketId = buckets[0]?.bucketRefId || buckets[0]?.id || '';
    setForm({
      videoRefId: '',
      title: '',
      filename: '',
      url: '',
      sessionId: defaultSessionId,
      bucketId: defaultBucketId,
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (v: Video) => {
    setMode('edit');
    setEditing(v);
    const refId = v.videoRefId || v.id || '';
    setForm({
      videoRefId: refId,
      title: v.title || '',
      filename: v.filename || '',
      url: v.url || '',
      sessionId: v.sessionId || '',
      bucketId: v.bucketId || '',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    // Call single record endpoint using videoRefId if available
    if (refId) {
      videoService
        .getVideo(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              videoRefId: fetched.videoRefId || refId,
              title: fetched.title ?? v.title,
              filename: fetched.filename ?? v.filename,
              url: fetched.url ?? v.url,
              sessionId: fetched.sessionId ?? v.sessionId,
              bucketId: fetched.bucketId ?? v.bucketId,
            });
          }
        })
        .catch(() => {
          // Keep existing row values on failure
        });
    }
  };

  const validateForm = (): string | null => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      return 'Title is required and cannot be empty.';
    }
    const trimmedFilename = form.filename.trim();
    if (!trimmedFilename) {
      return 'Filename is required and cannot be empty.';
    }
    const trimmedUrl = form.url.trim();
    if (!trimmedUrl) {
      return 'URL is required and cannot be empty.';
    }
    if (!form.sessionId) {
      return 'Session is required. Please select a session.';
    }
    if (!form.bucketId) {
      return 'Bucket is required. Please select a bucket.';
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
      const isEditMode = mode === 'edit' && Boolean(form.videoRefId || editing?.videoRefId);
      const targetRefId = isEditMode ? (form.videoRefId || editing?.videoRefId || '') : '';

      const payload: VideoCreateInput | VideoUpdateInput = {
        videoRefId: targetRefId,
        title: form.title.trim(),
        filename: form.filename.trim(),
        url: form.url.trim(),
        sessionId: form.sessionId,
        bucketId: form.bucketId,
      };

      await videoService.createVideo(payload);

      if (isEditMode) {
        setSuccessMessage('Video updated successfully.');
      } else {
        setSuccessMessage('Video created successfully.');
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
    const targetRefId = deleteTarget.videoRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete video: missing videoRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Delete API requires videoRefId in payload: { videoRefId }
      await videoService.deleteVideo({ videoRefId: targetRefId });
      setSuccessMessage('Video deleted successfully.');
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

  const columns: Column<Video>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{v.title}</p>
            {v.videoRefId && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500" title={v.videoRefId}>
                Ref: {v.videoRefId.length > 18 ? `${v.videoRefId.slice(0, 18)}…` : v.videoRefId}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'filename',
      header: 'Filename',
      render: (v) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {v.filename ?? '—'}
        </span>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (v) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 break-all">
          {v.url || '—'}
        </span>
      ),
    },
    {
      key: 'sessionId',
      header: 'Session',
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-200">
          {getSessionName(v.sessionId)}
        </span>
      ),
    },
    {
      key: 'bucketId',
      header: 'Bucket',
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-200">
          {getBucketName(v.bucketId)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Video Master"
        description="Upload video URLs and map them to sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Video
          </button>
        }
      />

      {successMessage && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white"
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
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        searchValue={search}
        rowKey={(v) => v.videoRefId || v.id || String(v.videoId)}
        actions={(v) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(v)}
              className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700 dark:text-brand-400"
              title="Edit Video"
              aria-label="Edit Video"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(v)}
              className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete Video"
              aria-label="Delete Video"
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
        title={mode === 'edit' ? 'Edit Video' : 'New Video'}
        description={
          mode === 'edit' ? `Editing "${editing?.title || 'Video'}"` : 'Add a video by filename and URL.'
        }
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Create video'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Intro to TypeScript — Recording"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Filename <span className="text-red-500">*</span>
              </label>
              <input
                className="input font-mono text-sm"
                value={form.filename}
                onChange={(e) => setForm({ ...form, filename: e.target.value })}
                required
                placeholder="e.g. intro-ts.mp4"
              />
            </div>
            <div>
              <label className="label">
                Video URL <span className="text-red-500">*</span>
              </label>
              <input
                className="input font-mono text-sm"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                placeholder="https://…/video.mp4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Session <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                required
              >
                <option value="">Select session…</option>
                {sessions.map((s) => {
                  const sId = s.sessionRefId || s.id;
                  return (
                    <option key={sId} value={sId}>
                      {s.sessionName || s.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="label">
                Bucket <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.bucketId}
                onChange={(e) => setForm({ ...form, bucketId: e.target.value })}
                required
              >
                <option value="">Select bucket…</option>
                {buckets.map((b) => {
                  const bId = b.bucketRefId || b.id;
                  return (
                    <option key={bId} value={bId}>
                      {b.bucketName || b.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Provide a direct or signed URL. The backend manages video streaming through the mapped session and bucket.</p>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete video?"
        description={`This will permanently delete "${deleteTarget?.title}". This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Are you sure you want to delete this video?
        </p>
      </Modal>
    </div>
  );
}
