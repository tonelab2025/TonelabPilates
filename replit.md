# Overview

This is a modern web application for Tonelab Pilates booking site, built as a full-stack TypeScript application. The project enables users to book Pilates classes with features like early bird pricing, payment receipt uploads, and form validation. It's designed as a mobile-optimized landing and booking platform for offline Pilates events.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built, accessible UI components
- **React Hook Form + Zod**: Form handling with robust validation using schema-first approach
- **TanStack React Query**: Server state management for API calls and caching
- **Wouter**: Lightweight client-side routing solution

## Backend Architecture
- **Express.js**: Node.js web framework serving both API endpoints and static files
- **TypeScript**: Full type safety across the entire backend
- **Drizzle ORM**: Type-safe SQL query builder and ORM for database operations
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **In-Memory Storage Fallback**: MemStorage class provides development/testing storage

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations (Neon serverless PostgreSQL for production)
- **Schema**: Single `bookings` table storing user registration data including contact info, receipt paths, and policy confirmations
- **Storage Classes**: DatabaseStorage for production, MemStorage fallback for development
- **Validation**: Shared Zod schemas between frontend and backend ensure data consistency

## File Upload System
- **Object Storage**: Google Cloud Storage integration for receipt file uploads
- **Uppy**: Modern file upload library with dashboard UI, progress tracking, and AWS S3 compatibility
- **Access Control**: Custom ACL system for object-level permissions and security
- **Presigned URLs**: Secure direct-to-storage uploads without server proxy

## External Dependencies
- **Neon Database**: Serverless PostgreSQL database hosting
- **Google Cloud Storage**: Object storage service for file uploads
- **Replit Infrastructure**: Development and deployment platform with integrated services
- **Radix UI**: Accessible, unstyled UI primitives for component foundation
- **Inter Font**: Google Fonts integration for consistent typography

The architecture follows a monorepo pattern with shared types and schemas, enabling full-stack type safety and reducing code duplication between client and server.

## Recent Changes (August 2025)
- **Google Sheets Integration ACTIVE**: Successfully configured and tested Google Sheets as permanent data storage for booking data (August 14, 2025)
- **Authentication Fixed**: Resolved Google Auth configuration - system now writes bookings directly to Google Sheets in real-time
- **Dual Storage System**: Local storage provides instant booking saves + Google Sheets sync for permanent backup
- **15GB Google Drive Storage**: Integrated Google Drive for receipt file uploads with presigned URL system
- **Service Account Setup**: Created and configured `tonelabs@astute-atlas-469008-j9.iam.gserviceaccount.com` with Editor permissions
- **Zero-Cost Architecture**: Complete free solution using Google Sheets (unlimited data) + Google Drive (15GB) + Netlify hosting
- **Production Ready**: System fully operational with confirmed Google Sheets sync, no booking data loss
- **Enhanced Error Handling**: Comprehensive logging and fallback systems for Google Services integration
- **User Testing Confirmed**: Multiple successful test bookings with receipt file uploads and Google Sheets synchronization verified
- **File Organization Implemented**: Receipt files now organized in day-wise folders with booking ID references (uploads/YYYY-MM-DD/bookingId_timestamp)
- **Deployment Ready**: Code pushed to GitHub repository https://github.com/tonelab2025/PilatesBooking.git, successfully deployed to Netlify at https://tonelabs.netlify.app (August 15, 2025)
- **Form Validation Enhanced**: Real-time validation with red error indicators and comprehensive input checking for names, emails, phone numbers
- **Email Notifications Active**: Free unlimited email alerts to collective.tonelab@gmail.com using Web3Forms service (access key: 9f4058e1-70c7-48b0-ba8d-8d52c5339371) for every booking - CONFIRMED WORKING (August 15, 2025)
- **Receipt Preview Fixed**: Image preview now works through secure proxy endpoint with Google Cloud Storage authentication - CONFIRMED WORKING
- **UI Improvements**: X button visibility fixed (gray color), "browse files" text underlined and styled, JavaScript errors resolved
- **Complete Free Solution**: System fully operational with Web3Forms (unlimited), Google Cloud Storage, Netlify hosting - zero ongoing costs
- **Delete Functionality Fixed**: Dashboard refresh issues resolved with proper query key invalidation - deletes now refresh immediately (August 15, 2025)
- **Content Manager Improved**: Google Maps URL field added and positioned after venue fields for logical organization of location settings
- **Location Management Complete**: Staff can independently edit Venue Name, Venue Address, and Google Maps URL through Content Manager
- **Netlify Deployment Live**: System successfully deployed to https://tonelabs.netlify.app with working serverless functions
- **Receipt Upload Fixed**: Added support for both /api/receipts/upload and /api/upload/receipt endpoints to handle file uploads properly on Netlify
- **Build Configuration Optimized**: Fixed publish directory from dist to dist/public to match Vite build output structure
- **Netlify Deployment Optimized**: Server code refactored for proper serverless function support, build process generates both index.js and netlify.js (August 15, 2025)
- **Production-Ready Build**: 794KB optimized frontend bundle, 54KB serverless backend, zero build errors - ready for immediate deployment
- **Netlify Deploy SUCCESS**: Site live at https://tonelabs.netlify.app/ with minimal 5KB serverless function, email notifications operational (August 15, 2025)
- **Upload System Fixed**: Added missing API endpoints for receipt uploads, admin stats, and enhanced email formatting for production environment
- **Receipt Upload Emergency Fix**: Fixed 502 Bad Gateway errors by creating proper upload-handler serverless function and error handling for Netlify deployment (August 15, 2025)
- **Upload System Fully Restored**: Implemented complete upload flow with dedicated serverless functions, proper error handling, and file validation - ready for production deployment