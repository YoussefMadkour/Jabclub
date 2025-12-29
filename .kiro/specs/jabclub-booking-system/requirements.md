# Requirements Document

## Introduction

JabClub is a web-based booking and member management system for a boxing gym. The system enables members to purchase session packages, book classes, manage family accounts, and track their bookings. Coaches can manage class attendance, and administrators can oversee payments, schedules, locations, and generate reports. The application will be deployed on Hostinger as a subdomain (app.jabclub.com) while the main WordPress site remains separate.

## Glossary

- **JabClub_System**: The web application for booking and member management
- **Member**: A registered user who can purchase sessions and book classes
- **Child_Profile**: A dependent account linked to a Member for booking classes
- **Session_Credit**: A unit of currency representing one class booking
- **Session_Package**: A purchasable bundle of Session_Credits with an expiry period
- **Class_Instance**: A specific scheduled class with date, time, location, and coach
- **Booking**: A reservation for a Class_Instance using Session_Credits
- **Payment_Screenshot**: An uploaded image proof of bank transfer or mobile payment
- **Coach**: A staff user who can view class rosters and confirm attendance
- **Admin**: A staff user with full system management capabilities
- **Cancellation_Window**: The 1-hour period before a class during which cancellations are not permitted

## Requirements

### Requirement 1: User Authentication and Registration

**User Story:** As a potential member, I want to create an account with email and password, so that I can access the booking system.

#### Acceptance Criteria

1. WHEN a user submits valid registration details, THE JabClub_System SHALL create a new Member account
2. WHEN a user submits login credentials, THE JabClub_System SHALL authenticate using JWT tokens
3. THE JabClub_System SHALL validate email format and password strength during registration
4. WHEN authentication fails, THE JabClub_System SHALL display an error message to the user
5. THE JabClub_System SHALL maintain user session state across page navigation

### Requirement 2: Member Dashboard

**User Story:** As a member, I want to view my account summary on a dashboard, so that I can see my available credits and upcoming bookings.

#### Acceptance Criteria

1. WHEN a Member accesses the dashboard, THE JabClub_System SHALL display remaining Session_Credits
2. WHEN a Member accesses the dashboard, THE JabClub_System SHALL display upcoming Bookings sorted by date
3. WHEN a Member accesses the dashboard, THE JabClub_System SHALL display past Bookings
4. WHEN a Member has an active Session_Package, THE JabClub_System SHALL display the expiry date
5. THE JabClub_System SHALL update dashboard data in real-time when bookings or credits change

### Requirement 3: Session Package Purchase

**User Story:** As a member, I want to purchase session packages by uploading payment proof, so that I can obtain credits for booking classes.

#### Acceptance Criteria

1. WHEN a Member selects a Session_Package, THE JabClub_System SHALL display package details including session count and expiry period
2. WHEN a Member uploads a Payment_Screenshot, THE JabClub_System SHALL store the image and create a pending payment record
3. WHEN a Member submits a payment, THE JabClub_System SHALL set the payment status to "Pending"
4. THE JabClub_System SHALL support image formats including JPEG, PNG, and HEIC
5. WHEN a payment upload fails, THE JabClub_System SHALL display an error message with retry option

### Requirement 4: Payment Approval

**User Story:** As an admin, I want to review and approve payment screenshots, so that I can verify legitimate purchases before granting credits.

#### Acceptance Criteria

1. WHEN an Admin accesses the payment review interface, THE JabClub_System SHALL display all pending payments with Payment_Screenshots
2. WHEN an Admin approves a payment, THE JabClub_System SHALL add Session_Credits to the Member account
3. WHEN an Admin rejects a payment, THE JabClub_System SHALL notify the Member with rejection reason
4. WHEN a payment is approved, THE JabClub_System SHALL set the Session_Package expiry date
5. THE JabClub_System SHALL prevent duplicate credit allocation for the same payment

### Requirement 5: Class Schedule Browsing

**User Story:** As a member, I want to browse available classes with filters, so that I can find classes that fit my schedule and preferences.

#### Acceptance Criteria

1. WHEN a Member accesses the class schedule, THE JabClub_System SHALL display all upcoming Class_Instances
2. WHEN a Member applies a location filter, THE JabClub_System SHALL display only Class_Instances at the selected location
3. WHEN a Member applies a date filter, THE JabClub_System SHALL display only Class_Instances on the selected date
4. WHEN a Member applies a coach filter, THE JabClub_System SHALL display only Class_Instances with the selected coach
5. THE JabClub_System SHALL display class capacity and available spots for each Class_Instance

### Requirement 6: Class Booking

**User Story:** As a member, I want to book classes using my session credits, so that I can reserve my spot in a class.

#### Acceptance Criteria

1. WHEN a Member with sufficient Session_Credits books a Class_Instance, THE JabClub_System SHALL create a confirmed Booking
2. WHEN a Member books a class, THE JabClub_System SHALL deduct one Session_Credit from their balance
3. WHEN a Member attempts to book without sufficient credits, THE JabClub_System SHALL prevent the booking and display an error message
4. WHEN a Class_Instance reaches capacity, THE JabClub_System SHALL prevent additional bookings
5. WHEN a booking is confirmed, THE JabClub_System SHALL send a confirmation notification to the Member

### Requirement 7: Booking Cancellation

**User Story:** As a member, I want to cancel my bookings with credit refund, so that I can adjust my schedule when needed.

#### Acceptance Criteria

1. WHEN a Member cancels a Booking outside the Cancellation_Window, THE JabClub_System SHALL refund one Session_Credit to their balance
2. WHEN a Member attempts to cancel within the Cancellation_Window, THE JabClub_System SHALL prevent cancellation and display a message
3. WHEN a booking is cancelled, THE JabClub_System SHALL remove the Booking from the Member's schedule
4. WHEN a booking is cancelled, THE JabClub_System SHALL increase the available capacity for the Class_Instance
5. THE JabClub_System SHALL calculate the Cancellation_Window as 1 hour before the Class_Instance start time

### Requirement 8: Children Profile Management

**User Story:** As a member, I want to create and manage profiles for my children, so that I can book classes on their behalf.

#### Acceptance Criteria

1. WHEN a Member creates a Child_Profile, THE JabClub_System SHALL link the profile to the Member account
2. WHEN a Member adds a Child_Profile, THE JabClub_System SHALL require name and age information
3. WHEN a Member views their children, THE JabClub_System SHALL display all linked Child_Profiles
4. WHEN a Member edits a Child_Profile, THE JabClub_System SHALL update the profile information
5. WHEN a Member deletes a Child_Profile, THE JabClub_System SHALL cancel all future Bookings for that child

### Requirement 9: Family Booking

**User Story:** As a member with children, I want to book classes for myself or my children, so that my family can attend classes using my session credits.

#### Acceptance Criteria

1. WHEN a Member with Child_Profiles books a class, THE JabClub_System SHALL prompt selection between self and children
2. WHEN a Member books for a Child_Profile, THE JabClub_System SHALL deduct Session_Credits from the Member's balance
3. WHEN a Member views bookings, THE JabClub_System SHALL display which family member each Booking is for
4. THE JabClub_System SHALL allow multiple family members to book the same Class_Instance
5. WHEN a Child_Profile booking is created, THE JabClub_System SHALL associate the Booking with the child's name

### Requirement 10: Session Credit Expiry

**User Story:** As a member, I want to see when my credits expire, so that I can use them before they become invalid.

#### Acceptance Criteria

1. WHEN a Session_Package is activated, THE JabClub_System SHALL set an expiry date based on the package duration
2. WHEN the expiry date passes, THE JabClub_System SHALL mark unused Session_Credits as expired
3. WHEN a Member views their dashboard, THE JabClub_System SHALL display days remaining until expiry
4. WHEN Session_Credits are about to expire, THE JabClub_System SHALL send a reminder notification to the Member
5. THE JabClub_System SHALL prevent booking with expired Session_Credits

### Requirement 11: Coach Class Roster

**User Story:** As a coach, I want to view attendees for my classes, so that I can prepare for the session and track who is coming.

#### Acceptance Criteria

1. WHEN a Coach accesses their schedule, THE JabClub_System SHALL display Class_Instances assigned to that Coach
2. WHEN a Coach selects a Class_Instance, THE JabClub_System SHALL display all confirmed Bookings with member names
3. WHEN a Coach views today's classes, THE JabClub_System SHALL highlight current and upcoming sessions
4. THE JabClub_System SHALL display whether each Booking is for a Member or Child_Profile
5. WHEN a Coach views a class roster, THE JabClub_System SHALL show the total number of attendees

### Requirement 12: Attendance Confirmation

**User Story:** As a coach, I want to mark attendance for class participants, so that accurate records are maintained.

#### Acceptance Criteria

1. WHEN a Coach marks a Booking as attended, THE JabClub_System SHALL record the attendance timestamp
2. WHEN a Coach marks a Booking as no-show, THE JabClub_System SHALL record the no-show status
3. WHEN a Member is marked as no-show, THE JabClub_System SHALL not refund the Session_Credit
4. THE JabClub_System SHALL allow attendance marking only on the day of the Class_Instance
5. WHEN attendance is confirmed, THE JabClub_System SHALL update the Member's attendance history

### Requirement 13: Admin Booking Management

**User Story:** As an admin, I want to view and manage all bookings, so that I can resolve issues and handle special cases.

#### Acceptance Criteria

1. WHEN an Admin accesses booking management, THE JabClub_System SHALL display all Bookings across all Class_Instances
2. WHEN an Admin cancels a Booking, THE JabClub_System SHALL refund the Session_Credit regardless of timing
3. WHEN an Admin views a Class_Instance, THE JabClub_System SHALL display all associated Bookings
4. THE JabClub_System SHALL allow Admins to manually create Bookings for Members
5. WHEN an Admin issues a manual refund, THE JabClub_System SHALL add Session_Credits to the Member's balance

### Requirement 14: Schedule and Location Management

**User Story:** As an admin, I want to manage class schedules and locations, so that I can keep the system updated with current offerings.

#### Acceptance Criteria

1. WHEN an Admin creates a Class_Instance, THE JabClub_System SHALL require date, time, location, coach, and capacity
2. WHEN an Admin edits a Class_Instance, THE JabClub_System SHALL update the schedule and notify affected Members
3. WHEN an Admin deletes a Class_Instance with Bookings, THE JabClub_System SHALL refund Session_Credits to all Members
4. THE JabClub_System SHALL allow Admins to create recurring Class_Instances
5. WHEN an Admin adds a location, THE JabClub_System SHALL make it available for Class_Instance creation

### Requirement 15: Package Management

**User Story:** As an admin, I want to create and modify session packages, so that I can offer different pricing options to members.

#### Acceptance Criteria

1. WHEN an Admin creates a Session_Package, THE JabClub_System SHALL require session count, price, and expiry duration
2. WHEN an Admin edits a Session_Package, THE JabClub_System SHALL apply changes only to new purchases
3. WHEN an Admin deactivates a Session_Package, THE JabClub_System SHALL hide it from the purchase interface
4. THE JabClub_System SHALL display all active Session_Packages to Members during purchase
5. WHEN an Admin views packages, THE JabClub_System SHALL show purchase statistics for each package

### Requirement 16: Attendance Reports

**User Story:** As an admin, I want to view attendance reports, so that I can analyze class popularity and member engagement.

#### Acceptance Criteria

1. WHEN an Admin requests an attendance report, THE JabClub_System SHALL display total attendees per Class_Instance
2. WHEN an Admin filters by date range, THE JabClub_System SHALL display attendance data for that period
3. WHEN an Admin views attendance, THE JabClub_System SHALL calculate no-show rates
4. THE JabClub_System SHALL display most attended Class_Instances
5. WHEN an Admin exports a report, THE JabClub_System SHALL generate a downloadable file with attendance data

### Requirement 17: Revenue Reports

**User Story:** As an admin, I want to view revenue from session purchases, so that I can track business performance.

#### Acceptance Criteria

1. WHEN an Admin accesses revenue reports, THE JabClub_System SHALL display total revenue from approved payments
2. WHEN an Admin filters by date range, THE JabClub_System SHALL calculate revenue for that period
3. WHEN an Admin views revenue, THE JabClub_System SHALL break down sales by Session_Package type
4. THE JabClub_System SHALL display pending payment value separately from confirmed revenue
5. WHEN an Admin exports revenue data, THE JabClub_System SHALL generate a downloadable report

### Requirement 18: Responsive Design

**User Story:** As a user on any device, I want the application to work seamlessly, so that I can access features on mobile or desktop.

#### Acceptance Criteria

1. WHEN a user accesses the JabClub_System on mobile, THE JabClub_System SHALL display a mobile-optimized interface
2. WHEN a user accesses the JabClub_System on desktop, THE JabClub_System SHALL display a desktop-optimized interface
3. THE JabClub_System SHALL maintain functionality across screen sizes from 320px to 2560px width
4. WHEN a user rotates their device, THE JabClub_System SHALL adapt the layout appropriately
5. THE JabClub_System SHALL ensure touch targets are minimum 44x44 pixels on mobile devices
