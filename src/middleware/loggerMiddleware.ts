import pinoHttp from 'pino-http';
import logger from '../config/logger';

export const loggerMiddleware = pinoHttp({
    logger, // use shared logger instance
    customLogLevel: function (res, err) {
        const status = res.statusCode ?? 500;
        if (status >= 500 || err) return 'error';
        if (status >= 400) return 'warn';
        return 'info';
    },
    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
                id: req.id, // if you use a request ID middleware
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
    autoLogging: true, // logs all requests, can be customized
});
