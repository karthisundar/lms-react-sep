import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { sessionMasterService } from '@/services';
import type { Session, SessionCreateInput, SessionUpdateInput } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface SessionFormData {
  sessionRefId: string;
  name: string;
  description: string;
  date: string;
  status: string;
}

const emptyForm: SessionFormData = {
  sessionRefId: '',
  name: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'draft',
};

export default function AdminSessionsPage() {
  const [rows, setRows] = useState<Session[]>([]);
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
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState<SessionFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((targetPage = page) => {
    setLoading(true);
    setError(null);
    sessionMasterService
      .getAllSessions({ page: targetPage, pageSize, search: search || undefined })
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
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
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
      sessionRefId: '',
      name: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (s: Session) => {
    setMode('edit');
    setEditing(s);
    const refId = s.sessionRefId || s.id || '';
    const initialDate = s.startDate || s.date || '';
    setForm({
      sessionRefId: refId,
      name: s.sessionName || s.name || '',
      description: s.description || '',
      date: initialDate ? initialDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: s.status || 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    // Call single record endpoint using sessionRefId if available
    if (refId) {
      sessionMasterService
        .getSession(refId)
        .then((fetched) => {
          if (fetched) {
            const fetchedDate = fetched.startDate || fetched.date || '';
            setForm({
              sessionRefId: fetched.sessionRefId || refId,
              name: fetched.sessionName || fetched.name || s.sessionName || s.name || '',
              description: fetched.description ?? s.description ?? '',
              date: fetchedDate ? fetchedDate.slice(0, 10) : (initialDate ? initialDate.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              status: fetched.status || s.status || 'draft',
            });
          }
        })
        .catch(() => {
          // Keep existing row values on failure
        });
    }
  };

  const validateForm = (): string | null => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      return 'Session Name is required and cannot be empty.';
    }
    if (!form.date) {
      return 'Date is required.';
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
      const isEditMode = mode === 'edit' && Boolean(form.sessionRefId || editing?.sessionRefId);
      const targetRefId = isEditMode ? (form.sessionRefId || editing?.sessionRefId || '') : '';

      // Convert date input (YYYY-MM-DD) to ISO format
      let isoDate = form.date;
      try {
        const d = new Date(form.date);
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString();
        }
      } catch {
        // fallback to existing string
      }

      const payload: SessionCreateInput | SessionUpdateInput = {
        sessionRefId: targetRefId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        date: isoDate,
        status: form.status,
      };

      await sessionMasterService.createSession(payload);

      if (isEditMode) {
        setSuccessMessage('Session updated successfully.');
      } else {
        setSuccessMessage('Session created successfully.');
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
    const targetRefId = deleteTarget.sessionRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete session: missing sessionRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      // Delete API requires sessionRefId in payload: { sessionRefId }
      await sessionMasterService.deleteSession({ sessionRefId: targetRefId });
      setSuccessMessage('Session deleted successfully.');
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

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const columns: Column<Session>[] = [
    {
      key: 'sessionName',
      header: 'Session Name',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{s.sessionName || s.name}</p>
            {s.sessionCode && (
              <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                Code: {s.sessionCode}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (s) => (
        <span className="line-clamp-2 max-w-sm text-gray-500 dark:text-gray-400">
          {s.description || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span className="text-gray-700 dark:text-gray-300">
          {formatDateDisplay(s.startDate || s.date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Session Master"
        description="Create, edit, and manage class sessions."
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Session
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
        rowKey={(s) => s.sessionRefId || s.id || String(s.sessionMasterId)}
        actions={(s) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(s)}
              className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:text-brand-700 dark:text-brand-400"
              title="Edit Session"
              aria-label="Edit Session"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(s)}
              className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
              title="Delete Session"
              aria-label="Delete Session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'edit' ? 'Edit Session' : 'New Session'}
        description={
          mode === 'edit'
            ? `Editing "${editing?.sessionName || editing?.name || 'Session'}"`
            : 'Create a new class session.'
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
              {mode === 'edit' ? 'Save changes' : 'Create session'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label">
              Session Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Intro to TypeScript"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this session covers…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete session?"
        description={`This will permanently delete "${deleteTarget?.sessionName || deleteTarget?.name}". This action cannot be undone.`}
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
          Are you sure you want to delete this session?
        </p>
      </Modal>
    </div>
  );
}
