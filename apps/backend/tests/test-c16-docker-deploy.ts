import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../src/app';

/**
 * ==============================================================================
 * BỘ KIỂM THỬ TỰ ĐỘNG BƯỚC C16: ĐÓNG GÓI DOCKER & TRIỂN KHAI PRODUCTION
 * ==============================================================================
 */

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ DOCKER & TRIỂN KHAI PRODUCTION (BƯỚC C16)...\n');
  let passedCount = 0;
  const rootDir = path.resolve(__dirname, '../../../');

  // ----------------------------------------------------------------------------
  // TEST 1: Liveness Probe (/health, /healthz, /api/v1/health) trả về HTTP 200
  // ----------------------------------------------------------------------------
  try {
    const resRootHealth = await request(app).get('/healthz');
    if (resRootHealth.status !== 200 || resRootHealth.body.status !== 'healthy') {
      throw new Error(`GET /healthz kỳ vọng status: 200 và body.status: 'healthy', nhận: ${resRootHealth.status}`);
    }

    const resApiHealth = await request(app).get('/api/v1/health');
    if (resApiHealth.status !== 200 || !resApiHealth.body.timestamp || typeof resApiHealth.body.uptime_seconds !== 'number') {
      throw new Error(`GET /api/v1/health kỳ vọng thông tin uptime & timestamp hợp lệ`);
    }

    console.log('✅ [PASS] TEST 1: Liveness Probes (/healthz, /api/v1/health) phản hồi HTTP 200 với trạng thái healthy');
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 1:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 2: Readiness Probe (/readyz, /api/v1/ready) phản hồi trạng thái kết nối CSDL
  // ----------------------------------------------------------------------------
  try {
    const resReady = await request(app).get('/readyz');
    // Trả về 200 nếu DB sẵn sàng, hoặc 503 nếu DB chưa kết nối (chuẩn HTTP readiness probe)
    if (![200, 503].includes(resReady.status)) {
      throw new Error(`GET /readyz kỳ vọng status 200 hoặc 503, nhận: ${resReady.status}`);
    }

    if (resReady.status === 200) {
      if (resReady.body.status !== 'ready' || resReady.body.database !== 'connected') {
        throw new Error('Body readiness khi thành công không khớp schema');
      }
    } else {
      if (resReady.body.status !== 'not_ready' || resReady.body.database !== 'unreachable') {
        throw new Error('Body readiness khi database offline không khớp schema');
      }
    }

    console.log(`✅ [PASS] TEST 2: Readiness Probe (/readyz) phản hồi đúng chuẩn Kubernetes/Docker (HTTP ${resReady.status}: ${resReady.body.status})`);
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 2:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 3: Kiểm tra tính đầy đủ của file cấu hình biến môi trường mẫu (.env.example)
  // ----------------------------------------------------------------------------
  try {
    const envExamplePath = path.join(rootDir, '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      throw new Error(`Không tìm thấy file .env.example tại: ${envExamplePath}`);
    }

    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const requiredKeys = [
      'PORT',
      'NODE_ENV',
      'FRONTEND_URL',
      'DATABASE_URL',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DB',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
      'AI_PROVIDER',
      'GEMINI_API_KEY',
      'GEMINI_MODEL',
    ];

    for (const key of requiredKeys) {
      if (!envContent.includes(key)) {
        throw new Error(`Thiếu biến môi trường bắt buộc: [${key}] trong .env.example`);
      }
    }

    console.log(`✅ [PASS] TEST 3: File .env.example chứa đầy đủ ${requiredKeys.length} biến cấu hình cần thiết cho Production`);
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 3:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 4: Kiểm tra cấu hình Docker Compose điều phối 3 dịch vụ (postgres, backend, frontend)
  // ----------------------------------------------------------------------------
  try {
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
    if (!fs.existsSync(dockerComposePath)) {
      throw new Error(`Không tìm thấy file docker-compose.yml tại: ${dockerComposePath}`);
    }

    const composeContent = fs.readFileSync(dockerComposePath, 'utf8');

    // Kiểm tra các dịch vụ cốt lõi
    if (!composeContent.includes('postgres:') || !composeContent.includes('backend:') || !composeContent.includes('frontend:')) {
      throw new Error('docker-compose.yml phải định nghĩa đủ 3 dịch vụ: postgres, backend, frontend');
    }

    // Kiểm tra healthcheck cho postgres và backend
    if (!composeContent.includes('pg_isready')) {
      throw new Error('Dịch vụ postgres thiếu healthcheck với lệnh pg_isready');
    }
    if (!composeContent.includes('condition: service_healthy')) {
      throw new Error('Backend hoặc frontend thiếu điều kiện phụ thuộc service_healthy');
    }

    // Kiểm tra volumes & networks
    if (!composeContent.includes('postgres_data:') || !composeContent.includes('shopflow_network:')) {
      throw new Error('docker-compose.yml phải khai báo named volume (postgres_data) và named network (shopflow_network)');
    }

    console.log('✅ [PASS] TEST 4: docker-compose.yml điều phối chuẩn xác 3 dịch vụ kèm Healthcheck & Volume bền vững');
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 4:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 5: Kiểm tra Dockerfile Backend & Frontend đa tầng (Multi-stage) & Non-root
  // ----------------------------------------------------------------------------
  try {
    const backendDockerPath = path.join(rootDir, 'Dockerfile.backend');
    const frontendDockerPath = path.join(rootDir, 'Dockerfile.frontend');

    if (!fs.existsSync(backendDockerPath) || !fs.existsSync(frontendDockerPath)) {
      throw new Error('Thiếu Dockerfile.backend hoặc Dockerfile.frontend');
    }

    const backendDocker = fs.readFileSync(backendDockerPath, 'utf8');
    const frontendDocker = fs.readFileSync(frontendDockerPath, 'utf8');

    // Kiểm tra Backend Dockerfile
    if (!backendDocker.includes('AS builder') || !backendDocker.includes('AS runner')) {
      throw new Error('Dockerfile.backend phải dùng kiến trúc đa tầng (Multi-stage: AS builder, AS runner)');
    }
    if (!backendDocker.includes('USER node')) {
      throw new Error('Dockerfile.backend phải chạy bằng người dùng không đặc quyền (USER node) vì bảo mật');
    }
    if (!backendDocker.includes('dumb-init')) {
      throw new Error('Dockerfile.backend phải dùng dumb-init để xử lý tín hiệu SIGTERM/SIGINT');
    }
    if (!backendDocker.includes('HEALTHCHECK')) {
      throw new Error('Dockerfile.backend phải khai báo chỉ thị HEALTHCHECK');
    }

    // Kiểm tra Frontend Dockerfile
    if (!frontendDocker.includes('AS builder') || !frontendDocker.includes('FROM nginx:')) {
      throw new Error('Dockerfile.frontend phải build qua Node.js và chạy trên máy chủ Nginx Alpine');
    }
    if (!frontendDocker.includes('HEALTHCHECK')) {
      throw new Error('Dockerfile.frontend phải khai báo chỉ thị HEALTHCHECK');
    }

    console.log('✅ [PASS] TEST 5: Dockerfile Backend & Frontend đạt chuẩn Multi-stage, Non-root User & dumb-init');
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 5:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 6: Kiểm tra cấu hình Nginx (SPA fallback, API reverse proxy, Gzip & Security)
  // ----------------------------------------------------------------------------
  try {
    const nginxConfPath = path.join(rootDir, 'nginx', 'nginx.conf');
    if (!fs.existsSync(nginxConfPath)) {
      throw new Error(`Không tìm thấy file cấu hình Nginx tại: ${nginxConfPath}`);
    }

    const nginxConf = fs.readFileSync(nginxConfPath, 'utf8');

    // SPA fallback
    if (!nginxConf.includes('try_files $uri $uri/ /index.html;')) {
      throw new Error('Nginx thiếu cấu hình SPA fallback (try_files $uri $uri/ /index.html;)');
    }

    // Reverse Proxy API
    if (!nginxConf.includes('location /api/') || !nginxConf.includes('proxy_pass http://backend:5000/api/;')) {
      throw new Error('Nginx thiếu reverse proxy cho /api/ trỏ tới backend:5000');
    }

    // Gzip & Security
    if (!nginxConf.includes('gzip on;')) {
      throw new Error('Nginx chưa bật nén Gzip');
    }
    if (!nginxConf.includes('X-Frame-Options') || !nginxConf.includes('X-Content-Type-Options')) {
      throw new Error('Nginx thiếu các tiêu đề bảo mật HTTP (X-Frame-Options, X-Content-Type-Options)');
    }

    // Healthcheck endpoint
    if (!nginxConf.includes('location = /healthz')) {
      throw new Error('Nginx thiếu healthcheck endpoint /healthz');
    }

    console.log('✅ [PASS] TEST 6: Cấu hình Nginx tối ưu hoàn chỉnh (SPA Routing, Reverse Proxy, Gzip, Security Headers)');
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 6:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TEST 7: Kiểm tra .dockerignore loại bỏ các file nặng và nhạy cảm
  // ----------------------------------------------------------------------------
  try {
    const dockerignorePath = path.join(rootDir, '.dockerignore');
    if (!fs.existsSync(dockerignorePath)) {
      throw new Error(`Không tìm thấy file .dockerignore tại: ${dockerignorePath}`);
    }

    const dockerignore = fs.readFileSync(dockerignorePath, 'utf8');
    const essentialIgnores = ['node_modules', '.env', '.git', 'dist'];

    for (const item of essentialIgnores) {
      if (!dockerignore.includes(item)) {
        throw new Error(`.dockerignore thiếu mục quan trọng: [${item}]`);
      }
    }

    console.log('✅ [PASS] TEST 7: .dockerignore loại trừ đúng đắn mã nguồn tạm, node_modules và tệp nhạy cảm');
    passedCount++;
  } catch (error: any) {
    console.error('❌ [FAIL] TEST 7:', error.message);
  }

  // ----------------------------------------------------------------------------
  // TỔNG KẾT
  // ----------------------------------------------------------------------------
  console.log(`\n🏁 KẾT QUẢ: ĐÃ VƯỢT QUA ${passedCount}/7 BÀI KIỂM THỬ DOCKER & DEPLOY (BƯỚC C16)!`);
  if (passedCount < 7) {
    process.exit(1);
  }
}

runTests();

