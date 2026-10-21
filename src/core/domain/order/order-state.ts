import { OrderStatus } from "@prisma/client";
import { BadRequestError } from "../../errors/app-error";

export interface IOrderState {
  getStatus(): OrderStatus;
  canTransitionTo(nextStatus: OrderStatus): boolean;
  requiresStockDeduction(): boolean;
  requiresStockRestoration(): boolean;
}

export class DraftOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.DRAFT;
  }
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return (
      nextStatus === OrderStatus.CONFIRMED ||
      nextStatus === OrderStatus.CANCELLED
    );
  }
  requiresStockDeduction(): boolean {
    return false;
  }
  requiresStockRestoration(): boolean {
    return false;
  }
}

export class ConfirmedOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.CONFIRMED;
  }
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return (
      nextStatus === OrderStatus.SHIPPING ||
      nextStatus === OrderStatus.CANCELLED
    );
  }
  requiresStockDeduction(): boolean {
    return true; // Trạng thái này yêu cầu trừ kho
  }
  requiresStockRestoration(): boolean {
    return false;
  }
}

export class ShippingOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.SHIPPING;
  }
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return (
      nextStatus === OrderStatus.DELIVERED ||
      nextStatus === OrderStatus.RETURNED
    );
  }
  requiresStockDeduction(): boolean {
    return false;
  }
  requiresStockRestoration(): boolean {
    return false;
  }
}

export class DeliveredOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.DELIVERED;
  }
  canTransitionTo(_nextStatus: OrderStatus): boolean {
    return false; // Đã giao thành công, không thể chuyển tiếp
  }
  requiresStockDeduction(): boolean {
    return false;
  }
  requiresStockRestoration(): boolean {
    return false;
  }
}

export class CancelledOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.CANCELLED;
  }
  canTransitionTo(_nextStatus: OrderStatus): boolean {
    return false; // Trạng thái kết thúc
  }
  requiresStockDeduction(): boolean {
    return false;
  }
  requiresStockRestoration(): boolean {
    return true; // Nếu trước đó đã confirmed thì cần hoàn kho
  }
}

export class ReturnedOrderState implements IOrderState {
  getStatus(): OrderStatus {
    return OrderStatus.RETURNED;
  }
  canTransitionTo(_nextStatus: OrderStatus): boolean {
    return false; // Trạng thái kết thúc
  }
  requiresStockDeduction(): boolean {
    return false;
  }
  requiresStockRestoration(): boolean {
    return true; // Hàng hoàn về cần nhập lại vào kho
  }
}

export class OrderStateFactory {
  static create(status: OrderStatus): IOrderState {
    switch (status) {
      case OrderStatus.DRAFT:
      case OrderStatus.PENDING_REVIEW:
        return new DraftOrderState();
      case OrderStatus.CONFIRMED:
        return new ConfirmedOrderState();
      case OrderStatus.SHIPPING:
        return new ShippingOrderState();
      case OrderStatus.DELIVERED:
        return new DeliveredOrderState();
      case OrderStatus.CANCELLED:
        return new CancelledOrderState();
      case OrderStatus.RETURNED:
        return new ReturnedOrderState();
      default:
        throw new BadRequestError(
          "INVALID_ORDER_STATE",
          `Trạng thái đơn hàng không xác định: ${status}`,
        );
    }
  }
}
