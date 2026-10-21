import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', authenticateToken, controller.logout);
router.get('/me', authenticateToken, controller.getMe);

export default router;

