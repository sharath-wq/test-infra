import { createLogger, transports, format } from 'winston';
import path from 'path';

const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        // File for 'warning' logs
        new transports.File({ 
            filename: path.join(__dirname, '../logs/warn.log'), 
            level: 'warn',
            format: format.combine(
                format.timestamp(),
                format.json(),
                format((info) => (info.level === 'warn' ? info : false))() // Filters non-warn logs
            ), 
        }),
        // File for 'info' only
        new transports.File({
            filename: path.join(__dirname, '../logs/info.log'), 
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json(),
                format((info) => (info.level === 'info' ? info : false))() // Filters non-info logs
            ), 
        }),

        // File for 'error' only
        new transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error',
            format: format.combine(
                format.timestamp(),
                format.json(),
                format((info) => (info.level === 'error' ? info : false))() // Filters non-error logs
            ), 
        }),

        // File for 'debug' only
        new transports.File({ 
            filename: path.join(__dirname, '../logs/debug.log'),
            level: 'debug',
            format: format.combine(
                format.timestamp(),
                format.json(),
                format((info) => (info.level === 'debug' ? info : false))() // Filters non-debug logs
            ),
        }),

        // Console transport
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
        }),
    ],
});

export default logger;
