# Development Workflow Guide

This guide explains how to develop locally without deploying to Vercel every time.

## 1. How to "Shift" Supabase to Local Machine
You don't need to move the database itself. You just need to tell the **online Supabase** that it is okay to talk to your **local computer**.

### Step A: Configure Supabase Dashboard
1. Go to your **Supabase Dashboard** (online).
2. Click on **Authentication** (icon on the left).
3. Click on **URL Configuration**.
4. Look at **Site URL**. This is likely your Vercel link (e.g., `https://taxfriends.vercel.app`). **Leave this as is.**
5. Look at **Redirect URLs**.
6. **ADD** the following URLs to the list:
   - `http://localhost:3000`
   - `http://localhost:3000/**`
7. Click **Save**.

*Why?* This allows Supabase to log you in and send you back to your local computer instead of forcing you to the live website.

### Step B: Verify Local Environment
Ensure you have a file named `.env` in your project folder with your Supabase keys:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step C: Run Locally
1. Open your terminal in VS Code.
2. Run the command:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

## 2. The Development Cycle
Now your workflow is simple:

1. **Make Changes**: Edit files in VS Code.
2. **View Instantly**: Look at `http://localhost:3000`. It updates automatically.
3. **Test**: Login, uploading, etc., will now work locally.
4. **Deploy**: ONLY when you are happy, push to GitHub/Vercel.

## 3. Switching Back ("Sifting to Online")
You don't need to do anything!
- When you push to Vercel, the Vercel build will use the "Site URL" you set in Supabase.
- When you run locally, it uses `localhost`.
- Both work side-by-side. You don't need to change config files back and forth.
