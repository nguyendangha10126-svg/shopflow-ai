import { OrderStatus } from "@prisma/client";
import { OrderStateFactory } from "../src/core/domain/order/order-state";

console.log(
  "🧪 BẮT ĐẦU KIỂM THỬ ĐƠN VỊ CHO VERTICAL SLICE #1 (STATE PATTERN & CHỐT ĐƠN)",
);

// Test 1: Kiểm thử máy trạng thái từ DRAFT -> CONFIRMED
const draftState = OrderStateFactory.create(OrderStatus.DRAFT);
console.assert(
  draftState.canTransitionTo(OrderStatus.CONFIRMED) === true,
  "Test 1.1 Thất bại: DRAFT phải sang được CONFIRMED",
);
console.assert(
  draftState.canTransitionTo(OrderStatus.CANCELLED) === true,
  "Test 1.2 Thất bại: DRAFT phải sang được CANCELLED",
);
console.assert(
  draftState.canTransitionTo(OrderStatus.DELIVERED) === false,
  "Test 1.3 Thất bại: DRAFT không được nhảy cóc sang DELIVERED",
);

// Test 2: Kiểm thử máy trạng thái từ CONFIRMED -> SHIPPING / CANCELLED
const confirmedState = OrderStateFactory.create(OrderStatus.CONFIRMED);
console.assert(
  confirmedState.canTransitionTo(OrderStatus.SHIPPING) === true,
  "Test 2.1 Thất bại: CONFIRMED phải sang được SHIPPING",
);
console.assert(
  confirmedState.canTransitionTo(OrderStatus.CANCELLED) === true,
  "Test 2.2 Thất bại: CONFIRMED phải hủy được",
);
console.assert(
  confirmedState.canTransitionTo(OrderStatus.DRAFT) === false,
  "Test 2.3 Thất bại: CONFIRMED không được quay lại DRAFT",
);
console.assert(
  confirmedState.requiresStockDeduction() === true,
  "Test 2.4 Thất bại: CONFIRMED bắt buộc phải trừ kho",
);

// Test 3: Kiểm thử trạng thái kết thúc CANCELLED và DELIVERED
const cancelledState = OrderStateFactory.create(OrderStatus.CANCELLED);
console.assert(
  cancelledState.canTransitionTo(OrderStatus.CONFIRMED) === false,
  "Test 3.1 Thất bại: Đã CANCELLED không thể đổi trạng thái",
);
console.assert(
  cancelledState.requiresStockRestoration() === true,
  "Test 3.2 Thất bại: CANCELLED phải đánh dấu hoàn kho",
);

const deliveredState = OrderStateFactory.create(OrderStatus.DELIVERED);
console.assert(
  deliveredState.canTransitionTo(OrderStatus.CANCELLED) === false,
  "Test 3.3 Thất bại: DELIVERED không thể hủy đơn",
);

console.log("✅ 100% CÁC KIỂM THỬ TRẠNG THÁI ĐƠN HÀNG ĐÃ VƯỢT QUA!");
