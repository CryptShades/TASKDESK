# 🧪 TASKDESK AUTHENTICATION - COMPLETE TESTING GUIDE

## Quick Start (Right Now!)

### Step 1: Run COMPLETE_SETUP.sql

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy entire contents of `COMPLETE_SETUP.sql`
3. Paste into SQL Editor and **Run**
4. Verify output shows ✅ all users created

---

## Step 2: Start Development Server

```bash
cd /Users/codelike/Downloads/Taskdesk
pnpm dev
```

Server runs at: http://localhost:3000

---

## Step 3: Test Login (Existing Users)

Open http://localhost:3000/login

### Test Account 1: Founder
- **Email**: `ava.founder@taskdesk.dev`
- **Password**: `password123`
- **Expected Result**: Redirect to dashboard

### Test Account 2: Manager  
- **Email**: `mason.manager@taskdesk.dev`
- **Password**: `password123`
- **Expected Result**: Redirect to dashboard

### Test Account 3: Member
- **Email**: `jordan.member@taskdesk.dev`
- **Password**: `password123`
- **Expected Result**: Redirect to dashboard (member-specific view)

---

## Step 4: Test Signup (New User)

Open http://localhost:3000/signup

**Fill form:**
```
Name: Test User
Email: test@example.com
Password: TestPass123
Organization: Test Org
```

**Expected Result:**
- ✅ User created
- ✅ Profile created
- ✅ Auto-login or redirect to login

---

## Step 5: Test Forgot Password

Open http://localhost:3000/auth/forgot-password

**Fill form:**
```
Email: ava.founder@taskdesk.dev
```

**Expected Result:**
- ✅ Success message: "If account exists, reset link sent"
- 📧 Check your email (Supabase uses configured email template)
- 🔗 Click reset link → redirects to reset-password page

---

## Step 6: Test Password Reset

**From reset email link:**
```
New Password: ResetPass456
Confirm Password: ResetPass456
```

**Expected Result:**
- ✅ Password updated
- ✅ Auto logout (forced re-login)
- ✅ Can login with new password

---

## 🔒 Security Verification Checklist

Run these in **Supabase SQL Editor** to verify security:

### ✅ Verify Passwords Are Hashed

```sql
-- Should show encrypted passwords (NOT readable)
SELECT email, encrypted_password, email_confirmed_at
FROM auth.users
WHERE email LIKE '%.taskdesk.dev'
ORDER BY email;
```

**Expected**: `encrypted_password` shows bcrypt hash, not plaintext

---

### ✅ Verify RLS is Enabled

```sql
-- Check RLS is ON for all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: `rowsecurity = true` for all tables

---

### ✅ Verify RLS Policies Exist

```sql
-- Count policies per table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

**Expected**: Each table has 1+ policies

---

### ✅ Verify User Data Isolation

```sql
-- Logged in as ava (founder)
-- Should ONLY see ava's data
SELECT email, name, role FROM public.users;

-- With RLS: Only returns ava's org users
-- Without RLS: Would return ALL users (security breach)
```

---

## 📊 Expected Database State

### auth.users (Supabase managed)
```
id                                    | email                         | password_hash (bcrypt)
20000000-0000-0000-0000-000000000001  | ava.founder@taskdesk.dev      | $2a$10$... (hashed)
20000000-0000-0000-0000-000000000002  | mason.manager@taskdesk.dev    | $2a$10$... (hashed)
20000000-0000-0000-0000-000000000003  | jordan.member@taskdesk.dev    | $2a$10$... (hashed)
```

### public.users (Your app)
```
id (FK → auth.users)                  | email                         | name            | role
20000000-0000-0000-0000-000000000001  | ava.founder@taskdesk.dev      | Ava Founder     | founder
20000000-0000-0000-0000-000000000002  | mason.manager@taskdesk.dev    | Mason Manager   | manager
20000000-0000-0000-0000-000000000003  | jordan.member@taskdesk.dev    | Jordan Member   | member
```

---

## 🐛 Troubleshooting

### Problem: "Invalid email or password"
**Cause**: Wrong email format or password incorrect
**Solution**: 
- Check email exactly: `ava.founder@taskdesk.dev` (case-sensitive)
- Password: `password123` (lowercase, no spaces)

### Problem: "User not found" after signup
**Cause**: Profile creation failed
**Solution**:
```sql
-- Check if auth user exists but profile doesn't
SELECT id, email FROM auth.users WHERE email = 'test@example.com';
SELECT id, email FROM public.users WHERE email = 'test@example.com';

-- If auth exists but public doesn't, insert manually:
INSERT INTO public.users (id, org_id, name, email, role)
VALUES ('user-id-from-auth', 'org-id', 'Name', 'test@example.com', 'member');
```

### Problem: "Database error querying schema"
**Cause**: COMPLETE_SETUP.sql hasn't run
**Solution**:
1. Go to Supabase SQL Editor
2. Run COMPLETE_SETUP.sql again
3. Wait for completion
4. Refresh browser

### Problem: "Email not confirmed"
**Cause**: User email not verified
**Solution**:
- Already handled in COMPLETE_SETUP.sql (auto-confirms)
- Or resend confirmation email from Auth page

---

## 🚀 Next Steps

After testing passes:

1. **Update `.env`** with your Supabase URL/keys
2. **Customize email templates** in Supabase Auth
3. **Add more test users** via signup flow
4. **Test on staging** before production
5. **Monitor logs** for auth issues

---

## 📝 Test Results Template

Use this to document your testing:

```
✅ Step 1: Database Setup
   - COMPLETE_SETUP.sql ran successfully
   - 3 test users created
   
✅ Step 2: Login Test
   - [x] Founder login works
   - [x] Manager login works
   - [x] Member login works
   
✅ Step 3: Signup Test
   - [x] New user signup works
   - [x] Profile auto-created
   - [x] Auto-login works
   
✅ Step 4: Forgot Password
   - [x] Reset email sent
   - [x] Reset link works
   - [x] Password updated
   
✅ Step 5: Security Checks
   - [x] Passwords are hashed (bcrypt)
   - [x] RLS enabled on all tables
   - [x] RLS policies block cross-org access
   - [x] No plaintext passwords in DB
   
✅ Step 6: Error Handling
   - [x] Invalid password → generic error
   - [x] Missing email → generic error
   - [x] Weak password → specific error
```

---

**Everything working? You're production-ready!** 🚀