import { spawn } from 'child_process';
import path from 'path';

/**
 * ==============================================================================
 * SHOPFLOW AI - MASTER TEST RUNNER
 * Chạy tuần tự toàn bộ các bộ kiểm thử tự động của dự án và xuất bảng tổng kết
 * ==============================================================================
 */

interface TestSuite {
  id: string;
  name: string;
  script: string;
}

const TEST_SUITES: TestSuite[] = [
  { id: 'C3', name: 'Nền tảng Backend Foundation & Logger', script: 'apps/backend/tests/test-c3-foundation.ts' },
  { id: 'C4', name: 'Xác thực JWT & Phân quyền RBAC', script: 'apps/backend/tests/test-c4-auth.ts' },
  { id: 'C5', name: 'CRUD Danh mục & Quản lý Khách hàng', script: 'apps/backend/tests/test-c5-catalog-customer.ts' },
  { id: 'C6', name: 'Đơn hàng, State Machine & Trừ kho nguyên tử', script: 'apps/backend/tests/test-c6-orders-concurrency.ts' },
  { id: 'C9', name: 'AI Backend MockProvider & PII Masking', script: 'apps/backend/tests/test-c9-ai-backend.ts' },
  { id: 'C10', name: 'GeminiProvider & Dynamic Fallback', script: 'apps/backend/tests/test-c10-gemini-provider.ts' },
  { id: 'C14', name: 'Dashboard Analytics & Hạn mức AI Quota', script: 'apps/backend/tests/test-c14-dashboard.ts' },
  { id: 'C15', name: 'Lightweight RAG FAQ có trích dẫn nguồn', script: 'apps/backend/tests/test-c15-rag-faq.ts' },
  { id: 'C16', name: 'Đóng gói Docker, Nginx Proxy & Healthchecks', script: 'apps/backend/tests/test-c16-docker-deploy.ts' },
  { id: 'C17', name: 'E2E Integration Suite toàn bộ luồng', script: 'apps/backend/tests/test-c17-e2e-integration.ts' },
];

async function runCommand(testScript: string): Promise<{ success: boolean; durationMs: number }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    const child = spawn(npxCmd, ['ts-node', '--transpile-only', testScript], {
      cwd: path.resolve(__dirname, '../'),
      stdio: 'inherit',
      shell: isWindows,
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        durationMs: Date.now() - start,
      });
    });

    child.on('error', () => {
      resolve({
        success: false,
        durationMs: Date.now() - start,
      });
    });
  });
}

async function main() {
  console.log('==============================================================================');
  console.log('🚀 SHOPFLOW AI - BẮT ĐẦU CHẠY KIỂM THỬ TOÀN BỘ HỆ THỐNG (MASTER TEST RUNNER)');
  console.log('==============================================================================\n');

  const results: Array<TestSuite & { passed: boolean; durationMs: number }> = [];

  for (const suite of TEST_SUITES) {
    console.log(`\n▶️ ĐANG THỰC THI BỘ TEST [${suite.id}]: ${suite.name}...`);
    const { success, durationMs } = await runCommand(suite.script);
    results.push({
      ...suite,
      passed: success,
      durationMs,
    });
  }

  console.log('\n==============================================================================');
  console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG SHOPFLOW AI');
  console.log('==============================================================================');
  console.log('| Bước | Tên Phân Hệ Kiểm Thử                              | Thời Gian | Trạng Thái |');
  console.log('| :--- | :------------------------------------------------- | :-------- | :--------- |');

  let totalPassed = 0;
  for (const r of results) {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    if (r.passed) totalPassed++;
    const duration = `${(r.durationMs / 1000).toFixed(1)}s`.padEnd(9);
    const name = r.name.padEnd(50);
    console.log(`| ${r.id.padEnd(4)} | ${name} | ${duration} | ${statusIcon}    |`);
  }

  console.log('==============================================================================');
  console.log(`🏁 TỔNG KẾT: ${totalPassed}/${results.length} BỘ KIỂM THỬ THÀNH CÔNG (${Math.round((totalPassed / results.length) * 100)}%)`);

  if (totalPassed === results.length) {
    console.log('🎉 XÁC NHẬN: HỆ THỐNG SHOPFLOW AI ĐẠT 100% TIÊU CHUẨN KỸ THUẬT & SẴN SÀNG NGHIỆM THU!\n');
    process.exit(0);
  } else {
    console.error('⚠️ CÓ BÀI TEST CHƯA ĐẠT. VUI LÒNG KIỂM TRA LOG CHI TIẾT TRÊN.\n');
    process.exit(1);
  }
}

main();

