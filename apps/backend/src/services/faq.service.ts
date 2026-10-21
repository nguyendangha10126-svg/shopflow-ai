import { prisma } from '../db';
import { logger } from '../core/logger';
import { NotFoundError } from '../core/errors/app-error';
import { CreateFaqDocumentDto, UpdateFaqDocumentDto } from '../api/validators/faq.validator';
import { AIService } from './ai.service';
import { env } from '../config/env';

export interface RelevantChunkResult {
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  relevance_score: number;
}

export interface FaqAnswerResult {
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

export class FaqService {
  // Bộ nhớ đệm dự phòng chính sách khi CSDL offline hoặc môi trường dev demo
  private static demoDocuments: any[] = [
    {
      id: 'faq-doc-001',
      shop_id: '00000000-0000-0000-0000-000000000002',
      title: 'Chính sách đổi trả sản phẩm trong 7 ngày',
      content_type: 'POLICIES',
      raw_text:
        'Shop hỗ trợ đổi size, đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên tem mác, chưa qua giặt ủi và không có mùi lạ. Khách hàng chịu phí ship đổi 2 chiều hoặc mang trực tiếp qua cửa hàng tại 15 Hoàng Hoa Thám, Ba Đình, Hà Nội.',
      is_active: true,
      created_at: new Date('2026-10-15T08:00:00Z'),
      _count: { chunks: 1 },
      chunks: [
        {
          id: 'chunk-001',
          document_id: 'faq-doc-001',
          chunk_index: 0,
          content:
            'Shop hỗ trợ đổi size, đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên tem mác, chưa qua giặt ủi và không có mùi lạ. Khách hàng chịu phí ship đổi 2 chiều hoặc mang trực tiếp qua cửa hàng tại 15 Hoàng Hoa Thám, Ba Đình, Hà Nội.',
        },
      ],
    },
    {
      id: 'faq-doc-002',
      shop_id: '00000000-0000-0000-0000-000000000002',
      title: 'Chính sách giao hàng & Phí vận chuyển',
      content_type: 'POLICIES',
      raw_text:
        'Nội thành Hà Nội: Giao hỏa tốc 2-4 giờ (phí 30.000đ - 45.000đ tùy quận) hoặc giao tiêu chuẩn 24 giờ (phí 25.000đ). Ngoại thành và các tỉnh thành khác: Giao qua GHTK hoặc Viettel Post từ 2-3 ngày làm việc (phí 30.000đ - 35.000đ). Đơn hàng từ 500.000đ được FREESHIP toàn quốc.',
      is_active: true,
      created_at: new Date('2026-10-16T09:30:00Z'),
      _count: { chunks: 1 },
      chunks: [
        {
          id: 'chunk-002',
          document_id: 'faq-doc-002',
          chunk_index: 0,
          content:
            'Nội thành Hà Nội: Giao hỏa tốc 2-4 giờ (phí 30.000đ - 45.000đ tùy quận) hoặc giao tiêu chuẩn 24 giờ (phí 25.000đ). Ngoại thành và các tỉnh thành khác: Giao qua GHTK hoặc Viettel Post từ 2-3 ngày làm việc (phí 30.000đ - 35.000đ). Đơn hàng từ 500.000đ được FREESHIP toàn quốc.',
        },
      ],
    },
    {
      id: 'faq-doc-003',
      shop_id: '00000000-0000-0000-0000-000000000002',
      title: 'Chính sách kiểm hàng & Thanh toán',
      content_type: 'POLICIES',
      raw_text:
        'Shop hỗ trợ hình thức thanh toán khi nhận hàng (COD) hoặc chuyển khoản qua ngân hàng Vietcombank/MB Bank. Khách hàng được quyền kiểm tra hàng trước khi thanh toán. Bảo hành đường may và nút cúc trọn đời miễn phí.',
      is_active: true,
      created_at: new Date('2026-10-17T10:15:00Z'),
      _count: { chunks: 1 },
      chunks: [
        {
          id: 'chunk-003',
          document_id: 'faq-doc-003',
          chunk_index: 0,
          content:
            'Shop hỗ trợ hình thức thanh toán khi nhận hàng (COD) hoặc chuyển khoản qua ngân hàng Vietcombank/MB Bank. Khách hàng được quyền kiểm tra hàng trước khi thanh toán. Bảo hành đường may và nút cúc trọn đời miễn phí.',
        },
      ],
    },
  ];

  /**
   * Cắt nhỏ văn bản tài liệu chính sách thành các chunk ngữ nghĩa (200 - 500 ký tự)
   */
  public static chunkText(rawText: string, maxChunkLength = 500): string[] {
    const cleaned = rawText.trim();
    if (!cleaned) return [];

    // Tách văn bản theo đoạn văn (\n\n) hoặc dòng (\n)
    const paragraphs = cleaned.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk + ' ' + p).length <= maxChunkLength) {
        currentChunk = currentChunk ? `${currentChunk}\n${p}` : p;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        // Nếu đoạn quá dài, cắt theo câu hoặc ký tự
        if (p.length > maxChunkLength) {
          const sentences = p.split(/(?<=[.?!])\s+/);
          let sentenceChunk = '';
          for (const s of sentences) {
            if ((sentenceChunk + ' ' + s).length <= maxChunkLength) {
              sentenceChunk = sentenceChunk ? `${sentenceChunk} ${s}` : s;
            } else {
              if (sentenceChunk) chunks.push(sentenceChunk);
              sentenceChunk = s;
            }
          }
          if (sentenceChunk) chunks.push(sentenceChunk);
          currentChunk = '';
        } else {
          currentChunk = p;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [cleaned];
  }

  /**
   * Tạo tài liệu chính sách mới và tự động cắt chunks trong Transaction
   */
  public static async createDocument(shopId: string, dto: CreateFaqDocumentDto) {
    const chunks = this.chunkText(dto.raw_text);

    try {
      return await prisma.$transaction(async (tx) => {
        const doc = await tx.faqDocument.create({
          data: {
            shop_id: shopId,
            title: dto.title.trim(),
            content_type: dto.content_type || 'POLICIES',
            raw_text: dto.raw_text.trim(),
            is_active: true,
            chunks: {
              create: chunks.map((chunk, idx) => ({
                shop_id: shopId,
                chunk_index: idx,
                content: chunk,
              })),
            },
          },
          include: {
            chunks: true,
          },
        });

        return doc;
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const newDoc = {
          id: `faq-doc-${Date.now()}`,
          shop_id: shopId,
          title: dto.title.trim(),
          content_type: dto.content_type || 'POLICIES',
          raw_text: dto.raw_text.trim(),
          is_active: true,
          created_at: new Date(),
          _count: { chunks: chunks.length },
          chunks: chunks.map((c, i) => ({
            id: `chunk-${Date.now()}-${i}`,
            chunk_index: i,
            content: c,
          })),
        };
        this.demoDocuments.unshift(newDoc);
        return newDoc;
      }
      throw err;
    }
  }

  /**
   * Danh sách tài liệu chính sách của cửa hàng
   */
  public static async listDocuments(shopId: string) {
    try {
      return await prisma.faqDocument.findMany({
        where: {
          shop_id: shopId,
        },
        include: {
          _count: {
            select: { chunks: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        return this.demoDocuments;
      }
      throw err;
    }
  }

  /**
   * Chi tiết tài liệu kèm toàn bộ các chunks đã cắt
   */
  public static async getDocumentById(shopId: string, id: string) {
    try {
      const doc = await prisma.faqDocument.findFirst({
        where: {
          id,
          shop_id: shopId,
        },
        include: {
          chunks: {
            orderBy: { chunk_index: 'asc' },
          },
        },
      });

      if (!doc) {
        throw new NotFoundError('Không tìm thấy tài liệu chính sách');
      }

      return doc;
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const doc = this.demoDocuments.find((d) => d.id === id);
        if (!doc) throw new NotFoundError('Không tìm thấy tài liệu chính sách');
        return doc;
      }
      throw err;
    }
  }

  /**
   * Cập nhật tài liệu: Tự động tái tạo lại các chunks nếu nội dung raw_text thay đổi
   */
  public static async updateDocument(shopId: string, id: string, dto: UpdateFaqDocumentDto) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.faqDocument.findFirst({
          where: { id, shop_id: shopId },
        });

        if (!existing) {
          throw new NotFoundError('Không tìm thấy tài liệu để cập nhật');
        }

        // Nếu có cập nhật nội dung raw_text, xóa chunks cũ và sinh chunks mới
        if (dto.raw_text && dto.raw_text.trim() !== existing.raw_text) {
          await tx.faqChunk.deleteMany({
            where: { document_id: id },
          });

          const newChunks = this.chunkText(dto.raw_text);
          await tx.faqChunk.createMany({
            data: newChunks.map((chunk, idx) => ({
              shop_id: shopId,
              document_id: id,
              chunk_index: idx,
              content: chunk,
            })),
          });
        }

        const updated = await tx.faqDocument.update({
          where: { id },
          data: {
            ...(dto.title ? { title: dto.title.trim() } : {}),
            ...(dto.content_type ? { content_type: dto.content_type } : {}),
            ...(dto.raw_text ? { raw_text: dto.raw_text.trim() } : {}),
            ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
          },
          include: {
            chunks: true,
          },
        });

        return updated;
      });
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        const idx = this.demoDocuments.findIndex((d) => d.id === id);
        if (idx === -1) throw new NotFoundError('Không tìm thấy tài liệu để cập nhật');
        const existing = this.demoDocuments[idx];
        const newChunks = dto.raw_text ? this.chunkText(dto.raw_text) : existing.chunks.map((c: any) => c.content);
        const updated = {
          ...existing,
          title: dto.title !== undefined ? dto.title.trim() : existing.title,
          content_type: dto.content_type !== undefined ? dto.content_type : existing.content_type,
          raw_text: dto.raw_text !== undefined ? dto.raw_text.trim() : existing.raw_text,
          is_active: dto.is_active !== undefined ? dto.is_active : existing.is_active,
          _count: { chunks: newChunks.length },
          chunks: newChunks.map((c: string, i: number) => ({
            id: `chunk-${id}-${i}`,
            chunk_index: i,
            content: c,
          })),
        };
        this.demoDocuments[idx] = updated;
        return updated;
      }
      throw err;
    }
  }

  /**
   * Xóa tài liệu chính sách (Cascade xóa toàn bộ chunks)
   */
  public static async deleteDocument(shopId: string, id: string) {
    try {
      const existing = await prisma.faqDocument.findFirst({
        where: { id, shop_id: shopId },
      });

      if (!existing) {
        throw new NotFoundError('Không tìm thấy tài liệu để xóa');
      }

      await prisma.faqDocument.delete({
        where: { id },
      });

      return { success: true };
    } catch (err: any) {
      if (
        err.message?.includes("Can't reach database server") ||
        err.name === 'PrismaClientInitializationError'
      ) {
        this.demoDocuments = this.demoDocuments.filter((d) => d.id !== id);
        return { success: true };
      }
      throw err;
    }
  }

  /**
   * Tìm kiếm các chunks tài liệu liên quan nhất theo từ khóa / ngữ cảnh (Lightweight Retrieval)
   */
  public static async searchRelevantChunks(
    shopId: string,
    query: string,
    topK = 3
  ): Promise<RelevantChunkResult[]> {
    try {
      // Tải các chunks của shop kèm thông tin tài liệu
      const chunks = await prisma.faqChunk.findMany({
        where: {
          shop_id: shopId,
          document: {
            is_active: true,
          },
        },
        include: {
          document: {
            select: { id: true, title: true },
          },
        },
      });

      if (chunks.length === 0) return [];

      // Tính điểm liên quan (Relevance Scoring) theo BM25 / Token Overlap
      const queryTokens = this.tokenize(query);
      const scored = chunks.map((c) => {
        const chunkText = c.content.toLowerCase();
        let score = 0;
        queryTokens.forEach((token) => {
          if (chunkText.includes(token)) {
            // Từ dài hoặc xuất hiện nhiều lần thì trọng số cao hơn
            score += 1 + (token.length > 4 ? 0.5 : 0);
          }
        });

        // Điểm thưởng nếu tiêu đề tài liệu chứa từ khóa
        const titleText = c.document.title.toLowerCase();
        queryTokens.forEach((token) => {
          if (titleText.includes(token)) {
            score += 2;
          }
        });

        return {
          document_id: c.document.id,
          document_title: c.document.title,
          chunk_index: c.chunk_index,
          content: c.content,
          relevance_score: Math.min(1, Number((score / Math.max(1, queryTokens.length)).toFixed(2))),
        };
      });

      // Lọc các chunk có điểm > 0 và lấy top K
      return scored
        .filter((s) => s.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, topK);
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Lỗi khi tìm kiếm FAQ chunks từ CSDL - Dùng fallback bộ nhớ đệm');
      const fallbackChunks: any[] = [];
      this.demoDocuments.forEach((doc) => {
        if (doc.is_active && doc.chunks) {
          doc.chunks.forEach((chunk: any) => {
            fallbackChunks.push({
              ...chunk,
              document: { id: doc.id, title: doc.title },
            });
          });
        }
      });

      const queryTokens = this.tokenize(query);
      const scored = fallbackChunks.map((c) => {
        const chunkText = c.content.toLowerCase();
        let score = 0;
        queryTokens.forEach((token) => {
          if (chunkText.includes(token)) score += 1;
        });
        const titleText = c.document.title.toLowerCase();
        queryTokens.forEach((token) => {
          if (titleText.includes(token)) score += 2;
        });
        return {
          document_id: c.document.id,
          document_title: c.document.title,
          chunk_index: c.chunk_index,
          content: c.content,
          relevance_score: Math.min(1, Number((score / Math.max(1, queryTokens.length)).toFixed(2))),
        };
      });

      return scored
        .filter((s) => s.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, topK);
    }
  }

  /**
   * Trả lời câu hỏi tư vấn chính sách shop bằng kỹ thuật RAG có trích dẫn nguồn
   */
  public static async answerFaq(
    shopId: string,
    userId: string | null,
    question: string
  ): Promise<FaqAnswerResult> {
    const startTime = Date.now();
    const relevantChunks = await this.searchRelevantChunks(shopId, question, 3);

    // Kịch bản A: Không tìm thấy bất kỳ tài liệu chính sách nào liên quan
    if (relevantChunks.length === 0) {
      return {
        answer:
          'Dạ hiện tại shop chưa cập nhật chính sách cụ thể liên quan đến câu hỏi của bạn. Bạn vui lòng nhắn tin trực tiếp để nhân viên tư vấn hỗ trợ chi tiết nhé ạ! ❤️',
        sources: [],
        telemetry: {
          model: 'rule-based-fallback',
          latency_ms: Date.now() - startTime,
          tokens: { input: 0, output: 0, total: 0 },
        },
      };
    }

    // Kịch bản B: Có ngữ cảnh liên quan -> Tạo Prompt RAG có trích dẫn
    const contextText = relevantChunks
      .map(
        (c, idx) =>
          `[TÀI LIỆU ${idx + 1}: ${c.document_title}]\n${c.content}`
      )
      .join('\n\n');

    const ragPrompt = `
Bạn là Trợ lý tư vấn bán hàng của ShopFlow AI.
Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng DỰA DUY NHẤT VÀO NGỮ CẢNH TÀI LIỆU CHÍNH SÁCH DƯỚI ĐÂY.

NGUYÊN TẮC:
1. Trả lời bằng tiếng Việt thân thiện, lịch sự, chuẩn văn phong bán hàng online ("Dạ chào bạn...", "Dạ shop hỗ trợ...").
2. BẮT BUỘC TRÍCH DẪN NGUỒN TÀI LIỆU ở cuối câu trả lời (Ví dụ: [Nguồn: ${relevantChunks[0].document_title}]).
3. KHÔNG TỰ BỊA ĐẶT THÔNG TIN nằm ngoài ngữ cảnh được cung cấp.

[NGỮ CẢNH TÀI LIỆU]:
${contextText}

[CÂU HỎI CỦA KHÁCH]:
"${question}"

Hãy trả về câu trả lời hoàn chỉnh kèm trích dẫn nguồn:
`;

    const provider = AIService.getProvider();
    let answerText = '';
    let latencyMs = 0;
    let tokens = { input: 0, output: 0, total: 0 };

    try {
      const aiResult = await provider.parseDraftOrder({
        rawMessage: ragPrompt,
        anonymizedMessage: ragPrompt,
      });

      latencyMs = aiResult.latencyMs || Date.now() - startTime;
      tokens = {
        input: aiResult.tokens.promptTokens,
        output: aiResult.tokens.completionTokens,
        total: aiResult.tokens.totalTokens,
      };

      // Nếu là MockProvider, trả về câu trả lời định dạng chuẩn RAG
      if (provider.name === 'mock-provider') {
        const topDoc = relevantChunks[0];
        answerText = `Dạ shop gửi bạn thông tin nhé ạ: Theo quy định của cửa hàng, ${topDoc.content.slice(
          0,
          160
        )}... Bạn cần hỗ trợ thêm thông tin gì cứ nhắn shop nhé! ❤️\n\n[Nguồn: ${topDoc.document_title}]`;
      } else {
        answerText = aiResult.rawResponseText;
      }

      // Ghi telemetry vào ai_logs
      try {
        await prisma.aiLog.create({
          data: {
            shop_id: shopId,
            user_id: userId,
            feature: 'FAQ_QUERY',
            model: aiResult.model || 'gemini-1.5-flash',
            latency_ms: latencyMs,
            input_tokens: tokens.input,
            output_tokens: tokens.output,
            status: 'SUCCESS',
          },
        });
      } catch {
        // Offline logger
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Lỗi khi gọi AI trả lời FAQ, dùng phản hồi trích xuất trực tiếp');
      const topDoc = relevantChunks[0];
      answerText = `Dạ shop xin thông tin đến bạn: ${topDoc.content}\n\n[Nguồn: ${topDoc.document_title}]`;
      latencyMs = Date.now() - startTime;
    }

    return {
      answer: answerText,
      sources: relevantChunks.map((c) => ({
        document_id: c.document_id,
        document_title: c.document_title,
        snippet: c.content.slice(0, 200),
        relevance_score: c.relevance_score,
      })),
      telemetry: {
        model: provider.name,
        latency_ms: latencyMs,
        tokens,
      },
    };
  }

  /**
   * Tách từ khóa và chuẩn hóa tiếng Việt
   */
  private static tokenize(str: string): string[] {
    return str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
  }
}

