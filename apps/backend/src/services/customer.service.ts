import { CustomerRepository } from '../repositories/customer.repository';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
} from '../api/validators/customer.validator';

export class CustomerService {
  public static async listCustomers(shopId: string, query: CustomerQueryDto) {
    return CustomerRepository.findMany(shopId, query);
  }

  public static async getCustomerById(shopId: string, customerId: string) {
    return CustomerRepository.findById(shopId, customerId);
  }

  public static async createCustomer(shopId: string, dto: CreateCustomerDto) {
    return CustomerRepository.create(shopId, dto);
  }

  public static async updateCustomer(shopId: string, customerId: string, dto: UpdateCustomerDto) {
    return CustomerRepository.update(shopId, customerId, dto);
  }

  public static async deleteCustomer(shopId: string, customerId: string) {
    return CustomerRepository.softDelete(shopId, customerId);
  }
}

export default CustomerService;
