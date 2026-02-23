# 🚀 TASKDESK - QUICK START GUIDE

## Step 1: Setup Database (One Time Only)

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**
2. **Open** `COMPLETE_SETUP.sql` file from this project
3. **Copy ALL the contents** and paste into SQL Editor
4. **Click "Run"** button
5. **Wait for success** - you should see verification queries output

## Step 2: Test Login Credentials

After running the setup script, you can login with these accounts:

### Founder Account
- **Email**: `ava.founder@taskdesk.dev`
- **Password**: `password123`
- **Role**: Founder (full access)

### Manager Account
- **Email**: `mason.manager@taskdesk.dev`
- **Password**: `password123`
- **Role**: Manager (can create campaigns & tasks)

### Member Account
- **Email**: `jordan.member@taskdesk.dev`
- **Password**: `password123`
- **Role**: Member (can view assigned tasks)

## Step 3: Start Development Server

```bash
cd /Users/codelike/Downloads/Taskdesk
pnpm dev
```

Open http://localhost:3000/login and try logging in!

## 🔐 How Passwords Work in Taskdesk

**Two-Table Architecture:**

| Table | Purpose | Contains |
|-------|---------|----------|
| `auth.users` | Authentication | ID, Email, Encrypted Password (bcrypt) |
| `public.users` | User Profile | Name, Role, Organization |

**Login Process:**
1. You enter email & password in login form
2. Supabase Auth checks `auth.users.encrypted_password`
3. If correct, returns JWT token
4. App queries `public.users` for your profile
5. RLS policies ensure you only see your organization's data

**Security:**
- ✅ Passwords hashed with bcrypt (never plain text)
- ✅ Supabase manages password encryption/storage
- ✅ Your app code never sees actual passwords
- ✅ Each user only sees their organization's data

## Troubleshooting

**Error: "Database error querying schema"**
- Means the COMPLETE_SETUP.sql hasn't been run yet
- Run it in Supabase SQL Editor

**Error: "Invalid email or password"**
- Check spelling of email (case-sensitive)
- Password is: `password123` (lowercase, no spaces)

**Error: "User not found"**
- User hasn't been created yet
- Run COMPLETE_SETUP.sql to create test users

## What Happens After Login

After successful login, you'll see:
- Dashboard with campaigns and tasks
- Personalized view based on your role
- Organization-specific data (RLS prevents cross-org visibility)

---

**Need help?** Check the AUTHENTICATION_GUIDE.md for detailed technical information.