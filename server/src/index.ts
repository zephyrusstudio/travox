import 'reflect-metadata'; // Needed for tsyringe dependency injection
import dotenv from 'dotenv';

// Load environment variables as early as possible so any imported module
// (for example the DI container or Firebase initialization) can read them.
dotenv.config();

// Initialize dependency injection container AFTER dotenv so imports inside
// the container that rely on env vars (like Firebase config) will see them.
import './config/container';
import { startServer } from './server';

// Validate required environment variables
const requiredEnvVars = [
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Start the server
async function main() {
    try {
        await startServer();
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

main();
