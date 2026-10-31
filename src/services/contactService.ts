// src/services/contactService.ts
import { getToken } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100').replace(/\/$/, '');

export interface SubmitEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
  honeypot?: string;
}

export interface EnquirySubmissionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    emailStatus: 'PENDING' | 'SENT' | 'FAILED';
  };
}

export interface EmailLogItem {
  id: number;
  enquiry_id: number;
  recipient_email: string;
  email_type: string;
  attempt_number: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  subject: string;
  provider_message_id: string | null;
  error_message: string | null;
  attempted_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactEnquiryItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  email_status: 'PENDING' | 'SENT' | 'FAILED';
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  emailLogs?: EmailLogItem[];
}

export interface AdminEnquiriesListResponse {
  success: boolean;
  response: {
    data: ContactEnquiryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Submits a new contact/course enquiry (public endpoint).
 */
export async function submitContactEnquiry(
  payload: SubmitEnquiryPayload
): Promise<EnquirySubmissionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/contact-enquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      data?.response?.message ||
      data?.message ||
      `Failed to submit enquiry (${res.status})`;
    throw new Error(errorMsg);
  }

  return data as EnquirySubmissionResponse;
}

/**
 * Admin: List contact enquiries with filters and pagination.
 */
export async function fetchAdminEnquiries(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  email_status?: string;
}): Promise<AdminEnquiriesListResponse> {
  const token = localStorage.getItem('access_token') || getToken();
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.email_status && params.email_status !== 'ALL')
    query.set('email_status', params.email_status);

  const res = await fetch(
    `${API_BASE_URL}/api/admin/contact-enquiries?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.response?.message ||
        data?.message ||
        `Failed to fetch admin enquiries (${res.status})`
    );
  }

  return data as AdminEnquiriesListResponse;
}

/**
 * Admin: Fetch a single enquiry along with its complete email attempt audit logs.
 */
export async function fetchAdminEnquiryById(
  id: number
): Promise<{ success: boolean; response: { data: ContactEnquiryItem } }> {
  const token = localStorage.getItem('access_token') || getToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/contact-enquiries/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.response?.message ||
        data?.message ||
        `Failed to fetch enquiry #${id} (${res.status})`
    );
  }

  return data;
}

/**
 * Admin: Update enquiry status (NEW, IN_PROGRESS, RESOLVED, CLOSED).
 */
export async function updateAdminEnquiryStatus(
  id: number,
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
): Promise<void> {
  const token = localStorage.getItem('access_token') || getToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/contact-enquiries/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.response?.message ||
        data?.message ||
        `Failed to update status for enquiry #${id} (${res.status})`
    );
  }
}

/**
 * Admin: Retry email notification for a failed or eligible enquiry.
 */
export async function retryAdminEnquiryEmail(
  id: number
): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> {
  const token = localStorage.getItem('access_token') || getToken();

  const res = await fetch(
    `${API_BASE_URL}/api/admin/contact-enquiries/${id}/retry-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.response?.message ||
        data?.message ||
        `Failed to retry email notification (${res.status})`
    );
  }

  return data;
}
