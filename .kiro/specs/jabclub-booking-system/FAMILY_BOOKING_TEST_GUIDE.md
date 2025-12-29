# Family Booking Functionality - Test Guide

## Overview
This guide provides step-by-step instructions to test the family booking functionality implemented in Task 11.

## Prerequisites
- Backend server running on configured port
- Frontend application running
- Test user account with member role
- At least one active session package with credits

## Test Scenarios

### Scenario 1: Book Class for Self

**Steps:**
1. Log in as a member
2. Navigate to Classes page
3. Select a class and click "Book"
4. In the BookingModal, verify dropdown shows "Yourself" selected by default
5. Click "Confirm Booking"
6. Verify success message appears
7. Navigate to Dashboard
8. Verify booking appears in "Upcoming Classes" section
9. Verify booking shows "Self" or no child indicator

**Expected Results:**
- ✅ Booking created successfully
- ✅ Credit deducted from member's balance
- ✅ Booking appears without child badge
- ✅ "Booked For" shows "Self"

### Scenario 2: Add Child Profile

**Steps:**
1. Navigate to Children page (or Children Manager in Dashboard)
2. Click "Add Child" button
3. Enter child details:
   - First Name: "Emma"
   - Last Name: "Smith"
   - Age: 10
4. Click "Save" or "Add Child"
5. Verify child appears in the list

**Expected Results:**
- ✅ Child profile created successfully
- ✅ Child appears in children list
- ✅ Child is linked to parent account

### Scenario 3: Book Class for Child

**Steps:**
1. Navigate to Classes page
2. Select a class and click "Book"
3. In the BookingModal, click the dropdown "Book this class for:"
4. Verify dropdown shows:
   - "Yourself"
   - "Emma Smith (Age 10)"
5. Select "Emma Smith (Age 10)"
6. Verify confirmation summary shows "For: Emma Smith"
7. Click "Confirm Booking"
8. Verify success message appears
9. Navigate to Dashboard
10. Verify booking appears in "Upcoming Classes" section
11. Verify booking has purple badge with "Emma Smith"

**Expected Results:**
- ✅ Booking created for child
- ✅ Credit deducted from parent's balance (not child's)
- ✅ Booking appears with purple badge showing child's name
- ✅ "Booked For" shows "Emma Smith"

### Scenario 4: Book Same Class for Multiple Family Members

**Steps:**
1. Navigate to Classes page
2. Select a class with available capacity
3. Book for "Yourself" (follow Scenario 1)
4. Book the same class again
5. This time select child from dropdown
6. Confirm booking
7. Navigate to Dashboard
8. Verify both bookings appear:
   - One without badge (Self)
   - One with purple badge (Child's name)

**Expected Results:**
- ✅ Both bookings created successfully
- ✅ 2 credits deducted from parent's balance
- ✅ Both bookings visible in upcoming classes
- ✅ Clear visual distinction between self and child bookings

### Scenario 5: Cancel Child's Booking

**Steps:**
1. Navigate to Dashboard
2. Find a child's booking (with purple badge)
3. Click "Cancel Booking" button
4. Confirm cancellation in modal
5. Verify success message
6. Verify booking removed from upcoming classes
7. Check credit balance - should increase by 1

**Expected Results:**
- ✅ Booking cancelled successfully
- ✅ Credit refunded to parent's account
- ✅ Booking removed from list
- ✅ Class capacity updated

### Scenario 6: Prevent Duplicate Child Booking

**Steps:**
1. Book a class for a specific child
2. Try to book the same class for the same child again
3. Verify error message appears

**Expected Results:**
- ✅ Error message: "This child is already booked for this class"
- ✅ Booking not created
- ✅ No credit deducted

### Scenario 7: Validate Child Ownership

**Steps:**
1. Using API testing tool (Postman/curl):
2. Attempt to book with a childId that doesn't belong to the user
3. Verify error response

**API Test:**
```bash
curl -X POST http://localhost:3001/api/members/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classInstanceId": 1,
    "childId": 999
  }'
```

**Expected Results:**
- ✅ HTTP 403 Forbidden
- ✅ Error: "Child not found or does not belong to you"
- ✅ No booking created

### Scenario 8: Delete Child with Future Bookings

**Steps:**
1. Create child profile
2. Book multiple future classes for the child
3. Delete the child profile
4. Verify confirmation message shows cancelled bookings count
5. Check credit balance - should reflect refunded credits
6. Navigate to Dashboard
7. Verify child's bookings no longer appear

**Expected Results:**
- ✅ Child profile deleted
- ✅ All future bookings cancelled
- ✅ Credits refunded for each cancelled booking
- ✅ Past bookings remain in history (if any)

## API Endpoints to Test

### Create Booking (with child)
```http
POST /api/members/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "classInstanceId": 1,
  "childId": 2
}
```

### Create Booking (without child - self)
```http
POST /api/members/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "classInstanceId": 1
}
```

### Get Dashboard (shows family bookings)
```http
GET /api/members/dashboard
Authorization: Bearer {token}
```

### Get Children
```http
GET /api/members/children
Authorization: Bearer {token}
```

## Database Verification

### Check Booking Record
```sql
SELECT 
  b.id,
  b.user_id,
  b.child_id,
  b.status,
  u.first_name || ' ' || u.last_name as parent_name,
  c.first_name || ' ' || c.last_name as child_name
FROM bookings b
JOIN users u ON b.user_id = u.id
LEFT JOIN children c ON b.child_id = c.id
WHERE b.id = ?;
```

### Check Credit Transactions
```sql
SELECT 
  ct.id,
  ct.transaction_type,
  ct.credits_change,
  ct.balance_after,
  ct.notes,
  ct.created_at
FROM credit_transactions ct
WHERE ct.user_id = ?
ORDER BY ct.created_at DESC
LIMIT 10;
```

## Common Issues and Solutions

### Issue: Dropdown doesn't show children
**Solution:** 
- Verify children are created for the logged-in user
- Check browser console for API errors
- Verify `/api/members/children` endpoint returns data

### Issue: Credits not deducted
**Solution:**
- Check member has active packages with available credits
- Verify package is not expired
- Check database transaction logs

### Issue: Child booking shows as self
**Solution:**
- Verify `childId` is being sent in API request
- Check backend logs for validation errors
- Verify child belongs to the user

### Issue: Cannot book same class for different family members
**Solution:**
- Verify class has sufficient capacity
- Check unique constraint in database allows multiple bookings per class (different child_id)
- Verify booking uniqueness check in backend

## Success Criteria

All scenarios should pass with:
- ✅ No console errors
- ✅ Correct API responses
- ✅ Proper credit management
- ✅ Clear visual indicators
- ✅ Data integrity maintained
- ✅ All requirements from Requirement 9 satisfied

## Notes

- Family booking uses parent's credits for all bookings
- Child profiles are optional - members can book only for themselves
- Visual indicators (purple badges) make it easy to identify child bookings
- Cancellation refunds always go to parent's account
- Database enforces referential integrity via foreign keys
