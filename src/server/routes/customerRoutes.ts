import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { ownerOnly } from '../auth';

export const customerRouter = Router();

// Customers
customerRouter.get('/', (req, res) => customerController.getCustomers(req, res));
customerRouter.post('/', (req, res) => customerController.createCustomer(req, res));
customerRouter.put('/:id', (req, res) => customerController.updateCustomer(req, res));
customerRouter.delete('/:id', ownerOnly, (req, res) => customerController.deleteCustomer(req, res));

// Vehicles
export const vehicleRouter = Router();
vehicleRouter.get('/', (req, res) => customerController.getVehicles(req, res));
vehicleRouter.post('/', (req, res) => customerController.createVehicle(req, res));
vehicleRouter.delete('/:id', ownerOnly, (req, res) => customerController.deleteVehicle(req, res));
