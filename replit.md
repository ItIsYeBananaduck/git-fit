# Overview

Git-fit is a comprehensive fitness platform that combines mobile and web applications for fitness tracking, training programs, and trainer-client interactions. The application is built as a cross-platform solution using SvelteKit for the web interface and Capacitor for mobile deployment. It leverages Convex as a real-time backend-as-a-service to handle user management, fitness data tracking, training programs, and workout management.

The platform serves three primary user types: clients who track their fitness data and purchase training programs, trainers who create and sell programs, and administrators who manage the platform. The system integrates with various fitness trackers and wearable devices to collect comprehensive health and fitness metrics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses SvelteKit 5 as the primary frontend framework, providing server-side rendering capabilities and optimal performance. The architecture follows a component-based approach with TypeScript for type safety. Capacitor is integrated to enable mobile app deployment for iOS and Android platforms, allowing the web application to run natively on mobile devices with access to device APIs.

The frontend structure is organized with a standard SvelteKit layout where routes are defined in the `src/routes` directory. The application supports both web and mobile interfaces through responsive design and Capacitor's native bridge capabilities.

## Backend Architecture
Convex serves as the backend-as-a-service, providing real-time database functionality, serverless functions, and automatic API generation. The backend uses a schema-driven approach with strongly typed data models defined in `convex/schema.ts`. All business logic is implemented as Convex functions (queries, mutations, and actions) that handle user management, fitness data processing, training program management, and workout tracking.

The Convex functions are organized by domain:
- `users.js` - User authentication and profile management
- `fitnessData.js` - Health and fitness metrics tracking
- `trainingPrograms.js` - Training program creation and management
- `workouts.js` - Workout and exercise management

## Data Storage Strategy
The application uses Convex's built-in database which provides real-time synchronization and automatic scaling. The database schema supports multi-role users (clients, trainers, admins) with role-specific fields stored in a single users table. Fitness data is stored with flexible typing to accommodate various metrics from different sources (steps, heart rate, sleep, calories, etc.).

Training programs and workouts are structured hierarchically with proper indexing for efficient queries. The schema includes rating systems, purchase tracking, and detailed exercise specifications with multimedia support.

## Authentication and Authorization
User authentication is handled through Convex's built-in authentication system. The application supports role-based access control with three distinct user types: clients, trainers, and administrators. Authorization is enforced at the function level within Convex queries and mutations.

User profiles are differentiated by role-specific fields stored conditionally in the users table, allowing for flexible user management while maintaining data consistency.

## Mobile Integration
Capacitor provides the bridge between the web application and native mobile platforms. The configuration supports both iOS and Android deployment with the web build directory set to `dist`. The mobile apps can access device-specific APIs for enhanced fitness tracking integration.

# External Dependencies

## Backend-as-a-Service
- **Convex** - Primary backend service providing real-time database, serverless functions, and automatic API generation
- Real-time data synchronization across all connected clients
- Automatic schema validation and type generation
- Built-in authentication and authorization

## Mobile Platform Integration
- **Capacitor** - Cross-platform mobile app development framework
- Enables deployment to iOS and Android app stores
- Provides access to native device APIs and capabilities
- Bridges web application to mobile platforms

## Development and Build Tools
- **SvelteKit** - Full-stack web framework with SSR capabilities
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool and development server
- **Vitest** - Testing framework with browser and unit testing support
- **Playwright** - End-to-end testing and browser automation
- **ESLint & Prettier** - Code formatting and linting

## Fitness Data Integration
The application is designed to integrate with various fitness tracking services and wearable devices including Fitbit, Apple Health, Garmin, and other popular fitness platforms. The fitness data schema supports multiple data types and sources with proper timestamping and unit tracking.

## Potential Database Extension
While the application currently uses Convex's built-in database, the architecture is designed to potentially support PostgreSQL integration in the future if more complex relational data requirements emerge.