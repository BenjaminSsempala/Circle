# Postman Testing Guide for Circle API

## Setup

### 1. Install Postman
Download from https://www.postman.com/downloads/

### 2. Create Environment Variables
1. Click **Environments** in the left sidebar
2. Click **+ Create New**
3. Name it: `Circle Local`
4. Add these variables:

| Variable | Initial Value | Type |
|----------|---------------|------|
| `base_url` | `http://localhost:3000` | String |
| `user_id` | (leave empty) | String |
| `auth_token` | (leave empty) | String |

5. Click **Save**

### 3. Important: Enable Cookies
Postman needs to store cookies for session management:

1. Go to **Postman Settings** (bottom left gear icon)
2. Click **Cookies**
3. Click **Add Cookie** and fill:
   - Domain: `localhost`
   - Path: `/`
   - Leave other fields blank
4. This allows Postman to automatically save/send auth cookies

---

## Testing Workflow

### Step 1: Sign Up with Email
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/signup`

**Body (JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!",
  "fullName": "Test User"
}
```

**Expected Response (200):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "nextStep": "email_confirmation"
}
```

**What happens:**
- User account is created in Supabase auth
- Profile created with `role: null` and `onboarding_complete: false`
- Confirmation email sent with link to `/api/auth/confirm?code=...`

---

### Step 2: Simulate Email Confirmation
Since you can't click the email link in Postman, we need the confirmation code.

**Option A: Get Code from Email**
1. Check your email for the confirmation link
2. Extract the `code` parameter from the URL
3. Use it below

**Option B: Generate a Test Code**
Skip this for now and test after Step 3.

**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/confirm?code=YOUR_CODE_HERE`

**Expected Response (302 redirect):**
Redirects to `/auth/signup?step=role`

**What happens:**
- Supabase confirms the email
- Session is created and stored in HttpOnly cookie
- User is redirected to role selection

---

### Step 3: Check Current User Status
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/me`

**Expected Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "full_name": "Test User",
    "role": null,
    "onboarding_complete": false
  }
}
```

**If Not Authenticated (401):**
```json
{
  "error": "Not authenticated"
}
```

---

### Step 4: Select User Role
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/role`

**Body (JSON):**
```json
{
  "role": "artist"
}
```

**Expected Response (200):**
```json
{
  "role": "artist",
  "redirectTo": "/onboarding/artist"
}
```

**Note:** Must use "artist" or "organiser" (UK spelling)

---

### Step 5: Verify Role Was Set
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/me`

**Expected Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "full_name": "Test User",
    "role": "artist",
    "onboarding_complete": false
  }
}
```

---

### Step 6: Login (New Session)
If you want to test logging in after signup:

**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/login`

**Body (JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

**Expected Response (200):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "artist",
  "onboardingComplete": false,
  "redirectTo": "/onboarding/artist"
}
```

---

### Step 7: Resend Confirmation Email
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/resend-email`

**Body (JSON):**
```json
{
  "email": "testuser@example.com"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Confirmation email sent"
}
```

---

## Troubleshooting

### "Not authenticated" Error
**Problem:** Getting 401 on `/api/auth/me`

**Solution:**
1. Check cookies are enabled in Postman settings
2. Make sure you completed the `/api/auth/confirm` step
3. Try logging in again with `/api/auth/login`

### "User already exists" Error
**Problem:** Signup returns error

**Solution:**
- Change the email to something unique: `testuser+timestamp@example.com`
- Or use your actual email if testing locally

### Cookies Not Persisting
**Problem:** Each request loses session

**Solution:**
1. Go to **Postman Settings → Cookies**
2. Add a cookie for `localhost`
3. Restart Postman

### Can't Get Confirmation Code
**Problem:** Email not received

**Solution:**
1. Check spam folder
2. Verify Supabase email settings are configured
3. In development, you might need to use Supabase's test email feature

---

## Postman Collection (Optional)

You can import all these requests at once. Create a JSON file with this content:

```json
{
  "info": {
    "name": "Circle API",
    "description": "Testing Circle authentication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Sign Up",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/signup",
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"testuser@example.com\", \"password\": \"SecurePassword123!\", \"fullName\": \"Test User\"}"
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/auth/me"
      }
    },
    {
      "name": "Set Role",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/role",
        "body": {
          "mode": "raw",
          "raw": "{\"role\": \"artist\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"testuser@example.com\", \"password\": \"SecurePassword123!\"}"
        }
      }
    }
  ]
}
```

---

## Key Points

✅ **Session Management**
- Supabase uses HttpOnly cookies (secure, can't be accessed via JavaScript)
- Postman automatically stores/sends these cookies if enabled
- Each request automatically includes the session cookie

✅ **Authentication Flow**
1. Sign up with email/password
2. Confirm email (must click link or use code)
3. Select role (artist/organiser)
4. Proceed to onboarding

✅ **Common Errors**
- 401: Not authenticated (session lost)
- 400: Invalid request (check JSON format)
- 409: User already exists (use different email)

---

## Testing Locally

Since you're running on `localhost:3000`, make sure:
1. `npm run dev` is running in `/apps/web`
2. Supabase is configured in `.env.local`
3. Base URL is `http://localhost:3000` (not HTTPS for local testing)
