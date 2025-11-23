import { Express } from 'express';
import { AccountController } from '../controllers/AccountController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerAccountRoutes(app: Express) {
    const accountCtrl = new AccountController();

    // Account routes (Bank/UPI accounts) - protected
    app.get('/accounts', requireAuth(), accountCtrl.getAccounts);
    app.get('/accounts/:id', requireAuth(), accountCtrl.getAccount);
    app.post('/accounts', requireAuth(), auditLogger('accounts'), accountCtrl.createAccount);
    app.put('/accounts/:id', requireAuth(), auditLogger('accounts'), accountCtrl.updateAccount);
    app.delete('/accounts/:id', requireAuth(), auditLogger('accounts'), accountCtrl.deleteAccount);
    app.post('/accounts/:id/archive', requireAuth(), auditLogger('accounts'), accountCtrl.archiveAccount);
}
