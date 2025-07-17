import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Get current timestamp
const getTimestamp = () => {
    return new Date().toISOString();
};

// Write to console and log file
const log = (level, message, meta = {}) => {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;

    console.log(logMessage);

    // Write to file with date-based log files
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${today}.log`);

    fs.appendFileSync(logFile, logMessage + '\n');
};

// Create logger methods
const logger = {
    error: (message, meta = {}) => log(levels.ERROR, message, meta),
    warn: (message, meta = {}) => log(levels.WARN, message, meta),
    info: (message, meta = {}) => log(levels.INFO, message, meta),
    debug: (message, meta = {}) => log(levels.DEBUG, message, meta),
};

export default logger;