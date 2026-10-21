import { UserRole } from '@prisma/client';

export interface AuthUserPayload {
  userId: string;
  shopId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
