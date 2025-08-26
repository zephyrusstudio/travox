import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateReceivable } from '../../application/useCases/payment/CreateReceivable';
import { CreateExpense } from '../../application/useCases/payment/CreateExpense';
import { CreateInboundRefund } from '../../application/useCases/payment/CreateInboundRefund';
import { CreateOutboundRefund } from '../../application/useCases/payment/CreateOutboundRefund';

export class PaymentController {
  async createReceivable(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateReceivable);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      
      const payment = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async createExpense(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateExpense);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      
      const payment = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async createInboundRefund(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateInboundRefund);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      
      const payment = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async createOutboundRefund(req: Request, res: Response) {
    try {
      const useCase = container.resolve(CreateOutboundRefund);
      const orgId = req.user?.orgId!;
      const createdBy = req.user?.id!;
      
      const payment = await useCase.execute(req.body, orgId, createdBy);
      
      res.status(201).json({
        status: 'success',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
