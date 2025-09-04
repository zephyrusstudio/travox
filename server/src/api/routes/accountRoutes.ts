import { Express } from 'express';
import { AccountController } from '../controllers/AccountController';
import { requireAuth } from '../../middleware/requireAuth';

export function registerAccountRoutes(app: Express) {
    const accountCtrl = new AccountController();

    // Account routes (Bank/UPI accounts) - protected
    app.get('/accounts', requireAuth(), accountCtrl.getAccounts);
    app.get('/accounts/:id', requireAuth(), accountCtrl.getAccount);
    app.post('/accounts', requireAuth(), accountCtrl.createAccount);
    app.put('/accounts/:id', requireAuth(), accountCtrl.updateAccount);
    app.delete('/accounts/:id', requireAuth(), accountCtrl.deleteAccount);
    app.post('/accounts/:id/archive', requireAuth(), accountCtrl.archiveAccount);
}
