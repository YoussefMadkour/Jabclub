# QR Code Check-In Feature

## Overview

The QR Code Check-In feature allows members to generate unique QR codes for their upcoming class bookings, and coaches to scan these codes to quickly verify and mark attendance.

## Features

### 🔐 Security Features
- **Cryptographic Signatures**: Each QR code contains a signed payload that prevents tampering and forgery
- **Time-based Expiry**: QR codes are only valid within 3 hours of generation
- **Access Window**: QR codes can only be generated 2 hours before class starts
- **One-time Use**: QR codes become invalid after successful check-in
- **Class Timing Validation**: Attendance can only be marked 1 hour before to 1 hour after class

### 👤 Member Features
- **QR Code Generation**: Members can generate QR codes for confirmed bookings
- **Automatic QR Availability**: QR codes only become available 2 hours before class
- **Class Information Display**: Shows class details when viewing QR code
- **Family Support**: Works for both member and child bookings

### 🎯 Coach Features
- **Camera-based Scanning**: Use device camera to scan QR codes in real-time
- **File Upload Fallback**: Upload QR code image if camera is unavailable
- **Duplicate Prevention**: Prevents scanning the same QR code within 3 seconds
- **Success Confirmation**: Visual feedback when check-in is successful
- **Auto-refresh**: Scanner resumes automatically after 3 seconds
- **Error Handling**: Clear error messages for invalid/expired QR codes

## API Endpoints

### POST /api/qr/generate/:bookingId
Generate a QR code for a specific booking.

**Authentication**: Required (Member only)

**Request**:
- `bookingId` (path parameter): ID of the booking

**Response**:
```json
{
  "qrCode": "data:image/png;base64,...",
  "bookingId": 123,
  "classInfo": {
    "className": "Boxing Fundamentals",
    "date": "2026-01-25T10:00:00Z",
    "location": "Main Studio",
    "coach": "John Smith",
    "forChild": "Jane Doe (Child)"
  },
  "expiresAt": "2026-01-25T11:00:00Z"
}
```

**Error Cases**:
- `401 Unauthorized`: Not logged in
- `403 Access denied`: Booking doesn't belong to user
- `404 Not found`: Booking doesn't exist
- `400 Bad request`:
  - Booking already attended/cancelled
  - Too early (more than 2 hours before class)

### POST /api/qr/validate
Validate a QR code and mark attendance.

**Authentication**: Required (Coach or Admin only)

**Request Body**:
```json
{
  "qrData": "{\"bookingId\":123,\"userId\":456,\"timestamp\":\"...\",\"signature\":\"...\"}"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "booking": {
    "id": 123,
    "member": "Jane Doe",
    "isChild": true,
    "class": "Boxing Fundamentals",
    "checkedInAt": "2026-01-25T10:05:00Z",
    "classTime": "2026-01-25T10:00:00Z"
  }
}
```

**Error Cases**:
- `401 Unauthorized`: Not logged in or not a coach/admin
- `403 Access denied`:
  - Not the assigned coach for this class
  - User is not a coach/admin
- `400 Bad request`:
  - Invalid QR code format
  - Invalid QR code signature
  - QR code has expired (>3 hours old)
  - Attendance already marked
  - Booking has been cancelled
  - Too early to mark attendance (>1 hour before class)
  - Too late to mark attendance (>1 hour after class ended)

### GET /api/qr/status/:bookingId
Check if a QR code can be generated for a booking.

**Authentication**: Required (Member only)

**Response**:
```json
{
  "bookingId": 123,
  "status": "confirmed",
  "canGenerateQR": true,
  "hoursUntilClass": 1.5,
  "classStartTime": "2026-01-25T10:00:00Z",
  "attendanceMarkedAt": null
}
```

## Environment Variables

Add to your backend `.env` file:

```env
# QR Code signature secret for security
# Must be a random 64+ character string in production
QR_SECRET=change-this-to-a-random-64-character-string-in-production
```

## Installation

### Backend Dependencies
```bash
cd backend
npm install qrcode
npm install --save-dev @types/qrcode
```

### Frontend Dependencies
```bash
cd frontend
npm install react-qr-code
npm install react-qr-scanner
npm install jsqr
npm install @heroicons/react
```

## Usage

### For Members

1. Go to Dashboard and view upcoming classes
2. Wait until 2 hours before class start
3. Click "Get QR Code" button on your booking
4. A modal will display your unique QR code
5. Show the QR code to your coach when you arrive at class

**Note**: QR codes are only valid until the class ends

### For Coaches

1. Go to Class Roster for your assigned class
2. Click the purple "Scan QR Code" button
3. Use the camera to scan the member's QR code OR
4. Or click "Use File Upload Instead" to upload a QR code image
5. The system will validate the QR code and mark attendance automatically
6. Wait 3 seconds for the scanner to resume for next member

**Important**: You can only check in members for classes you're assigned to (or as admin, any class)

## Security Considerations

### QR Code Payload Structure
```typescript
{
  bookingId: number;      // The booking being checked in
  userId: number;         // The member ID
  childId?: number;       // Child ID if for child booking
  timestamp: string;       // ISO timestamp of generation
  signature: string;       // HMAC-SHA256 signature
}
```

### Signature Generation
```typescript
const secret = process.env.QR_SECRET;
const data = `${bookingId}:${userId}:${timestamp}`;
const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
```

### Validation Rules
1. ✅ QR code signature must match expected value
2. ✅ QR code must be less than 3 hours old
3. ✅ Class must be within ±1 hour window
4. ✅ Booking must belong to the scanning coach
5. ✅ Booking must have "confirmed" status
6. ✅ Prevent duplicate scans within 3 seconds

## Component Locations

### Frontend Components
- `components/dashboard/QRCodeModal.tsx` - Displays QR code to members
- `components/coach/QRScannerWithFallback.tsx` - Scans QR codes for coaches
- `components/coach/ClassRoster.tsx` - Updated with QR scanner integration

### Backend Routes
- `src/routes/qrRoutes.ts` - QR code API endpoints

## Testing

### Test Scenarios

1. **Member generates QR code too early** → Should show error "QR codes only available 2 hours before class"
2. **Coach scans invalid QR** → Should show error "Invalid QR code signature"
3. **Coach scans expired QR** → Should show error "QR code has expired"
4. **Coach scans wrong class QR** → Should show error "You are not assigned to this class"
5. **Coach scans already attended** → Should show success with "Attendance already marked"
6. **Member generates valid QR** → Should display QR code with class info
7. **Coach scans valid QR** → Should show "Scan Successful" and mark attendance

## Troubleshooting

### Members
**Problem**: "Get QR Code" button is disabled
- **Solution**: Wait until 2 hours before class start

**Problem**: "Failed to generate QR code"
- **Solution**: Ensure booking is confirmed and not cancelled/attended

### Coaches
**Problem**: Camera won't start
- **Solution**: Use "Use File Upload Instead" button, or check browser permissions

**Problem**: "Could not access camera"
- **Solution**: Ensure HTTPS (required for camera access in some browsers), allow camera permissions

**Problem**: QR code not scanning
- **Solution**: Ensure good lighting, hold QR code steady within green frame

## Browser Compatibility

### Camera Requirements
- ✅ Chrome (desktop & mobile)
- ✅ Safari (requires HTTPS)
- ✅ Firefox (desktop & mobile)
- ✅ Edge (desktop & mobile)

### Required Permissions
- Camera access for scanner
- May require HTTPS in production for camera

## Future Enhancements

- [ ] Offline QR code caching for members
- [ ] Push notification when QR code becomes available
- [ ] Bulk check-in for multiple members
- [ ] Check-in history/report
- [ ] QR code analytics (scan times, location, etc.)
- [ ] Alternative authentication (NFC, Bluetooth)
