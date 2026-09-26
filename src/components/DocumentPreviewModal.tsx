import { useEffect, useState, useMemo } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Table as TableIcon,
  AlignLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export type SupportedDocType = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'txt' | 'unknown';

export interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

export function detectDocType(url?: string | null, name?: string | null, mime?: string | null): SupportedDocType {
  const target = (name || url || '').toLowerCase().split('?')[0];
  const mimeType = (mime || '').toLowerCase();

  if (target.endsWith('.pdf') || mimeType.includes('pdf')) return 'pdf';
  if (target.endsWith('.docx') || mimeType.includes('wordprocessingml')) return 'docx';
  if (target.endsWith('.doc') || mimeType.includes('msword')) return 'doc';
  if (target.endsWith('.xlsx') || mimeType.includes('spreadsheetml')) return 'xlsx';
  if (target.endsWith('.xls') || mimeType.includes('ms-excel')) return 'xls';
  if (target.endsWith('.txt') || mimeType.startsWith('text/plain')) return 'txt';

  return 'unknown';
}

export function getDocTypeBadge(type: SupportedDocType): { label: string; color: string; bg: string } {
  switch (type) {
    case 'pdf':
      return { label: 'PDF Document', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800' };
    case 'docx':
    case 'doc':
      return { label: type === 'docx' ? 'Word (DOCX)' : 'Word (DOC)', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' };
    case 'xlsx':
    case 'xls':
      return { label: type === 'xlsx' ? 'Excel (XLSX)' : 'Excel (XLS)', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' };
    case 'txt':
      return { label: 'Plain Text (TXT)', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' };
    default:
      return { label: 'Document', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' };
  }
}

export default function DocumentPreviewModal({
  open,
  onClose,
  documentUrl,
  fileName,
  fileType,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Viewing states
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Content for parsed document formats
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ name: string; data: (string | number | boolean | null)[][] }[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [wrapText, setWrapText] = useState(true);

  const docType = useMemo(
    () => detectDocType(documentUrl, fileName, fileType),
    [documentUrl, fileName, fileType]
  );

  const displayName = useMemo(() => {
    if (fileName && fileName.trim()) return fileName.trim();
    if (documentUrl) {
      try {
        const u = new URL(documentUrl, 'http://localhost');
        const leaf = u.pathname.split('/').pop();
        if (leaf) return decodeURIComponent(leaf);
      } catch {
        const parts = documentUrl.split('/');
        return decodeURIComponent(parts[parts.length - 1]?.split('?')[0] || 'document');
      }
    }
    return 'Document Preview';
  }, [fileName, documentUrl]);

  // Load and parse content when modal opens or documentUrl changes
  useEffect(() => {
    if (!open || !documentUrl) {
      setLoading(false);
      setError(null);
      setHtmlContent(null);
      setTextContent(null);
      setSheets([]);
      setZoom(100);
      return;
    }

    setLoading(true);
    setError(null);
    setHtmlContent(null);
    setTextContent(null);
    setSheets([]);
    setActiveSheetIdx(0);
    setZoom(100);

    // If PDF, browser native iframe handles rendering directly
    if (docType === 'pdf') {
      setLoading(false);
      return;
    }

    // For TXT: fetch text
    if (docType === 'txt') {
      fetch(documentUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status} loading document`);
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch text document content');
        })
        .finally(() => setLoading(false));
      return;
    }

    // For Word (DOCX): convert using mammoth
    if (docType === 'docx') {
      fetch(documentUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status} loading document`);
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => mammoth.convertToHtml({ arrayBuffer }))
        .then((result) => {
          setHtmlContent(result.value || '<p class="italic text-gray-400">Empty document</p>');
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? `Unable to parse Word document: ${err.message}`
              : 'Failed to parse Word document'
          );
        })
        .finally(() => setLoading(false));
      return;
    }

    // For legacy Word (.doc): try reading text or show preview container
    if (docType === 'doc') {
      fetch(documentUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status} loading document`);
          return res.text();
        })
        .then((raw) => {
          const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 30) {
            setTextContent(cleaned);
          } else {
            setHtmlContent(
              '<div class="p-6 text-center text-gray-500"><p class="font-medium text-gray-800 dark:text-gray-200">Legacy Binary Word Document (.doc)</p><p class="text-sm mt-1">This document is formatted in Microsoft Word 97-2003 binary format. Previewing text summary.</p></div>'
            );
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Unable to preview .doc file');
        })
        .finally(() => setLoading(false));
      return;
    }

    // For Excel (XLSX / XLS): parse using xlsx
    if (docType === 'xlsx' || docType === 'xls') {
      fetch(documentUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status} loading document`);
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const loadedSheets: { name: string; data: (string | number | boolean | null)[][] }[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            if (worksheet) {
              const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
                header: 1,
                defval: '',
              });
              loadedSheets.push({ name: sheetName, data: rows });
            }
          });

          if (loadedSheets.length === 0) {
            loadedSheets.push({ name: 'Sheet1', data: [['(Empty spreadsheet)']] });
          }

          setSheets(loadedSheets);
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? `Unable to parse Excel workbook: ${err.message}`
              : 'Failed to parse Excel workbook'
          );
        })
        .finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, [open, documentUrl, docType]);

  const badge = getDocTypeBadge(docType);

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(200, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(60, prev - 15));
  const handleResetZoom = () => setZoom(100);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200 ${
          fullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[88vh] max-h-[920px]'
        }`}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              {docType === 'xlsx' || docType === 'xls' ? (
                <FileSpreadsheet className="h-5 w-5" />
              ) : docType === 'txt' ? (
                <AlignLeft className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate" title={displayName}>
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${badge.bg} ${badge.color}`}
                >
                  {badge.label}
                </span>
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
                    title="Open document URL in new tab"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons & zoom controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom controls for PDF / Doc / Text */}
            <div className="hidden sm:flex items-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-1 py-0.5 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 60}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-gray-600 font-mono text-[11px] hover:text-brand-600 dark:text-gray-300"
                title="Reset Zoom"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-40"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* TXT Copy button */}
            {docType === 'txt' && textContent && (
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Copy file text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Toggle Fullscreen */}
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors ml-1"
              title="Close Preview"
              aria-label="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 relative flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                Loading document preview...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="m-6 p-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <h4 className="text-base font-semibold text-red-900 dark:text-red-200">
                Preview Unavailable
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1 max-w-md mx-auto">
                {error}
              </p>
              {documentUrl && (
                <div className="mt-4 flex justify-center gap-3">
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary inline-flex items-center gap-2 text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {!error && !loading && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* PDF Viewer */}
              {docType === 'pdf' && documentUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-auto">
                  <div
                    className="w-full h-full max-w-5xl rounded-lg overflow-hidden shadow-lg border border-gray-300 dark:border-gray-800 bg-white"
                    style={{
                      transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <iframe
                      src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      title={displayName}
                      className="w-full h-full min-h-[600px] border-0"
                    />
                  </div>
                </div>
              )}

              {/* DOCX HTML viewer */}
              {docType === 'docx' && htmlContent && (
                <div className="w-full h-full p-4 sm:p-8 overflow-auto flex justify-center">
                  <div
                    className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 sm:p-12 prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
                    style={{
                      fontSize: `${zoom}%`,
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              )}

              {/* DOC / Fallback viewer */}
              {docType === 'doc' && (
                <div className="w-full h-full p-6 sm:p-8 overflow-auto flex flex-col items-center">
                  {htmlContent && (
                    <div
                      className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 mb-4"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  )}
                  {textContent && (
                    <div
                      className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200"
                      style={{ fontSize: `${zoom}%` }}
                    >
                      {textContent}
                    </div>
                  )}
                </div>
              )}

              {/* Excel (XLSX / XLS) spreadsheet viewer */}
              {(docType === 'xlsx' || docType === 'xls') && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  {/* Sheet tabs bar */}
                  {sheets.length > 1 && (
                    <div className="flex items-center gap-1 px-4 py-2 bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800 overflow-x-auto shrink-0">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2 flex items-center gap-1">
                        <TableIcon className="h-3.5 w-3.5" /> Sheets:
                      </span>
                      {sheets.map((s, idx) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setActiveSheetIdx(idx)}
                          className={`px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-colors shrink-0 ${
                            activeSheetIdx === idx
                              ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-300 border-brand-500 shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-950/60 text-gray-600 dark:text-gray-400 border-transparent hover:bg-white/60'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid table */}
                  <div className="flex-1 overflow-auto p-4">
                    {sheets[activeSheetIdx]?.data?.length ? (
                      <div className="inline-block min-w-full align-middle shadow rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        <table
                          className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs text-left"
                          style={{ fontSize: `${zoom}%` }}
                        >
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-sans">
                            {sheets[activeSheetIdx].data.map((row, rowIdx) => {
                              const isHeaderRow = rowIdx === 0;
                              return (
                                <tr
                                  key={rowIdx}
                                  className={
                                    isHeaderRow
                                      ? 'bg-gray-50 dark:bg-gray-800/80 font-semibold text-gray-900 dark:text-white'
                                      : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                                  }
                                >
                                  {/* Row index indicator */}
                                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-950/60 border-r border-gray-200 dark:border-gray-800 select-none w-10">
                                    {rowIdx + 1}
                                  </td>
                                  {row.map((cell, colIdx) => (
                                    <td
                                      key={colIdx}
                                      className="px-3 py-1.5 border-r border-gray-100 dark:border-gray-800/60 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                                      title={String(cell ?? '')}
                                    >
                                      {cell !== null && cell !== undefined && String(cell).trim() !== '' ? (
                                        String(cell)
                                      ) : (
                                        <span className="text-gray-300 dark:text-gray-700 select-none">·</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">Sheet is empty.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TXT plain text viewer */}
              {docType === 'txt' && (
                <div className="w-full h-full flex flex-col p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {textContent ? `${textContent.split('\n').length} lines` : '0 lines'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWrapText(!wrapText)}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {wrapText ? 'Disable wrap' : 'Enable wrap'}
                    </button>
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-inner border border-gray-200 dark:border-gray-800 overflow-auto p-4 font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                    <pre
                      className={`font-mono text-xs sm:text-sm m-0 ${
                        wrapText ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                      }`}
                      style={{ fontSize: `${zoom}%` }}
                    >
                      {textContent || '(Empty text file)'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Fallback for unrecognized types */}
              {docType === 'unknown' && (
                <div className="m-8 p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-lg mx-auto">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Preview Not Available
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Direct browser preview is available for PDF, Word, Excel, and Plain Text files.
                  </p>
                  {documentUrl && (
                    <div className="mt-4">
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary inline-flex items-center gap-2 text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Document Link</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info & close */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 text-xs text-gray-500 shrink-0">
          <div className="truncate max-w-md">
            {documentUrl && (
              <span className="font-mono text-[11px] truncate opacity-70">
                Source: {documentUrl}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs px-3 py-1.5"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
