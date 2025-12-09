# Multi-Brand CRM Implementation

This document describes the implementation of multi-brand functionality in the CRM system.

## Overview

The multi-brand CRM allows administrators to create and manage multiple brands within a single CRM instance. Users can be assigned to one or more brands, and their access to data is restricted based on their brand assignments.

## Key Features

### 1. Brand Management
- Only administrators (Owner and Admin roles) can create, edit, and delete brands
- Each brand has a name, description, website, and active status
- Brands can be assigned to users for access control

### 2. User Brand Assignment
- Administrators can assign one or more brands to users
- Users can only access data related to their assigned brands
- Brand assignments are stored in the user document

### 3. Role-Based Access Control
- Owner: Full access to all brands and system administration
- Admin: Full access to all brands and user management
- Other roles: Access limited to assigned brands

## Technical Implementation

### Backend Components

1. **Brand Model** (`server/model/brandModel.js`)
   - Defines the structure for brand documents
   - Includes fields for name, description, website, and status

2. **Brand Controller** (`server/controller/brandController.js`)
   - Handles CRUD operations for brands
   - Manages user-brand assignments
   - Implements access control checks

3. **Brand Routes** (`server/routes/brandRoutes.js`)
   - RESTful endpoints for brand management
   - Protected by authentication and authorization middleware

4. **Brand Middleware** (`server/middleware/brandMiddleware.js`)
   - Enforces brand-based access control
   - Filters data based on user's brand assignments

### Frontend Components

1. **Brand Management Page** (`src/components/brandManagement/BrandManagement.jsx`)
   - UI for creating, editing, and deleting brands
   - Available only to administrators

2. **User Brand Assignment Page** (`src/components/brandManagement/UserBrandAssignment.jsx`)
   - UI for assigning brands to users
   - Available only to administrators

3. **Updated User Management** (`src/pages/Settings/UserManagement.jsx`)
   - Integrated brand assignment into user role management

### Database Changes

1. **User Model Enhancement**
   - Added `brands` field to store assigned brand references
   - Populated brand data when fetching users

2. **API Endpoints**
   - `/api/brands` - Brand management endpoints
   - `/api/brands/assign` - User-brand assignment endpoint
   - Enhanced user endpoints to handle brand data

## Usage Instructions

### For Administrators

1. **Create Brands**
   - Navigate to Settings > Brand Management
   - Click "Add Brand" to create new brands
   - Fill in brand details and save

2. **Assign Brands to Users**
   - Navigate to Settings > User Brand Assignment
   - Select a user from the list
   - Choose brands to assign to the user
   - Save assignments

3. **Manage User Roles and Brands**
   - Navigate to Settings > User Management
   - Use "Assign Roles" to update both roles and brand assignments
   - Use "Update" to modify user details

### For Regular Users

- Users can only see and interact with data related to their assigned brands
- Brand filtering is automatically applied throughout the application

## Security Considerations

- All brand management operations require administrator privileges
- Brand-based access control is enforced at both API and UI levels
- User brand assignments are validated before granting access
- Data isolation ensures users cannot access information from unassigned brands

## Future Enhancements

- Brand-specific dashboards and reporting
- Brand-based notification systems
- Advanced brand permissions and hierarchies
- Brand analytics and performance tracking