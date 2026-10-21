import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  shopId: string;
  role: UserRole;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      idempotencyKey?: string;
    }
  }
}
