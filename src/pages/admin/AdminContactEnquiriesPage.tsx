// src/pages/admin/AdminContactEnquiriesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  fetchAdminEnquiries,
  fetchAdminEnquiryById,
  updateAdminEnquiryStatus,
  retryAdminEnquiryEmail,
  ContactEnquiryItem,
} from '@/services/contactService';

export default function AdminContactEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<ContactEnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emailStatusFilter, setEmailStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected enquiry for detail modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminEnquiries({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter,
        email_status: emailStatusFilter,
      });

      setEnquiries(res.response.data || []);
      setTotalPages(res.response.pagination.totalPages || 1);
      setTotalCount(res.response.pagination.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, emailStatusFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // Open detail modal and fetch full attempt history
  const handleViewDetails = async (id: number) => {
    setDetailLoading(true);
    setActionSuccess(null);
    try {
      const res = await fetchAdminEnquiryById(id);
      setSelectedEnquiry(res.response.data);
    } catch (err: any) {
      alert(`Could not fetch details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  // Status update
  const handleStatusChange = async (
    id: number,
    newStatus: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  ) => {
    setActionLoading(true);
    setActionSuccess(null);
    try {
      await updateAdminEnquiryStatus(id, newStatus);
      setActionSuccess(`Status updated to ${newStatus}`);

      // Update local state
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Retry email notification
  const handleRetryEmail = async (id: number) => {
    if (!confirm('Queue a retry notification for this enquiry?')) return;

    setActionLoading(true);
    setActionSuccess(null);
    try {
      const res = await retryAdminEnquiryEmail(id);
      setActionSuccess(res.message || 'Email retry notification queued (202 Accepted).');

      // Refresh single enquiry details to update audit log
      const updated = await fetchAdminEnquiryById(id);
      setSelectedEnquiry(updated.response.data);
      // Refresh list
      loadEnquiries();
    } catch (err: any) {
      alert(err.message || 'Retry failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            NEW
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            CLOSED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            SENT
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            <XCircle className="h-3 w-3" />
            FAILED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Website Contact Enquiries
            </h1>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage visitor enquiries, review BullMQ asynchronous email notifications, and trigger retries.
          </p>
        </div>

        <button
          onClick={() => loadEnquiries()}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-12 dark:border-gray-800 dark:bg-gray-900">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, or subject..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">All Workflow Statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {/* Email Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={emailStatusFilter}
            onChange={(e) => {
              setEmailStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">All Email Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="py-3.5 pl-6 pr-3">Ref ID</th>
                <th className="px-3 py-3.5">Visitor</th>
                <th className="px-3 py-3.5">Course / Subject</th>
                <th className="px-3 py-3.5">Submitted At</th>
                <th className="px-3 py-3.5">Enquiry Status</th>
                <th className="px-3 py-3.5">Admin Email Status</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    <span>Loading contact enquiries...</span>
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      No enquiries match your search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-4 pl-6 pr-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                      #{item.id}
                    </td>

                    <td className="px-3 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span>{item.email}</span>
                      </div>
                      {item.phone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-4 max-w-xs">
                      <div className="truncate font-medium text-gray-800 dark:text-gray-200">
                        {item.subject || 'General Enquiry'}
                      </div>
                      <div className="truncate text-xs text-gray-400 mt-0.5">
                        {item.message}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getEmailStatusBadge(item.email_status)}
                    </td>

                    <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(item.id)}
                        disabled={detailLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-3.5 w-3.5 text-brand-600" />
                        <span>{detailLoading ? 'Loading...' : 'View Log'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details & Audit Trail Modal */}
      {selectedEnquiry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
            onClick={() => setSelectedEnquiry(null)}
          />

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  ENQUIRY #{selectedEnquiry.id}
                </span>
                <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {selectedEnquiry.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Info Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <span className="text-gray-400 font-medium">Email Address</span>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedEnquiry.email}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <span className="text-gray-400 font-medium">Phone Number</span>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedEnquiry.phone || 'Not provided'}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <span className="text-gray-400 font-medium">Course / Subject</span>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedEnquiry.subject || 'General Enquiry'}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <span className="text-gray-400 font-medium">Source URL</span>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedEnquiry.source || 'Direct Popup'}
                </p>
              </div>
            </div>

            {/* Message Box */}
            <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-800/30">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Visitor Inquiry Message
              </span>
              <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {selectedEnquiry.message}
              </p>
            </div>

            {/* Workflow Status Modifier */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-brand-50/50 p-4 dark:bg-brand-950/20">
              <div>
                <p className="text-xs font-bold text-brand-900 dark:text-brand-300">
                  Update Workflow Status
                </p>
                <p className="text-xs text-brand-700/80 dark:text-brand-400/80">
                  Current Status: {selectedEnquiry.status}
                </p>
              </div>

              <select
                value={selectedEnquiry.status}
                disabled={actionLoading}
                onChange={(e) =>
                  handleStatusChange(
                    selectedEnquiry.id,
                    e.target.value as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
                  )
                }
                className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 focus:outline-none dark:border-brand-800 dark:bg-gray-800 dark:text-brand-300"
              >
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* BullMQ Email Audit Trail */}
            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand-600" />
                    <span>Email Notification Audit Trail</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    BullMQ delivery attempt logs and SMTP transport responses.
                  </p>
                </div>

                {selectedEnquiry.email_status !== 'SENT' && (
                  <button
                    onClick={() => handleRetryEmail(selectedEnquiry.id)}
                    disabled={actionLoading || selectedEnquiry.email_status === 'PENDING'}
                    className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Retry Email Notification</span>
                  </button>
                )}
              </div>

              {/* Attempt list */}
              <div className="mt-4 space-y-3">
                {!selectedEnquiry.emailLogs || selectedEnquiry.emailLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No attempt logs recorded yet.</p>
                ) : (
                  selectedEnquiry.emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-gray-200 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">
                            Attempt #{log.attempt_number}
                          </span>
                          {getEmailStatusBadge(log.status)}
                        </div>
                        <span className="text-gray-400 text-[11px]">
                          {new Date(log.attempted_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-gray-500 space-y-1">
                        <div>
                          Recipient: <span className="font-mono text-gray-700 dark:text-gray-300">{log.recipient_email}</span>
                        </div>
                        {log.provider_message_id && (
                          <div>
                            Message ID: <span className="font-mono text-gray-700 dark:text-gray-300">{log.provider_message_id}</span>
                          </div>
                        )}
                        {log.sent_at && (
                          <div className="text-emerald-600 dark:text-emerald-400">
                            Accepted by SMTP Transport at: {new Date(log.sent_at).toLocaleString()}
                          </div>
                        )}
                        {log.error_message && (
                          <div className="text-red-600 dark:text-red-400 font-mono">
                            Error: {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="btn-secondary px-5 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
