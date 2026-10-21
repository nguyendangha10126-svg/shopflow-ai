import { OrderStatus } from '@prisma/client';
import { ValidationError } from '../errors/app-error';

export class OrderStateMachine {
  // Bản đồ các bước chuyển trạng thái hợp lệ
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.PENDING_REVIEW]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED],
    [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
    [OrderStatus.CANCELLED]: [], // Trạng thái kết thúc
    [OrderStatus.RETURNED]: [], // Trạng thái kết thúc
  };

  public static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (from === to) return true;
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ValidationError(
        `Không thể chuyển trạng thái đơn hàng từ '${from}' sang '${to}'. Chuyển đổi không hợp lệ theo quy trình vận hành.`,
        { from_status: from, to_status: to, allowed_transitions: this.ALLOWED_TRANSITIONS[from] }
      );
    }
  }

  public static isStockDeducted(status: OrderStatus): boolean {
    // Các trạng thái đơn hàng đã được trừ kho thực tế
    const deductedStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
    ];
    return deductedStatuses.includes(status);
  }
}

export default OrderStateMachine;
