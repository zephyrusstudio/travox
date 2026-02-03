import 'reflect-metadata'; // Needed for tsyringe dependency injection
import dotenv from 'dotenv';

// Load environment variables as early as possible so any imported module
// (for example the DI container or MongoDB initialization) can read them.
dotenv.config();

// Initialize dependency injection container AFTER dotenv so imports inside
// the container that rely on env vars will see them.
import './config/container';
import { startServer } from './server';
import { connectToMongoDB, disconnectFromMongoDB } from './config/mongodb';

// Validate required environment variables
const requiredEnvVars = [
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Start the server
async function main() {
    try {
        // Connect to MongoDB before starting the server
        await connectToMongoDB();
        await startServer();
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await disconnectFromMongoDB();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await disconnectFromMongoDB();
    process.exit(0);
});

main();
