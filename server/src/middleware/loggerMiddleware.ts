import pinoHttp from 'pino-http';
import logger from '../config/logger';

export const loggerMiddleware = pinoHttp({
    logger,
    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
                id: req.id,
                headers: req.headers,
                remoteAddress: req.remoteAddress,
                remotePort: req.remotePort,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
    autoLogging: true,
});
