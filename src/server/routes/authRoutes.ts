import { Router } from 'express';
import { authController } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/login', (req, res) => authController.login(req, res));
authRouter.post('/register', (req, res) => authController.register(req, res));
