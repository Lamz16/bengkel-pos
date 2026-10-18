import { Router } from 'express';
import { mechanicController } from '../controllers/mechanicController';
import { ownerOnly } from '../auth';

export const mechanicRouter = Router();
mechanicRouter.use(ownerOnly);

mechanicRouter.get('/', (req, res) => mechanicController.getMechanics(req, res));
mechanicRouter.post('/', (req, res) => mechanicController.createMechanic(req, res));
mechanicRouter.put('/:id', (req, res) => mechanicController.updateMechanic(req, res));
mechanicRouter.delete('/:id', (req, res) => mechanicController.deleteMechanic(req, res));

export const deductionRouter = Router();
deductionRouter.use(ownerOnly);
deductionRouter.get('/', (req, res) => mechanicController.getDeductions(req, res));
deductionRouter.post('/', (req, res) => mechanicController.createDeduction(req, res));
deductionRouter.delete('/:id', (req, res) => mechanicController.deleteDeduction(req, res));

export const attendanceRouter = Router();
attendanceRouter.use(ownerOnly);
attendanceRouter.get('/', (req, res) => mechanicController.getAttendances(req, res));
attendanceRouter.put('/', (req, res) => mechanicController.saveAttendance(req, res));
