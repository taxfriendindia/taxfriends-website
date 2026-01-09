# TaxFriend India - Supabase Database Setup

This folder contains all SQL scripts needed to set up and maintain your Supabase database.

## 🎯 QUICK START - ONE FILE TO RULE THEM ALL

### **`FINAL-DATABASE-SETUP.sql`** ⭐ **USE THIS ONE**

**This is the ONLY file you need to run!**

**What it does:**
- ✅ Creates all tables (profiles, services, documents, notifications, reviews)
- ✅ Adds ALL missing columns (handled_by, completed_file_url, uploaded_by)
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates helper functions (is_admin, is_superuser, get_my_role)
- ✅ Fixes ALL security warnings (15+ functions with search_path)
- ✅ Configures storage buckets and policies
- ✅ Seeds service catalog data
- ✅ Grants all necessary permissions
- ✅ **PRESERVES ALL EXISTING DATA** - Nothing is deleted!

**When to run:**
- ✅ Setting up a new database from scratch
- ✅ Applying all pending migrations to existing database
- ✅ Fixing security warnings
- ✅ Updating schema with new columns

**How to run:**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the **ENTIRE** `FINAL-DATABASE-SETUP.sql` file
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for completion message ✅

**Safety:**
- 🔒 **100% Safe** - Uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- 🔒 **Idempotent** - Can run multiple times without issues
- 🔒 **Data Preserving** - All existing users, services, and documents are kept
- 🔒 **Error Handling** - Built-in exception handling for all operations

---

## 📁 Other Files (Reference Only)

### `01-complete-database-setup.sql`
- Previous version - superseded by FINAL-DATABASE-SETUP.sql
- Keep for reference only

### `COMPLETE_DATABASE_SETUP.sql`
- Original schema file - superseded by FINAL-DATABASE-SETUP.sql
- Keep for reference only

### `migrations/` folder
- Contains individual migration files
- All migrations are now included in FINAL-DATABASE-SETUP.sql

---

## 🔒 Additional Security Setup

After running the SQL script, you need to manually enable one more security feature:

### Enable Leaked Password Protection

1. Go to **Authentication** → **Providers** → **Email**
2. Scroll to **"Password Settings"**
3. Enable **"Check for leaked passwords"**
4. Click **Save**

This will check user passwords against the HaveIBeenPwned database to prevent compromised passwords.

---

## ✅ Verification

After running the setup, verify everything worked:

1. Go to **Advisors** → **Security Advisor**
2. Click **"Rerun linter"** or **"Refresh"**
3. All warnings should be resolved ✅

Expected result:
- ✅ 0 Errors
- ✅ 0 or 1 Warnings (only "Leaked Password Protection" if not enabled yet)
- ✅ All function search_path warnings fixed

---

## 📊 What Gets Created/Updated

### Tables:
- `profiles` - User accounts (client, admin, superuser)
- `service_catalog` - Available services menu
- `user_services` - Service requests/orders
- `notifications` - User notifications
- `user_documents` - Uploaded documents
- `reviews` - User reviews

### New Columns Added:
- `user_services.handled_by` - Admin who handled the service
- `user_services.completed_file_url` - Delivered work file URL
- `user_documents.uploaded_by` - Who uploaded the document
- `user_documents.handled_by` - Admin who processed the document

### Functions:
- `get_my_role()` - Get current user's role
- `is_admin()` - Check if user is admin/superuser
- `is_superuser()` - Check if user is superuser
- `super_reset_system()` - Wipe transactional data (superuser only)
- `update_user_role()` - Change user roles (superuser only)
- `handle_new_user()` - Auto-create profile on signup

### Storage Buckets:
- `user-documents` - For client document uploads
- `avatars` - For user profile pictures

---

## 🆘 Troubleshooting

**"Function name not unique" errors:**
- ✅ Script handles this automatically with dynamic SQL
- ✅ Overloaded functions are detected and fixed individually

**"Column already exists" errors:**
- ✅ Script uses `ADD COLUMN IF NOT EXISTS` to prevent errors
- ✅ Safe to run multiple times

**"Permission denied" errors:**
- ✅ Script grants all necessary permissions
- ✅ RLS policies are properly configured

**Data not showing up:**
- ✅ Run `NOTIFY pgrst, 'reload schema';` to refresh
- ✅ This is included in the script automatically

---

## 🎉 Summary

**Before:** 3+ separate SQL files, confusing migrations, manual fixes  
**After:** 1 comprehensive file that does everything

**Just run `FINAL-DATABASE-SETUP.sql` and you're done!** 🚀

---

**Last Updated:** January 8, 2026  
**Version:** 3.0 - Final Consolidated Setup  
**Status:** Production Ready ✅

