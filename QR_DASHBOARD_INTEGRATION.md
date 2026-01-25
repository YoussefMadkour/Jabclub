# QR Code Dashboard Integration - Final Steps

## Status
✅ Backend: Fully implemented and ready
✅ Frontend Components: Created
✅ Coach Roster: Integrated with QR scanner
⏳ Member Dashboard: Needs simple button and modal addition (~10 minutes)

## What to Add to MemberDashboard.tsx

### Step 1: Add QR Code Modal State (Already Done!)
The state variables are already in the file:
- `isQRModalOpen` - Controls modal visibility
- `qrData` - Stores QR code response
- `qrLoading` - Loading state
- `qrError` - Error state
- `selectedBooking` - Currently selected booking

### Step 2: Add handleGenerateQRCode Function (Already Done!)
Function is already defined near line 39:
```typescript
const handleGenerateQRCode = async (bookingId: number) => {
  setQrLoading(true);
  setQrError(null);
  setSelectedBooking(upcomingBookings.find((b: any) => b.id === bookingId));
  try {
    const response = await apiClient.post(`/qr/generate/${bookingId}`);
    setQrData(response.data);
    setIsQRModalOpen(true);
  } catch (error: any) {
    setQrError(error.response?.data?.error || 'Failed to generate QR code');
  } finally {
    setQrLoading(false);
  }
};
```

### Step 3: Add "Get QR Code" Button to Booking Cards (~5 min)

In the upcoming bookings section, find where the "Cancel Booking" button is.
Add the QR Code button right before or after it.

**Location**: Around line 320-324 in the booking card

**Add this button**:
```typescript
{/* Get QR Code Button */}
{canCancel && (
  <button
    onClick={() => handleGenerateQRCode(booking.id)}
    disabled={qrLoading && selectedBooking?.id === booking.id}
    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    title="Get your check-in QR code for this class"
  >
    {qrLoading && selectedBooking?.id === booking.id ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 0 4 4 0 00-4 4 0 004zm0 8a8 8 0 01-16 0 4 4 0 014 4 4 01 8 0 00-4-4 4-014z"></path>
        </svg>
        Loading...
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m4 0h4m-4 0h4m-9-7V9a2 2 0 012-2h10a2 2 0 012 2v9m-6 0h6" />
        </svg>
        Get QR Code
      </span>
    )}
  </button>
)}
```

**Important Notes**:
- Only show button if `canCancel` is true (within cancellation window)
- Disable button if QR code is loading for this booking
- Show loading spinner when generating
- Button is purple to distinguish from red Cancel button

### Step 4: Add QR Code Modal to Return (~3 min)

At the very end of the return statement, just before the final closing `</div>`, add the QR modal.

**Location**: Around line 446, after the CancellationModal

**Add this**:
```typescript
{/* QR Code Modal */}
<QRCodeModal
  isOpen={isQRModalOpen}
  onClose={() => setIsQRModalOpen(false)}
  qrData={qrData?.qrCode}
  classInfo={qrData?.classInfo}
  isLoading={qrLoading}
  error={qrError}
/>
```

## Complete Structure

The final structure around the modal section should look like:

```typescript
      {/* Cancellation Modal */}
      {selectedBooking && (
        <CancellationModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedBooking(null);
          }}
          onConfirm={handleCancelConfirm}
          booking={selectedBooking}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrData={qrData?.qrCode}
        classInfo={qrData?.classInfo}
        isLoading={qrLoading}
        error={qrError}
      />
    </div>
```

## Testing Checklist

After completing the integration:

1. ✅ Start backend server (`cd backend && npm run dev`)
2. ✅ Start frontend server (`cd frontend && npm run dev`)
3. ✅ Login as a member with an upcoming booking
4. ✅ Wait until 2 hours before class
5. ✅ Click "Get QR Code" button
6. ✅ Verify QR code modal displays
7. ✅ Take a screenshot or note the QR code
8. ✅ Login as a coach
9. ✅ Go to class roster
10. ✅ Click "Scan QR Code" button
11. ✅ Scan the QR code
12. ✅ Verify attendance is marked
13. ✅ Check dashboard shows booking as attended

## Troubleshooting

### Button doesn't appear
- Check that you added the button in the correct location
- Verify `canCancel` variable exists
- Make sure you're inside the booking `.map()` loop

### Modal doesn't open
- Check that state variable names match (`isQRModalOpen`, `qrData`)
- Verify imports include `QRCodeModal`
- Check console for JavaScript errors

### QR code doesn't generate
- Check that booking ID is passed correctly
- Check browser console for API errors
- Verify backend is running
- Check `QR_SECRET` environment variable is set

### Scanner doesn't work
- Check browser console for camera permission errors
- Try file upload option if camera fails
- Ensure HTTPS in production (required for camera)

## Quick Reference

**Button Condition**: `{canCancel && ( ... button code ... )}`
- This ensures QR codes only show when cancellable (within 2 hours)

**Modal Props**:
```typescript
isOpen={isQRModalOpen}           // Controls visibility
onClose={() => setIsQRModalOpen(false)}  // Close handler
qrData={qrData?.qrCode}          // QR code image (base64)
classInfo={qrData?.classInfo}       // Class details
isLoading={qrLoading}               // Loading state
error={qrError}                    // Error message
```

---

**Estimated Time to Complete**: 10 minutes
**Difficulty**: Easy (adding button + modal)
**Files to Edit**: 1 (`frontend/components/dashboard/MemberDashboard.tsx`)

**Success Criteria**:
- [ ] "Get QR Code" button appears on booking cards
- [ ] Clicking button opens QR code modal
- [ ] Modal displays QR code with class info
- [ ] QR code scans successfully
- [ ] Attendance is marked automatically
