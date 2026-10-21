import { Router } from 'express';
import { FaqController } from '../controllers/faq.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFaqDocSchema } from '../validators/faq.validator';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new FaqController();

router.use(authenticateToken);

router.post(
  '/',
  requireRole([UserRole.OWNER]),
  validate({ body: createFaqDocSchema }),
  controller.createDocument
);

router.get('/', controller.listDocuments);

router.delete('/:id', requireRole([UserRole.OWNER]), controller.deleteDocument);

export default router;

