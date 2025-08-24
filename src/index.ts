import 'reflect-metadata'; // Needed for tsyringe dependency injection
import dotenv from 'dotenv';
import './config/container'; // Initialize dependency injection container
import { startServer } from './server';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Start the server
async function main() {
    try {
        console.log('🔧 Initializing TMS API...');
        await startServer();
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

main();
