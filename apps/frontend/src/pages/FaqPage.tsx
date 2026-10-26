import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Send,
  ThumbsUp,
  ThumbsDown,
  Quote,
  AlertTriangle,
  RotateCcw,
  FileText
} from 'lucide-react';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatRelativeTime } from '../utils/format';

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

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  answerData?: FaqAnswerData;
  timestamp: string;
}

export const FaqPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'ASK_AI'>('DOCUMENTS');
  const [documents, setDocuments] = useState<FaqDocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Modal Thêm / Sửa tài liệu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('POLICIES');
  const [docRawText, setDocRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Hộp thoại Chat Thử hỏi như khách
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});

  // 1. Tải danh sách tài liệu
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    setDocsError(null);
    try {
      const response = await apiClient.get<{ data: FaqDocumentItem[] }>('/faq/documents');
      setDocuments(response.data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const msg = err?.message || 'Không thể tải danh sách tài liệu chính sách';
      setDocsError(msg);
      showToast(msg, 'error');
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

  // 4. Lưu tài liệu
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!docTitle.trim() || docTitle.trim().length < 2) {
      setFormError('Tiêu đề chính sách phải có ít nhất 2 ký tự');
      return;
    }
    if (!docRawText.trim() || docRawText.trim().length < 10) {
      setFormError('Nội dung chính sách phải có ít nhất 10 ký tự');
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
        showToast('Đã cập nhật chính sách thành công!', 'success');
      } else {
        await apiClient.post('/faq/documents', {
          title: docTitle.trim(),
          content_type: docType,
          raw_text: docRawText.trim(),
        });
        showToast('Đã thêm chính sách mới thành công!', 'success');
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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chính sách "${title}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/faq/documents/${id}`);
      showToast(`Đã xóa chính sách "${title}"`, 'success');
      fetchDocuments();
    } catch {
      showToast('Không thể xóa chính sách', 'error');
    }
  };

  // 6. Nạp 3 tài liệu mẫu
  const handleSeedSamples = async () => {
    try {
      await apiClient.post('/faq/seed-samples', {});
      showToast('Đã nạp 3 chính sách mẫu của shop thành công!', 'success');
      fetchDocuments();
    } catch {
      showToast('Lỗi khi nạp dữ liệu mẫu', 'error');
    }
  };

  // 7. Hỏi AI trong khung chat
  const handleSendQuestion = async (customQ?: string) => {
    const q = (customQ || inputQuestion).trim();
    if (!q) return;

    const userMsgId = `user_${Date.now()}`;
    const newChat: ChatMessage[] = [
      ...chatMessages,
      {
        id: userMsgId,
        sender: 'user',
        text: q,
        timestamp: new Date().toISOString(),
      },
    ];
    setChatMessages(newChat);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const response = await apiClient.post<{ data: FaqAnswerData }>('/ai/faq-query', {
        question: q,
      });

      const aiMsgId = `ai_${Date.now()}`;
      setChatMessages([
        ...newChat,
        {
          id: aiMsgId,
          sender: 'ai',
          text: response.data.answer,
          answerData: response.data,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      showToast('Trợ lý AI tạm thời bận, vui lòng thử lại', 'error');
    } finally {
      setIsAsking(false);
    }
  };

  // 8. Sao chép câu trả lời gửi khách
  const handleCopy = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      showToast('Đã sao chép câu trả lời để gửi khách!', 'success');
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      showToast('Không thể sao chép văn bản', 'error');
    }
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackState((prev) => ({ ...prev, [msgId]: type }));
    showToast(
      type === 'up' ? 'Cảm ơn bạn đã đánh giá hữu ích!' : 'Cảm ơn góp ý, hệ thống sẽ học hỏi để cải thiện',
      'success'
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'POLICIES':
        return 'Đổi trả & Hoàn tiền';
      case 'SHIPPING':
        return 'Giao hàng & Phí ship';
      case 'SIZE_GUIDE':
        return 'Bảng size chuẩn';
      default:
        return 'Chính sách chung';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Trang & Tab chuyển đổi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Chính Sách & Trả Lời Khách</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý quy định của shop và thử nghiệm trợ lý AI trả lời khách có đối chiếu nguồn tin
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'DOCUMENTS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tài liệu chính sách ({documents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ASK_AI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'ASK_AI'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thử hỏi như khách</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: TÀI LIỆU CHÍNH SÁCH CỦA SHOP */}
      {/* ============================================================== */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Trợ lý AI sẽ đọc và đối chiếu các chính sách này khi trả lời thắc mắc của khách mua hàng.
            </p>
            <div className="flex items-center space-x-2">
              {documents.length === 0 && (
                <Button variant="outline" size="sm" onClick={handleSeedSamples}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Nạp 3 chính sách mẫu
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm chính sách mới
              </Button>
            </div>
          </div>

          {isLoadingDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : docsError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30"
            >
              <AlertTriangle className="h-8 w-8 text-rose-500" />
              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-300">
                  Chưa tải được danh sách chính sách
                </p>
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{docsError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDocuments}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Thử lại
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Chưa có tài liệu chính sách nào"
              description="Hãy thêm các quy định đổi trả, phí ship, thời gian giao hàng và bảng size để trợ lý AI có dữ liệu trả lời khách."
              actionText="Nạp nhanh 3 chính sách mẫu"
              onAction={handleSeedSamples}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{doc.title}</span>
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                        {getTypeLabel(doc.content_type)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {doc.raw_text}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {doc.raw_text.length.toLocaleString('vi-VN')} ký tự • {formatRelativeTime(doc.created_at)}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(doc)}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium text-xs transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
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
      {/* TAB 2: THỬ HỎI NHƯ KHÁCH (CHAT SIMULATOR) */}
      {/* ============================================================== */}
      {activeTab === 'ASK_AI' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/20 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Trợ Lý Trả Lời Khách Tự Động</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  Đối chiếu chính sách
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô phỏng câu hỏi khách nhắn shop trên Zalo/Messenger để kiểm tra câu trả lời của AI
              </p>
            </div>

            {/* Câu hỏi gợi ý 1 chạm */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                Câu hỏi thường gặp (bấm để hỏi ngay):
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
                    onClick={() => handleSendQuestion(sampleQ)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                  >
                    {sampleQ}
                  </button>
                ))}
              </div>
            </div>

            {/* Khung chat hiển thị hội thoại */}
            <div className="min-h-[220px] max-h-[420px] overflow-y-auto space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs space-y-1">
                  <MessageSquare className="w-8 h-8 opacity-40 mx-auto mb-2 text-indigo-500" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">
                    Chưa có tin nhắn nào
                  </p>
                  <p>Hãy chọn câu hỏi gợi ý bên trên hoặc nhập thắc mắc của khách vào ô bên dưới</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Bong bóng tin nhắn */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-sm space-y-3'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Trích dẫn nguồn nếu là câu trả lời của AI */}
                      {msg.answerData && msg.answerData.sources.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Quote className="w-3 h-3 text-indigo-600" /> Căn cứ theo chính sách:
                          </span>
                          <div className="space-y-1">
                            {msg.answerData.sources.map((src, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300"
                              >
                                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                                  {src.document_title}:
                                </span>{' '}
                                <span className="italic">"{src.snippet}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Thao tác trên câu trả lời AI */}
                      {msg.sender === 'ai' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Sao chép gửi khách</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px]">Hữu ích?</span>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                feedbackState[msg.id] === 'up' ? 'text-emerald-600' : ''
                              }`}
                              title="Hữu ích"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                feedbackState[msg.id] === 'down' ? 'text-rose-600' : ''
                              }`}
                              title="Chưa đúng ý"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.sender === 'user' ? 'Khách hỏi' : 'ShopFlow AI'}
                    </span>
                  </div>
                ))
              )}

              {isAsking && (
                <div className="flex items-start gap-2">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 rounded-bl-none shadow-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                    <span>Đang đối chiếu chính sách shop...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ô nhập câu hỏi gửi đi */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập câu hỏi của khách hàng... (Nhấn Enter để gửi)"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAsking && handleSendQuestion()}
                className="flex-1 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => handleSendQuestion()}
                isLoading={isAsking}
                className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap shadow-sm"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Hỏi AI
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 3. MODAL: Thêm / Sửa Tài Liệu Chính Sách */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingDocId ? 'Cập Nhật Chính Sách Cửa Hàng' : 'Thêm Chính Sách Mới'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveDocument} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Tiêu đề chính sách"
            placeholder="VD: Chính sách đổi trả & đổi size trong 7 ngày"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Nội dung chính sách chi tiết (Tối đa 10.000 ký tự)
            </label>
            <textarea
              rows={6}
              value={docRawText}
              onChange={(e) => setDocRawText(e.target.value)}
              placeholder="Nhập nội dung quy định của shop để trợ lý AI tham chiếu trả lời khách..."
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400">
              Độ dài hiện tại: <b>{docRawText.length.toLocaleString('vi-VN')}</b> ký tự.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingDocId ? 'Cập Nhật Chính Sách' : 'Lưu Chính Sách'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FaqPage;
