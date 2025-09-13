# CivicReport - Crowdsourced Civic Issue Reporting System

## Overview

CivicReport is a comprehensive web-based crowdsourced civic issue reporting system that enables citizens to report civic problems, administrators to manage and resolve issues, and provides role-based access control for different user types. The system supports three user roles: Citizens (who report issues), Admins (who manage assigned issues), and Super Admins (who have full system oversight). Citizens can submit detailed issue reports with media attachments, upvote existing issues, and track their submissions through a complete workflow from "Not Assigned" to "Assigned" to "Resolved".

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based single-page application (SPA) architecture built with TypeScript and Vite for development tooling. The UI framework is built around Shadcn/UI components with Tailwind CSS for styling, providing a consistent and responsive design system. Client-side routing is handled by Wouter, a lightweight routing library. The frontend implements role-based rendering to show different interfaces based on user permissions.

### Backend Architecture
The server follows a traditional Express.js REST API architecture with TypeScript. Authentication is implemented using Passport.js with local strategy and session-based authentication stored in PostgreSQL. The API endpoints are organized by functionality (auth, issues, users, admins) with proper middleware for authentication and authorization checks. File uploads are handled using Multer middleware for processing images and videos.

### Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes users, issues, categories, upvotes, and assignments tables with proper foreign key relationships. The Neon Database serverless PostgreSQL service is used for cloud hosting. Session data is persisted in the database using connect-pg-simple for Express sessions.

### State Management
Client-side state is managed using TanStack Query (React Query) for server state management, caching, and synchronization. Form state is handled by React Hook Form with Zod schema validation for type-safe form handling. Authentication state is managed through a custom React context provider that wraps the TanStack Query auth endpoints.

### File Handling
Media file uploads (images and videos) are processed on the server with validation for file types and size limits. Files are stored with generated URLs that are saved to the database and referenced in issue records.

### Security Architecture
The system implements role-based access control (RBAC) with three distinct roles. Password hashing uses the built-in Node.js crypto module with scrypt for secure password storage. Protected routes are implemented on both frontend and backend with middleware that checks authentication status and user roles before allowing access to sensitive operations.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting service for cloud-based data storage
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL with migration support

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy for email/password login
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **bcryptjs**: Password hashing library for secure credential storage

### Frontend Libraries
- **React**: Core frontend framework for building the user interface
- **TanStack Query**: Server state management and data fetching library
- **Wouter**: Lightweight client-side routing library
- **React Hook Form**: Form state management with validation
- **Zod**: TypeScript-first schema validation library

### UI Framework
- **Shadcn/UI**: Pre-built component library based on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Radix UI**: Headless UI component primitives for accessibility

### Development Tools
- **Vite**: Modern build tool and development server
- **TypeScript**: Static type checking for JavaScript
- **ESBuild**: Fast JavaScript bundler for production builds

### File Processing
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **File Type Validation**: Server-side validation for image and video file types with size limits

### Geographic Data
- **State/City API**: Custom endpoints for hierarchical location selection (states and cities within states)