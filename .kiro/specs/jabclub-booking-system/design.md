# Design Document

## Overview

JabClub is a full-stack web application built with Next.js (React) frontend and Node.js/Express backend, using PostgreSQL for data persistence. The system implements role-based access control (RBAC) with three user types: Members, Coaches, and Admins. The application will be deployed on Hostinger with a subdomain configuration (app.jabclub.com).

The architecture follows a client-server model with JWT-based authentication, RESTful API design, and responsive UI components built with TailwindCSS. File uploads (payment screenshots) are stored locally on the Hostinger server with potential future migration to S3.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js App (React + TailwindCSS)              │ │
│  │  - Member Dashboard    - Coach Portal                  │ │
│  │  - Booking Interface   - Admin Panel                   │ │
│  │  - Payment Upload      - Reports                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Express.js API Server                     │ │
│  │  - Authentication Middleware (JWT)                     │ │
│  │  - Authorization Middleware (RBAC)                     │ │
│  │  - Route Controllers                                   │ │
│  │  - Business Logic Services                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
┌───────────────▼──────────┐  ┌────────▼──────────────┐
│    PostgreSQL Database   │  │  File Storage         │
│  - User data             │  │  - Payment screenshots│
│  - Bookings              │  │  (Local/Hostinger)    │
│  - Classes               │  │                       │
│  - Payments              │  │                       │
└──────────────────────────┘  └───────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TailwindCSS for styling
- React Hook Form for form management
- Axios for API calls
- Date-fns for date manipulation
- React Query for server state management

**Backend:**
- Node.js 18+
- Express.js
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- Node-cron for scheduled tasks (credit expiry)

**Database:**
- PostgreSQL 14+
- Prisma ORM for database access

**Deployment:**
- Hostinger VPS/Shared hosting with Node.js support
- PM2 for process management
- Nginx as reverse proxy

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components
- `LoginForm`: Email/password login with validation
- `SignupForm`: Registration with email verification
- `AuthGuard`: HOC for protected routes
- `RoleGuard`: HOC for role-based route protection

#### 2. Member Components
- `MemberDashboard`: Overview of credits, bookings, and expiry
- `PackageSelector`: Grid of available session packages
- `PaymentUpload`: Image upload with preview
- `ClassSchedule`: Calendar/list view of available classes
- `ClassCard`: Individual class display with booking button
- `BookingList`: Upcoming and past bookings
- `ChildrenManager`: CRUD interface for child profiles
- `BookingModal`: Confirmation dialog for booking (self vs child)
- `CancellationModal`: Confirmation dialog with refund info

#### 3. Coach Components
- `CoachDashboard`: Today's and upcoming classes
- `ClassRoster`: List of attendees for a class
- `AttendanceMarker`: Interface to mark present/no-show

#### 4. Admin Components
- `AdminDashboard`: Overview metrics and quick actions
- `PaymentReview`: Queue of pending payments with screenshots
- `BookingManager`: Search and manage all bookings
- `ClassScheduleManager`: CRUD for class instances
- `LocationManager`: CRUD for gym locations
- `PackageManager`: CRUD for session packages
- `CoachManager`: CRUD for coach accounts
- `AttendanceReport`: Charts and tables for attendance data
- `RevenueReport`: Charts and tables for revenue data

#### 5. Shared Components
- `Navbar`: Role-based navigation
- `Sidebar`: Desktop navigation
- `MobileMenu`: Mobile navigation drawer
- `LoadingSpinner`: Loading states
- `ErrorBoundary`: Error handling
- `Toast`: Notification system
- `ConfirmDialog`: Reusable confirmation modal

### Backend API Endpoints

#### Authentication Routes (`/api/auth`)
- `POST /signup` - Register new member
- `POST /login` - Authenticate user
- `POST /logout` - Invalidate token
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile

#### Member Routes (`/api/members`)
- `GET /dashboard` - Get dashboard data (credits, bookings, expiry)
- `GET /packages` - List available session packages
- `POST /purchase` - Create payment record with screenshot
- `GET /bookings` - List member's bookings
- `POST /bookings` - Create new booking
- `DELETE /bookings/:id` - Cancel booking
- `GET /children` - List child profiles
- `POST /children` - Create child profile
- `PUT /children/:id` - Update child profile
- `DELETE /children/:id` - Delete child profile

#### Class Routes (`/api/classes`)
- `GET /schedule` - List available classes with filters
- `GET /:id` - Get class details
- `GET /:id/availability` - Check available spots

#### Coach Routes (`/api/coach`)
- `GET /classes` - List coach's assigned classes
- `GET /classes/:id/roster` - Get class attendees
- `PUT /attendance/:bookingId` - Mark attendance status

#### Admin Routes (`/api/admin`)
- `GET /payments/pending` - List pending payments
- `PUT /payments/:id/approve` - Approve payment
- `PUT /payments/:id/reject` - Reject payment
- `GET /bookings` - List all bookings with filters
- `POST /bookings` - Manually create booking
- `DELETE /bookings/:id` - Cancel booking with refund
- `POST /refund` - Issue manual credit refund
- `GET /classes` - List all class instances
- `POST /classes` - Create class instance
- `PUT /classes/:id` - Update class instance
- `DELETE /classes/:id` - Delete class instance
- `GET /locations` - List locations
- `POST /locations` - Create location
- `PUT /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location
- `GET /packages` - List all packages
- `POST /packages` - Create package
- `PUT /packages/:id` - Update package
- `DELETE /packages/:id` - Deactivate package
- `GET /coaches` - List coaches
- `POST /coaches` - Create coach account
- `PUT /coaches/:id` - Update coach
- `GET /reports/attendance` - Generate attendance report
- `GET /reports/revenue` - Generate revenue report

## Data Models

### Database Schema

```sql
-- Users table (Members, Coaches, Admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('member', 'coach', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Children profiles
CREATE TABLE children (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session packages (templates)
CREATE TABLE session_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  session_count INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  expiry_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member's purchased packages
CREATE TABLE member_packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id INTEGER NOT NULL REFERENCES session_packages(id),
  sessions_remaining INTEGER NOT NULL,
  sessions_total INTEGER NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id INTEGER NOT NULL REFERENCES session_packages(id),
  amount DECIMAL(10, 2) NOT NULL,
  screenshot_path VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class types
CREATE TABLE class_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class instances (scheduled classes)
CREATE TABLE class_instances (
  id SERIAL PRIMARY KEY,
  class_type_id INTEGER NOT NULL REFERENCES class_types(id),
  coach_id INTEGER NOT NULL REFERENCES users(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INTEGER NOT NULL,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  class_instance_id INTEGER NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  member_package_id INTEGER NOT NULL REFERENCES member_packages(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP,
  attendance_marked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_instance_id, user_id, child_id)
);

-- Credit transactions log
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_package_id INTEGER NOT NULL REFERENCES member_packages(id),
  booking_id INTEGER REFERENCES bookings(id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'booking', 'refund', 'expiry')),
  credits_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Relationships

- **Users → Children**: One-to-many (parent can have multiple children)
- **Users → Member_Packages**: One-to-many (member can purchase multiple packages)
- **Users → Bookings**: One-to-many (member can have multiple bookings)
- **Children → Bookings**: One-to-many (child can have multiple bookings)
- **Class_Instances → Bookings**: One-to-many (class can have multiple attendees)
- **Member_Packages → Bookings**: One-to-many (package credits used for bookings)
- **Payments → Session_Packages**: Many-to-one (payments reference package templates)

## Error Handling

### Frontend Error Handling

1. **API Error Interceptor**: Axios interceptor to catch and format API errors
2. **Form Validation**: Client-side validation with React Hook Form
3. **Error Boundaries**: React error boundaries for component-level errors
4. **Toast Notifications**: User-friendly error messages via toast system
5. **Retry Logic**: Automatic retry for failed requests (network issues)

### Backend Error Handling

1. **Global Error Middleware**: Centralized error handler in Express
2. **Custom Error Classes**: 
   - `ValidationError` (400)
   - `AuthenticationError` (401)
   - `AuthorizationError` (403)
   - `NotFoundError` (404)
   - `ConflictError` (409)
   - `ServerError` (500)

3. **Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You don't have enough session credits",
    "details": {
      "required": 1,
      "available": 0
    }
  }
}
```

4. **Database Error Handling**: Catch and transform Prisma errors
5. **File Upload Errors**: Validate file type, size, and handle upload failures
6. **Transaction Rollback**: Use database transactions for critical operations

### Critical Error Scenarios

- **Double Booking Prevention**: Database unique constraint + application-level check
- **Credit Deduction Race Condition**: Use database transactions with row locking
- **Payment Approval Idempotency**: Check payment status before approval
- **Expired Credit Usage**: Validate package expiry before booking
- **Cancellation Window Enforcement**: Server-side time validation
- **File Upload Failures**: Cleanup orphaned files, retry mechanism

## Testing Strategy

### Unit Testing

**Backend (Jest + Supertest):**
- Service layer functions (booking logic, credit calculations)
- Utility functions (date calculations, validation)
- Middleware (authentication, authorization)
- Target: 70%+ code coverage for business logic

**Frontend (Jest + React Testing Library):**
- Component rendering and interactions
- Form validation logic
- Utility functions
- Custom hooks

### Integration Testing

**API Integration Tests:**
- Complete user flows (signup → purchase → book → cancel)
- Payment approval workflow
- Booking with credit deduction
- Cancellation with refund
- Family booking scenarios

**Database Integration:**
- Prisma model operations
- Transaction handling
- Constraint validation

### End-to-End Testing (Optional - Playwright/Cypress)

- Critical user journeys:
  - Member: Sign up → Buy package → Book class → Cancel
  - Admin: Approve payment → Manage schedule
  - Coach: View roster → Mark attendance

### Manual Testing Checklist

- Responsive design on mobile/tablet/desktop
- Cross-browser compatibility (Chrome, Safari, Firefox)
- File upload with various image formats
- Role-based access control
- Real-time data updates
- Performance under load (multiple concurrent bookings)

### Testing Priorities

1. **Critical Path**: Authentication, booking, payment approval
2. **High Priority**: Credit management, cancellation, expiry
3. **Medium Priority**: Reports, admin CRUD operations
4. **Low Priority**: UI edge cases, optional features

## Security Considerations

### Authentication & Authorization

- JWT tokens with 24-hour expiry
- Refresh token mechanism (optional enhancement)
- Password hashing with bcrypt (salt rounds: 10)
- Role-based middleware for route protection
- CORS configuration for subdomain

### Data Protection

- Input validation and sanitization
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping + CSP headers)
- File upload restrictions (type, size, sanitization)
- Rate limiting on sensitive endpoints

### Payment Security

- Payment screenshots stored outside public directory
- Secure file access with authentication
- No sensitive payment data stored (bank details)
- Admin-only access to payment review

### Environment Configuration

- Environment variables for secrets (JWT_SECRET, DB credentials)
- Separate configs for development/production
- Secure file permissions on server

## Performance Optimization

### Frontend

- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Lazy loading for non-critical components
- React Query caching for API responses
- Debouncing for search/filter inputs

### Backend

- Database indexing on frequently queried columns
- Connection pooling for PostgreSQL
- Pagination for list endpoints
- Caching for static data (locations, packages)
- Compression middleware (gzip)

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_class ON bookings(class_instance_id);
CREATE INDEX idx_class_instances_time ON class_instances(start_time);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_member_packages_user ON member_packages(user_id);
CREATE INDEX idx_member_packages_expiry ON member_packages(expiry_date, is_expired);
```

**Query Optimization:**
- Use SELECT specific columns instead of SELECT *
- Eager loading with Prisma includes
- Batch operations where possible

## Deployment Architecture

### Hostinger Setup

1. **Node.js Application**:
   - Deploy Next.js in production mode
   - Use PM2 for process management
   - Environment variables via .env file

2. **Database**:
   - PostgreSQL instance on Hostinger
   - Regular backups (daily)
   - Connection pooling configuration

3. **File Storage**:
   - Local directory for payment screenshots
   - Organized by year/month structure
   - Backup strategy for uploaded files

4. **Subdomain Configuration**:
   - app.jabclub.com → Node.js app
   - Nginx reverse proxy configuration
   - SSL certificate (Let's Encrypt)

5. **Monitoring**:
   - PM2 monitoring for app health
   - Database query logging
   - Error logging to file

### Deployment Process

1. Build Next.js application (`npm run build`)
2. Upload build artifacts to Hostinger
3. Install dependencies (`npm ci --production`)
4. Run database migrations (`npx prisma migrate deploy`)
5. Restart PM2 process
6. Verify deployment health

## Future Enhancements

- Google/Apple OAuth integration
- Email notifications (SendGrid/Mailgun)
- SMS reminders for upcoming classes
- Waitlist functionality for full classes
- Member referral system
- Mobile app (React Native)
- Payment gateway integration (Stripe/PayPal)
- S3 migration for file storage
- Advanced analytics dashboard
- Class rating and feedback system
