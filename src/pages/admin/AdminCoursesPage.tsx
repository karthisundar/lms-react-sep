import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen, CheckCircle2, Eye, Calendar, Tag, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { courseMasterService } from '@/services';
import type { Course, CourseCreateInput, CourseUpdateInput, CourseStatus } from '@/types/api';
import DataTable, { type Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { PageHeader, ErrorBanner, StatusBadge } from '@/components/ui';

interface CourseFormData {
  courseRefId: string;
  courseName: string;
  description: string;
  status: CourseStatus;
}

const emptyForm: CourseFormData = {
  courseRefId: '',
  courseName: '',
  description: '',
  status: 'draft',
};

export default function AdminCoursesPage() {
  const { user } = useAuth();

  // Role-based protection: non-admin users must not access Course Master
  if (user && user.role !== 'admin') {
    return <Navigate to="/sessions" replace />;
  }

  const [rows, setRows] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create / Edit modal state
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal state
  const [viewingTarget, setViewingTarget] = useState<Course | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((targetPage = page) => {
    setLoading(true);
    setError(null);
    courseMasterService
      .getAllCourses({
        page: targetPage,
        pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(page), 250);
    return () => clearTimeout(t);
  }, [load, page]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm({
      courseRefId: '',
      courseName: '',
      description: '',
      status: 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setMode('edit');
    setEditing(course);
    setForm({
      courseRefId: course.courseRefId || course.id || '',
      courseName: course.courseName || course.name || '',
      description: course.description || '',
      status: course.status || 'draft',
    });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);

    const refId = course.courseRefId || course.id;
    if (refId) {
      courseMasterService
        .getCourse(refId)
        .then((fetched) => {
          if (fetched) {
            setForm({
              courseRefId: fetched.courseRefId || refId,
              courseName: fetched.courseName || fetched.name || course.courseName || '',
              description: fetched.description || '',
              status: fetched.status || course.status || 'draft',
            });
          }
        })
        .catch(() => {
          // Keep existing row values on failure
        });
    }
  };

  const openView = (course: Course) => {
    setViewingTarget(course);
    const refId = course.courseRefId || course.id;
    if (refId) {
      courseMasterService
        .getCourse(refId)
        .then((fetched) => {
          if (fetched) setViewingTarget(fetched);
        })
        .catch(() => {});
    }
  };

  const validateForm = (): string | null => {
    const trimmedName = form.courseName.trim();
    if (!trimmedName) {
      return 'Course Name is required and cannot be empty.';
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
      const isEditMode = mode === 'edit' && Boolean(form.courseRefId || editing?.courseRefId);
      const targetRefId = isEditMode ? (form.courseRefId || editing?.courseRefId || '') : '';

      const payload: CourseCreateInput | CourseUpdateInput = {
        courseRefId: targetRefId || undefined,
        courseName: form.courseName.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      await courseMasterService.createCourse(payload);

      if (isEditMode) {
        setSuccessMessage(`Course "${form.courseName.trim()}" updated successfully.`);
      } else {
        setSuccessMessage(`Course "${form.courseName.trim()}" created successfully.`);
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
    const targetRefId = deleteTarget.courseRefId || deleteTarget.id;
    if (!targetRefId) {
      setError('Unable to delete course: missing courseRefId');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await courseMasterService.deleteCourse({ courseRefId: targetRefId });
      setSuccessMessage(`Course "${deleteTarget.courseName || deleteTarget.name}" deleted successfully.`);
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

  const columns: Column<Course>[] = [
    {
      key: 'courseName',
      header: 'Course Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{c.courseName || c.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {c.courseCode && (
                <span className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                  {c.courseCode}
                </span>
              )}
              {c.courseRefId && (
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500" title={c.courseRefId}>
                  Ref: {c.courseRefId.length > 18 ? `${c.courseRefId.slice(0, 18)}…` : c.courseRefId}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => (
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate" title={c.description || undefined}>
          {c.description ? c.description : <span className="text-gray-400 dark:text-gray-500 italic">—</span>}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusBadge status={c.status || 'draft'} />,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (c) =>
        c.createdAt
          ? new Date(c.createdAt).toLocaleDateString(undefined, {
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
        title="Course Master"
        description="Create, view, edit, and organize curriculum courses."
        action={
          <button onClick={openCreate} className="btn-primary" id="create-course-btn">
            <Plus className="h-4 w-4" /> Create Course
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

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="course-status-filter">
            Status:
          </label>
          <select
            id="course-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-36 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

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
        rowKey={(c) => c.courseRefId || c.id || String(c.courseId)}
        emptyMessage="No courses found."
        actions={(c) => {
          const refId = c.courseRefId || c.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openView(c)}
                className="btn-ghost h-8 w-8 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                title="View Course Details"
                aria-label="View Course Details"
                id={`view-course-${refId}`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(c)}
                className="btn-ghost h-8 w-8 p-0"
                title="Edit Course"
                aria-label="Edit Course"
                id={`edit-course-${refId}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="btn-ghost h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Delete Course"
                aria-label="Delete Course"
                id={`delete-course-${refId}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        }}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'edit' ? 'Edit Course' : 'Create Course'}
        description={
          mode === 'edit' && editing
            ? `Update details for "${editing.courseName || editing.name}".`
            : 'Fill in the course details below to add a new curriculum course.'
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
              id="save-course-btn"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {mode === 'edit' ? 'Save changes' : 'Create Course'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <div>
            <label className="label" htmlFor="course-name">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              id="course-name"
              className="input"
              value={form.courseName}
              onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              required
              placeholder="e.g. Node JS Fundamentals"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="course-description">
              Description
            </label>
            <textarea
              id="course-description"
              className="input min-h-[96px] py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Course overview, syllabus, or learning outcomes..."
              rows={3}
            />
          </div>

          <div>
            <label className="label" htmlFor="course-status">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="course-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={!!viewingTarget}
        onClose={() => setViewingTarget(null)}
        title="Course Details"
        description="Comprehensive information for this course."
        footer={
          <button
            type="button"
            onClick={() => setViewingTarget(null)}
            className="btn-secondary"
          >
            Close
          </button>
        }
      >
        {viewingTarget && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingTarget.courseName || viewingTarget.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {viewingTarget.courseCode && (
                    <span className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {viewingTarget.courseCode}
                    </span>
                  )}
                  <StatusBadge status={viewingTarget.status || 'draft'} />
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Course Reference ID
              </span>
              <p className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-300 select-all">
                {viewingTarget.courseRefId || viewingTarget.id || '—'}
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Description
              </span>
              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {viewingTarget.description || <span className="text-gray-400 italic">No description provided.</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Created At
                </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {viewingTarget.createdAt ? new Date(viewingTarget.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Updated At
                </span>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {viewingTarget.updatedAt ? new Date(viewingTarget.updatedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Course?"
        description={`This will permanently delete "${deleteTarget?.courseName || deleteTarget?.name}". This action cannot be undone.`}
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
              id="confirm-delete-course-btn"
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
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this course?
            </p>
            <p className="mt-1 text-xs">
              Sessions and materials associated with this course may need to be reassigned.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
