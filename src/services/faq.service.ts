import { prisma } from '../infrastructure/database/prisma';
import { NotFoundError } from '../core/errors/app-error';

export class FaqService {
  /**
   * Tạo tài liệu chính sách mới và tự động cắt thành các mẩu chunk (RAG Preprocessing)
   */
  async createDocument(
    shopId: string,
    title: string,
    rawText: string,
    contentType: string = 'POLICIES'
  ) {
    // 1. Phân mảnh văn bản (Text Chunking) theo đoạn văn hoặc độ dài ~300-500 ký tự
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const chunksToInsert: Array<{ content: string; chunk_index: number }> = [];

    let index = 0;
    for (const paragraph of paragraphs) {
      if (paragraph.length > 500) {
        // Nếu đoạn quá dài, chia nhỏ tiếp theo câu kết thúc bằng dấu chấm
        const sentences = paragraph.split(/(?<=[.?!])\s+/);
        let currentChunk = '';

        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length > 500 && currentChunk.length > 0) {
            chunksToInsert.push({ content: currentChunk.trim(), chunk_index: index++ });
            currentChunk = sentence;
          } else {
            currentChunk = currentChunk.length > 0 ? `${currentChunk} ${sentence}` : sentence;
          }
        }
        if (currentChunk.trim().length > 0) {
          chunksToInsert.push({ content: currentChunk.trim(), chunk_index: index++ });
        }
      } else {
        chunksToInsert.push({ content: paragraph, chunk_index: index++ });
      }
    }

    // 2. Lưu tài liệu và các chunk trong Database Transaction
    return await prisma.$transaction(async (tx) => {
      const document = await tx.faqDocument.create({
        data: {
          shop_id: shopId,
          title,
          content_type: contentType,
          raw_text: rawText
        }
      });

      if (chunksToInsert.length > 0) {
        await tx.faqChunk.createMany({
          data: chunksToInsert.map((c) => ({
            shop_id: shopId,
            document_id: document.id,
            chunk_index: c.chunk_index,
            content: c.content
          }))
        });
      }

      return {
        ...document,
        total_chunks: chunksToInsert.length
      };
    });
  }

  async listDocuments(shopId: string) {
    const docs = await prisma.faqDocument.findMany({
      where: { shop_id: shopId, is_active: true },
      include: {
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      contentType: d.content_type,
      totalChunks: d._count.chunks,
      createdAt: d.created_at
    }));
  }

  async deleteDocument(shopId: string, documentId: string) {
    const doc = await prisma.faqDocument.findFirst({
      where: { id: documentId, shop_id: shopId }
    });

    if (!doc) {
      throw new NotFoundError('DOCUMENT_NOT_FOUND', 'Không tìm thấy tài liệu quy định của shop');
    }

    // Cascade delete tự động xóa các FaqChunk liên quan
    await prisma.faqDocument.delete({
      where: { id: documentId }
    });

    return { message: 'Đã xóa tài liệu chính sách thành công' };
  }

  /**
   * Truy vấn tìm kiếm ngữ cảnh liên quan (RAG Context Retrieval)
   */
  async searchRelevantChunks(shopId: string, query: string, limit: number = 3): Promise<string[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (keywords.length === 0) {
      return [];
    }

    // Tìm kiếm các chunk chứa ít nhất một trong các từ khóa cốt lõi
    const chunks = await prisma.faqChunk.findMany({
      where: {
        shop_id: shopId,
        OR: keywords.map((k) => ({
          content: { contains: k, mode: 'insensitive' }
        }))
      },
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    return chunks.map((c) => c.content);
  }
}

