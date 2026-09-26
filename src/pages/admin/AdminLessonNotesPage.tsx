import { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  FileText,
  GraduationCap,
  RotateCcw,
  Upload,
  FileCheck,
  Paperclip,
  RefreshCw,
  X as XIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { lessonNotesService, lessonMasterService } from '@/services';
import type {
  Lesson,
  LessonNotes,
  LessonNotesStatus,
} from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';
import DocumentPreviewModal, {
  detectDocType,
  getDocTypeBadge,
} from '@/components/DocumentPreviewModal';

export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
export const MAX_DOCUMENT_UPLOAD_SIZE_MB = 25;
export const MAX_DOCUMENT_UPLOAD_BYTES = MAX_DOCUMENT_UPLOAD_SIZE_MB * 1024 * 1024;

export function validateSelectedDocument(file: File): { valid: boolean; error?: string } {
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return { valid: false, error: 'Only PDF, Word, Excel and TXT files are allowed.' };
  }

  if (file.type && file.type.trim()) {
    const mime = file.type.toLowerCase();
    const hasValidMime =
      ALLOWED_DOCUMENT_MIMES.includes(mime) ||
      mime.startsWith('text/plain') ||
      mime.includes('word') ||
      mime.includes('sheet') ||
      mime.includes('excel') ||
      mime === 'application/octet-stream';

    if (!hasValidMime) {
      return { valid: false, error: 'Only PDF, Word, Excel and TXT files are allowed.' };
    }
  }

  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed limit of ${MAX_DOCUMENT_UPLOAD_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}

interface NoteFormData {
  lessonNotesRefId: string;
  lessonId: string | number;
  title: string;
  content: string;
  status: LessonNotesStatus;
  documentUrl?: string | null;
  fileName?: string | null;
}

const emptyForm: NoteFormData = {
  lessonNotesRefId: '',
  lessonId: '',
  title: '',
  content: '',
  status: 1,
  documentUrl: null,
  fileName: null,
};


export default function AdminLessonNotesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramLessonId = searchParams.get('lessonId') || '';
  const paramLessonRefId = searchParams.get('lessonRefId') || '';

  // Role-based protection: non-admin users must not access Lesson Notes
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<LessonNotes[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lessonFilter, setLessonFilter] = useState<string>(paramLessonId || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference data for lessons dropdown
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LessonNotes | null>(null);
  const [form, setForm] = useState<NoteFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File upload state for Create / Edit
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDoc, setExistingDoc] = useState<{ url: string; name: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReplacingFile, setIsReplacingFile] = useState(false);

  // Document preview modal state
  const [previewTarget, setPreviewTarget] = useState<{
    url: string;
    name?: string;
    type?: string;
  } | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<LessonNotes | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<LessonNotes | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load lessons for selection dropdown and name resolution
  useEffect(() => {
    setLessonsLoading(true);
    lessonMasterService
      .getAllLessons({ pageSize: 100 })
      .then((res) => {
        const list = res.row || res.items || [];
        setLessons(list);

        // If URL provided lessonRefId instead of lessonId, attempt resolution
        if (paramLessonRefId && !paramLessonId) {
          const match = list.find((l) => l.lessonRefId === paramLessonRefId);
          if (match && match.lessonId) {
            setLessonFilter(String(match.lessonId));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
  }, [paramLessonId, paramLessonRefId]);

  const getLessonName = useCallback(
    (lessonId?: number | string): string => {
      if (!lessonId && lessonId !== 0) return '—';
      const found = lessons.find(
        (l) =>
          String(l.lessonId) === String(lessonId) ||
          l.lessonRefId === String(lessonId) ||
          l.id === String(lessonId)
      );
      return found ? found.lessonName || found.name : `Lesson #${lessonId}`;
    },
    [lessons]
  );

  const getLessonCode = useCallback(
    (lessonId?: number | string): string | undefined => {
      if (!lessonId && lessonId !== 0) return undefined;
      const found = lessons.find(
        (l) =>
          String(l.lessonId) === String(lessonId) ||
          l.lessonRefId === String(lessonId) ||
          l.id === String(lessonId)
      );
      return found?.lessonCode;
    },
    [lessons]
  );

  const load = useCallback(
    (targetPage = page) => {
      setLoading(true);
      setError(null);
      lessonNotesService
        .getAllLessonNotes({
          page: targetPage,
          pageSize,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          lessonId: lessonFilter !== 'all' ? lessonFilter : undefined,
        })
        .then((res) => {
          const extractedRows = res.row || res.items || [];
          const extractedTotal = Number(res.totalItem ?? res.total ?? 0);
          const calculatedTotalPages = Math.max(1, Math.ceil(extractedTotal / pageSize));
          const extractedTotalPages = Number(res.totalPage ?? calculatedTotalPages);

          if (targetPage > extractedTotalPages && extractedTotalPages > 0) {
            setPage(extractedTotalPages);
            return;
          }

          setRows(extractedRows);
          setTotal(extractedTotal);
          setTotalPages(extractedTotalPages);
        })
        .catch((e) =>
          setError(e instanceof Error ? e.message : 'Failed to load lesson notes')
        )
        .finally(() => setLoading(false));
    },
    [page, pageSize, search, statusFilter, lessonFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      ...emptyForm,
      lessonId: lessonFilter !== 'all' ? lessonFilter : (lessons[0]?.lessonId ?? ''),
    });
    setSelectedFile(null);
    setExistingDoc(null);
    setFileError(null);
    setIsReplacingFile(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (note: LessonNotes) => {
    setMode('edit');
    setEditing(note);
    setFormError(null);
    setSelectedFile(null);
    setFileError(null);
    setIsReplacingFile(false);

    const targetRefId = note.lessonNotesRefId || note.id;

    if (note.documentUrl) {
      setExistingDoc({
        url: note.documentUrl,
        name: note.fileName || note.filename || 'Attached Document',
      });
    } else {
      setExistingDoc(null);
    }

    // Default with available row state
    setForm({
      lessonNotesRefId: targetRefId,
      lessonId: note.lessonId,
      title: note.title || '',
      content: note.content || '',
      status: note.status !== undefined ? note.status : 1,
      documentUrl: note.documentUrl || null,
      fileName: note.fileName || note.filename || null,
    });
    setModalOpen(true);

    // Call single getLessonNotes API to fetch freshest details
    try {
      const freshNote = await lessonNotesService.getLessonNotes(targetRefId);
      if (freshNote) {
        setForm({
          lessonNotesRefId: freshNote.lessonNotesRefId || targetRefId,
          lessonId: freshNote.lessonId !== undefined ? freshNote.lessonId : note.lessonId,
          title: freshNote.title || note.title || '',
          content: freshNote.content || note.content || '',
          status: freshNote.status !== undefined ? freshNote.status : 1,
          documentUrl: freshNote.documentUrl || note.documentUrl || null,
          fileName: freshNote.fileName || freshNote.filename || note.fileName || note.filename || null,
        });
        if (freshNote.documentUrl) {
          setExistingDoc({
            url: freshNote.documentUrl,
            name: freshNote.fileName || freshNote.filename || 'Attached Document',
          });
        }
      }
    } catch {
      // Non-blocking: fallback to row data
    }
  };

  const openView = (note: LessonNotes) => {
    setViewingTarget(note);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateSelectedDocument(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Only PDF, Word, Excel and TXT files are allowed.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setIsReplacingFile(false);
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFileError(null);
  };

  const validateForm = (): string | null => {
    if (!String(form.lessonId).trim()) {
      return 'Lesson selection is required.';
    }
    if (!form.title.trim()) {
      return 'Note title is required.';
    }
    if (!form.content.trim()) {
      return 'Note content is required.';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFileError(null);

    const validationErr = validateForm();
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    setSaving(true);
    try {
      const isEditMode =
        mode === 'edit' &&
        Boolean(form.lessonNotesRefId || editing?.lessonNotesRefId);
      const targetRefId = isEditMode
        ? form.lessonNotesRefId || editing?.lessonNotesRefId || ''
        : '';

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('lessonId', String(form.lessonId));
      formData.append('status', String(form.status));

      if (isEditMode && targetRefId) {
        formData.append('lessonNotesRefId', targetRefId);
      }

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await lessonNotesService.createLessonNotes(formData);

      if (isEditMode) {
        setSuccessMessage(`Lesson note "${form.title.trim()}" updated successfully.`);
      } else {
        setSuccessMessage(`Lesson note "${form.title.trim()}" created successfully.`);
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
    const targetRefId = deleteTarget.lessonNotesRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete note: missing lessonNotesRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await lessonNotesService.deleteLessonNotes({ lessonNotesRefId: targetRefId });
      setSuccessMessage(`Lesson note "${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);

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

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLessonFilter('all');
    setPage(1);
  };

  const columns: Column<LessonNotes>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (n) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate max-w-[240px] dark:text-white" title={n.title}>
              {n.title}
            </p>
            {n.lessonNotesRefId && (
              <p className="font-mono text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[140px]" title={n.lessonNotesRefId}>
                Ref: {n.lessonNotesRefId.slice(0, 14)}…
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (n) => (
        <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm truncate" title={n.content}>
          {n.content || <span className="italic text-gray-400">—</span>}
        </p>
      ),
    },
    {
      key: 'document',
      header: 'Document',
      render: (n) => {
        if (!n.documentUrl) {
          return <span className="text-gray-400 select-none text-xs">—</span>;
        }
        const docType = detectDocType(n.documentUrl, n.fileName || n.filename);
        const badge = getDocTypeBadge(docType);
        const docName = n.fileName || n.filename || 'Document';

        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.bg} ${badge.color}`}
              title={docName}
            >
              {badge.label.split(' ')[0]}
            </span>
            <button
              type="button"
              onClick={() =>
                setPreviewTarget({
                  url: n.documentUrl!,
                  name: docName,
                  type: n.fileType || undefined,
                })
              }
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium hover:underline"
              title={`Preview ${docName}`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>
        );
      },
    },
    {
      key: 'lessonId',

      header: 'Lesson',
      render: (n) => {
        const lessonName = n.lessonName || getLessonName(n.lessonId);
        const code = getLessonCode(n.lessonId);
        return (
          <div className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 font-medium">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[180px]" title={lessonName}>
              {code ? `[${code}] ` : ''}{lessonName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (n) => {
        const isActive = String(n.status) === '1' || String(n.status).toLowerCase() === 'active' || String(n.status).toLowerCase() === 'published';
        return (
          <StatusBadge
            status={isActive ? 'active' : 'inactive'}
            label={isActive ? 'Active' : 'Inactive'}
          />
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (n) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      render: (n) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (n) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openView(n)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            title="View Note Details"
            aria-label="View Note Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(n)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
            title="Edit Note"
            aria-label="Edit Note"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(n)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
            title="Delete Note"
            aria-label="Delete Note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Lesson Notes"
        description="Create, view, and maintain supplemental notes and summaries for curriculum lessons."
        action={
          <button
            id="create-lesson-note-btn"
            onClick={openCreate}
            className="btn btn-primary inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </button>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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

      {/* Filter toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lesson Filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="notes-lesson-filter"
            >
              Lesson:
            </label>
            <select
              id="notes-lesson-filter"
              value={lessonFilter}
              onChange={(e) => {
                setLessonFilter(e.target.value);
                setPage(1);
              }}
              className="input w-52 py-1 text-sm"
              disabled={lessonsLoading}
            >
              <option value="all">All Lessons</option>
              {lessons.map((l) => (
                <option key={l.lessonRefId || l.id} value={l.lessonId ?? l.lessonRefId}>
                  {l.lessonCode ? `[${l.lessonCode}] ` : ''}
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="notes-status-filter"
            >
              Status:
            </label>
            <select
              id="notes-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input w-36 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          {(statusFilter !== 'all' || lessonFilter !== 'all' || search) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="search"
            id="notes-search"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input w-full text-sm py-1.5"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        rowKey={(n) => n.lessonNotesRefId || n.id}
        emptyMessage="No lesson notes found. Click 'Add Note' to create one."
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'create' ? 'Create Lesson Note' : 'Edit Lesson Note'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          {/* Lesson Select */}
          <div>
            <label
              htmlFor="note-form-lesson"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Lesson <span className="text-red-500">*</span>
            </label>
            <select
              id="note-form-lesson"
              value={form.lessonId}
              onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
              className="input w-full"
              required
              disabled={lessonsLoading}
            >
              <option value="">-- Select a Lesson --</option>
              {lessons.map((l) => (
                <option key={l.lessonRefId || l.id} value={l.lessonId ?? l.lessonRefId}>
                  {l.lessonCode ? `[${l.lessonCode}] ` : ''}
                  {l.lessonName || l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="note-form-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Note Title <span className="text-red-500">*</span>
            </label>
            <input
              id="note-form-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Asynchronous Execution Lifecycle"
              className="input w-full"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="note-form-content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="note-form-content"
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write detailed lesson notes, reminders, or references here..."
              className="input w-full font-mono text-sm"
              required
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Attachment (Optional)
            </label>

            {/* If existing document and not currently replacing */}
            {existingDoc && !selectedFile && !isReplacingFile && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Existing Document
                    </span>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-xs" title={existingDoc.name}>
                      {existingDoc.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewTarget({
                        url: existingDoc.url,
                        name: existingDoc.name,
                      })
                    }
                    className="btn btn-secondary text-xs inline-flex items-center gap-1 px-2.5 py-1"
                    title="Preview Existing Document"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReplacingFile(true)}
                    className="btn btn-secondary text-xs inline-flex items-center gap-1 px-2.5 py-1 text-gray-700 dark:text-gray-200"
                    title="Replace with a new document"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Replace</span>
                  </button>
                </div>
              </div>
            )}

            {/* If a new file is chosen */}
            {selectedFile && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Selected File To Upload
                    </span>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-xs" title={selectedFile.name}>
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveSelectedFile}
                  className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Remove selected file"
                  aria-label="Remove selected file"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Upload selector if no file is selected and not showing existing doc (or user clicked replace) */}
            {(!existingDoc || isReplacingFile) && !selectedFile && (
              <div className="space-y-1.5">
                <label
                  htmlFor="note-form-file"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-lg p-4 cursor-pointer bg-gray-50/50 dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition-colors"
                >
                  <Upload className="h-6 w-6 text-gray-400 mb-1.5" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Click to browse or drag & drop document
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Supported: PDF, DOC, DOCX, XLS, XLSX, TXT (Max {MAX_DOCUMENT_UPLOAD_SIZE_MB}MB)
                  </span>
                  <input
                    id="note-form-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {isReplacingFile && existingDoc && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsReplacingFile(false)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Keep existing document
                    </button>
                  </div>
                )}
              </div>
            )}

            {fileError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                {fileError}
              </p>
            )}
          </div>

          {/* Status */}

          <div>
            <label
              htmlFor="note-form-status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="note-form-status"
              value={String(form.status)}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
              className="input w-full"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={Boolean(viewingTarget)}
        onClose={() => setViewingTarget(null)}
        title="Lesson Note Details"
        size="md"
      >
        {viewingTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Note Title
                </span>
                <p className="text-base font-semibold text-gray-900 dark:text-white mt-0.5">
                  {viewingTarget.title}
                </p>
                {viewingTarget.lessonNotesRefId && (
                  <p className="font-mono text-xs text-gray-400 dark:text-gray-500 mt-1 select-all break-all">
                    Ref: {viewingTarget.lessonNotesRefId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Lesson
                  </span>
                  <p className="text-sm font-semibold text-sky-700 dark:text-sky-300 mt-0.5">
                    {viewingTarget.lessonName || getLessonName(viewingTarget.lessonId)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge
                      status={String(viewingTarget.status) === '1' ? 'active' : 'inactive'}
                      label={String(viewingTarget.status) === '1' ? 'Active' : 'Inactive'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Document Section */}
            {viewingTarget.documentUrl && (
              <div className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/70 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Attached Document
                    </span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-sm" title={viewingTarget.fileName || viewingTarget.filename || 'Document'}>
                      {viewingTarget.fileName || viewingTarget.filename || 'Document'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewTarget({
                      url: viewingTarget.documentUrl!,
                      name: viewingTarget.fileName || viewingTarget.filename || undefined,
                      type: viewingTarget.fileType || undefined,
                    })
                  }
                  className="btn btn-secondary text-xs inline-flex items-center gap-1.5 shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            )}

            {/* Content preview */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Note Content
              </span>
              <div className="mt-1 p-3.5 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950/60 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                {viewingTarget.content}
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
              {viewingTarget.createdAt && (
                <p>Created: {new Date(viewingTarget.createdAt).toLocaleString()}</p>
              )}
              {viewingTarget.updatedAt && (
                <p>Last Updated: {new Date(viewingTarget.updatedAt).toLocaleString()}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setViewingTarget(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = viewingTarget;
                  setViewingTarget(null);
                  openEdit(t);
                }}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit This Note</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Lesson Note"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the note{' '}
              <strong className="text-gray-900 dark:text-white">
                "{deleteTarget.title}"
              </strong>{' '}
              for lesson{' '}
              <strong className="text-gray-900 dark:text-white">
                "{deleteTarget.lessonName || getLessonName(deleteTarget.lessonId)}"
              </strong>
              ?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Note'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        documentUrl={previewTarget?.url || null}
        fileName={previewTarget?.name}
        fileType={previewTarget?.type}
      />
    </div>
  );
}

