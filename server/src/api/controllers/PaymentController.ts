import { Request, Response } from 'express';
import { container } from '../../config/container';
import { CreateReceivable } from '../../application/useCases/payment/CreateReceivable';
import { CreateExpense } from '../../application/useCases/payment/CreateExpense';
import { CreateInboundRefund } from '../../application/useCases/payment/CreateInboundRefund';
import { CreateOutboundRefund } from '../../application/useCases/payment/CreateOutboundRefund';
import { GetPayments } from '../../application/useCases/payment/GetPayments';
import { GetPaymentById } from '../../application/useCases/payment/GetPaymentById';

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

  async getPayments(req: Request, res: Response) {
    try {
      const getPayments = container.resolve(GetPayments);
      const { limit, offset, type } = req.query;
      const paymentType = type ? String(type).toUpperCase() : undefined;
      const payments = await getPayments.execute(
        req.user?.orgId!, 
        limit ? Number(limit) : undefined, 
        offset ? Number(offset) : undefined,
        paymentType as any
      );
      const count = await getPayments.count(req.user?.orgId!, paymentType as any);
      
      res.json({
        status: 'success',
        data: payments,
        count
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const getPaymentById = container.resolve(GetPaymentById);
      const payment = await getPaymentById.execute(req.params.id, req.user?.orgId!);
      
      if (!payment) {
        return res.status(404).json({
          status: 'error',
          data: { message: 'Payment not found' }
        });
      }
      
      res.json({
        status: 'success',
        data: payment
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        data: { message: error.message }
      });
    }
  }
}
