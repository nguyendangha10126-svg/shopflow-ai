import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

interface FaqDocumentItem {
  id: string;
  title: string;
  content_type: string;
  raw_text: string;
  is_active: boolean;
  created_at: string;
  _count?: {
    chunks: number;
  };
}

interface FaqAnswerData {
  answer: string;
  sources: Array<{
    document_id: string;
    document_title: string;
    snippet: string;
    relevance_score: number;
  }>;
  telemetry: {
    model: string;
    latency_ms: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
  };
}

export const FaqPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'ASK_AI'>('DOCUMENTS');
  const [documents, setDocuments] = useState<FaqDocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Modal Thêm / Sửa tài liệu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('POLICIES');
  const [docRawText, setDocRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Hộp thoại RAG Ask AI
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerData, setAnswerData] = useState<FaqAnswerData | null>(null);
  const [queryError, setQueryError] = useState('');

  // 1. Tải danh sách tài liệu
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const response = await apiClient.get<{ data: FaqDocumentItem[] }>('/faq/documents');
      setDocuments(response.data);
    } catch {
      showToast('Không thể tải danh sách tài liệu chính sách', 'error');
    } finally {
      setIsLoadingDocs(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // 2. Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingDocId(null);
    setDocTitle('');
    setDocType('POLICIES');
    setDocRawText('');
    setFormError('');
    setIsModalOpen(true);
  };

  // 3. Mở modal sửa
  const handleOpenEditModal = (doc: FaqDocumentItem) => {
    setEditingDocId(doc.id);
    setDocTitle(doc.title);
    setDocType(doc.content_type);
    setDocRawText(doc.raw_text);
    setFormError('');
    setIsModalOpen(true);
  };

  // 4. Lưu tài liệu (Tạo mới hoặc Cập nhật)
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!docTitle.trim() || docTitle.trim().length < 2) {
      setFormError('Tiêu đề tài liệu phải có ít nhất 2 ký tự');
      return;
    }
    if (!docRawText.trim() || docRawText.trim().length < 10) {
      setFormError('Nội dung tài liệu chính sách phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDocId) {
        await apiClient.put(`/faq/documents/${editingDocId}`, {
          title: docTitle.trim(),
          content_type: docType,
          raw_text: docRawText.trim(),
        });
        showToast('Đã cập nhật tài liệu chính sách thành công!', 'success');
      } else {
        await apiClient.post('/faq/documents', {
          title: docTitle.trim(),
          content_type: docType,
          raw_text: docRawText.trim(),
        });
        showToast('Đã thêm tài liệu chính sách mới (Đã tự động cắt chunks)!', 'success');
      }

      setIsModalOpen(false);
      fetchDocuments();
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Lỗi khi lưu tài liệu chính sách');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Xóa tài liệu
  const handleDeleteDocument = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu chính sách "${title}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/faq/documents/${id}`);
      showToast(`Đã xóa tài liệu "${title}"`, 'success');
      fetchDocuments();
    } catch {
      showToast('Không thể xóa tài liệu', 'error');
    }
  };

  // 6. Nạp 3 tài liệu mẫu 1-Click
  const handleSeedSamples = async () => {
    try {
      await apiClient.post('/faq/seed-samples', {});
      showToast('Đã nạp thành công 3 bộ chính sách mẫu tiếng Việt!', 'success');
      fetchDocuments();
    } catch {
      showToast('Lỗi khi nạp dữ liệu mẫu', 'error');
    }
  };

  // 7. Hỏi AI Tư Vấn (RAG Query)
  const handleAskAi = async (customQuestion?: string) => {
    const q = (customQuestion || question).trim();
    if (!q) {
      setQueryError('Vui lòng nhập câu hỏi của khách hàng');
      return;
    }

    setQuestion(q);
    setIsAnswering(true);
    setQueryError('');
    setAnswerData(null);

    try {
      const response = await apiClient.post<{ data: FaqAnswerData }>('/ai/faq-query', {
        question: q,
      });
      setAnswerData(response.data);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setQueryError(err.message);
      } else {
        setQueryError('Không thể lấy câu trả lời từ AI. Vui lòng thử lại.');
      }
    } finally {
      setIsAnswering(false);
    }
  };

  // 8. Sao chép câu trả lời
  const handleCopyAnswer = async () => {
    if (!answerData?.answer) return;
    try {
      await navigator.clipboard.writeText(answerData.answer);
      showToast('Đã sao chép câu trả lời vào Clipboard!', 'success');
    } catch {
      showToast('Không thể sao chép tự động', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>📚 Tư Vấn Chính Sách Shop (RAG FAQ)</span>
            <Badge variant="system" size="sm">
              Trích dẫn nguồn
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý cơ sở tri thức chính sách shop và hỏi đáp tự động với AI có trích dẫn nguồn xác thực
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'DOCUMENTS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📚 Tài liệu chính sách ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ASK_AI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              activeTab === 'ASK_AI'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>💬 Hộp thoại thử nghiệm RAG</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: QUẢN LÝ TÀI LIỆU CHÍNH SÁCH */}
      {/* ============================================================== */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Văn bản chính sách sẽ được hệ thống tự động cắt thành các <b>chunks ngữ nghĩa</b> để tìm kiếm
              khi khách hỏi.
            </p>
            <div className="flex items-center space-x-2">
              {documents.length === 0 && (
                <Button variant="outline" size="sm" onClick={handleSeedSamples}>
                  ⚡ Nạp 3 chính sách mẫu
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                + Thêm tài liệu mới
              </Button>
            </div>
          </div>

          {isLoadingDocs ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Chưa có tài liệu chính sách nào"
              description="Hãy thêm các quy định đổi trả, phí ship, thời gian giao hàng và bảng size để trợ lý AI có dữ liệu trả lời khách."
              actionText="⚡ Nạp nhanh 3 chính sách mẫu"
              onAction={handleSeedSamples}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:border-indigo-200 dark:hover:border-indigo-800 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {doc.title}
                      </h3>
                      <Badge variant="system" size="sm">
                        {doc.content_type}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {doc.raw_text}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      ✂️ {doc._count?.chunks ?? 1} chunks ngữ nghĩa
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(doc)}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-rose-500 hover:underline font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: HỘP THOẠI THỬ NGHIỆM RAG (ASK AI) */}
      {/* ============================================================== */}
      {activeTab === 'ASK_AI' && (
        <div className="space-y-6">
          <Card className="space-y-4 border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/20">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>💬 Thử Nghiệm Trợ Lý Tư Vấn FAQ (RAG)</span>
                <Badge variant="ai" size="sm">
                  Chống bịa đặt
                </Badge>
              </h2>
              <p className="text-xs text-slate-500">
                Nhập câu hỏi của khách hàng để xem AI trích xuất tài liệu chính sách và trả lời có trích dẫn nguồn
              </p>
            </div>

            {/* Gợi ý câu hỏi mẫu */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Câu hỏi gợi ý nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Shop có cho đổi size không và trong bao lâu?',
                  'Phí ship về các tỉnh là bao nhiêu?',
                  'Đơn từ bao nhiêu tiền thì được freeship?',
                  'Mình cao 1m58 nặng 50kg mặc size gì vừa?',
                  'Khách có được kiểm tra hàng trước khi nhận không?',
                ].map((sampleQ, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskAi(sampleQ)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                  >
                    👉 {sampleQ}
                  </button>
                ))}
              </div>
            </div>

            {/* Ô nhập câu hỏi */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label=""
                  placeholder="Nhập câu hỏi của khách... (VD: Khách hỏi bao lâu thì nhận được hàng ở Hà Nội?)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isAnswering && handleAskAi()}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleAskAi()}
                isLoading={isAnswering}
                className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
              >
                🚀 Hỏi AI
              </Button>
            </div>

            {queryError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 rounded-lg">
                ⚠️ {queryError}
              </div>
            )}
          </Card>

          {/* Khung Hiển Thị Câu Trả Lời & Nguồn Trích Dẫn */}
          {isAnswering ? (
            <Card className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="animate-spin text-purple-600">⚡</span>
                <span className="text-xs font-bold text-slate-600">
                  Đang tìm kiếm chính sách và sinh câu trả lời RAG...
                </span>
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </Card>
          ) : answerData ? (
            <Card className="space-y-4 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🤖</span>
                  <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Câu trả lời tư vấn cho khách:
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAnswer}
                  className="text-xs h-7 py-0.5"
                >
                  📋 Sao chép câu trả lời
                </Button>
              </div>

              {/* Nội dung câu trả lời */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                {answerData.answer}
              </div>

              {/* KHỐI NGUỒN TRÍCH DẪN (SOURCES CITATION) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                  <span>📖 Nguồn tài liệu được AI đối chiếu ({answerData.sources.length}):</span>
                </span>

                {answerData.sources.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Không tìm thấy tài liệu phù hợp trong cơ sở tri thức shop.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {answerData.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">
                            📌 {src.document_title}
                          </span>
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            {Math.round(src.relevance_score * 100)}% Độ liên quan
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 italic text-[11px] line-clamp-2">
                          "{src.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Telemetry */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Model: <b>{answerData.telemetry.model}</b></span>
                <span>Độ trễ: <b>{answerData.telemetry.latency_ms} ms</b></span>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {/* 3. MODAL: Thêm / Sửa Tài Liệu Chính Sách */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingDocId ? 'Cập Nhật Tài Liệu Chính Sách' : 'Thêm Tài Liệu Chính Sách Mới'}
      >
        <form onSubmit={handleSaveDocument} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 rounded-lg">
              ⚠️ {formError}
            </div>
          )}

          <Input
            label="Tiêu đề tài liệu chính sách"
            placeholder="VD: Chính sách đổi trả & đổi size trong 7 ngày"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Phân loại chính sách
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="POLICIES">Chính sách đổi trả & hoàn tiền</option>
              <option value="SHIPPING">Chính sách vận chuyển & phí giao hàng</option>
              <option value="SIZE_GUIDE">Hướng dẫn chọn size (Bảng size chuẩn)</option>
              <option value="GENERAL">Chính sách chung khác</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nội dung chính sách chi tiết (Tối đa 10.000 ký tự)
            </label>
            <textarea
              rows={6}
              value={docRawText}
              onChange={(e) => setDocRawText(e.target.value)}
              placeholder="Nhập nội dung quy định của shop... Hệ thống sẽ tự động cắt nhỏ thành các chunks để đối chiếu ngữ cảnh khi khách hỏi."
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400">
              Ước tính: Khoảng <b>{Math.max(1, Math.ceil(docRawText.length / 400))}</b> chunks ngữ nghĩa.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingDocId ? 'Cập Nhật' : 'Lưu & Cắt Chunks'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FaqPage;
