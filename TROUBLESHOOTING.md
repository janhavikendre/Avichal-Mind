# Troubleshooting Guide

## Session Creation Issues in Development

If you're experiencing "internal error" when creating sessions in development, follow these steps to identify and fix the issue.

### Step 1: Check Environment Variables

Run the environment check script:

```bash
npm run check-env
```

This will verify that all required environment variables are set correctly.

### Step 2: Test Database Connection

Visit the test endpoint in your browser:
```
http://localhost:3000/api/test-db
```

This will show you:
- Environment variable status
- Database connection status
- User and session counts

### Step 3: Check Console Logs

When you try to create a session, check your terminal/console for detailed error logs. The improved error handling will show:

- Environment checks
- Database connection status
- User authentication status
- Session creation steps
- Specific error messages

### Common Issues and Solutions

#### 1. Missing Environment Variables

**Symptoms:**
- "CLERK_SECRET_KEY environment variable is not set"
- "Please define the MONGODB_URI environment variable"

**Solution:**
1. Copy `env.example` to `.env`
2. Fill in your actual values:
   - `MONGODB_URI`: Your MongoDB connection string
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

#### 2. Invalid MongoDB URI

**Symptoms:**
- "Network error connecting to MongoDB"
- "Cannot connect to MongoDB server"
- "DNS lookup failed for MongoDB host"

**Solution:**
1. Verify your MongoDB URI format
2. Ensure MongoDB is running (if local) or accessible (if cloud)
3. Check network connectivity
4. Verify username/password in the URI

#### 3. Invalid Clerk Keys

**Symptoms:**
- "Invalid Clerk API key"
- "User not found in Clerk"
- "Clerk API error: 401"

**Solution:**
1. Verify your Clerk keys are correct
2. Ensure you're using the right environment (test vs production)
3. Check if your Clerk account is active
4. Verify the user exists in your Clerk dashboard

#### 4. Database Schema Issues

**Symptoms:**
- "Failed to save session"
- Mongoose validation errors

**Solution:**
1. Check if your database schema matches the models
2. Run database migrations if needed
3. Clear and recreate the database if necessary

### Debugging Steps

#### 1. Enable Detailed Logging

The application now includes comprehensive logging. Check your terminal for:
- 🚀 Session creation start
- 🔍 Environment checks
- ✅ Database connection success
- ❌ Error details

#### 2. Test Individual Components

1. **Test Database:**
   ```
   GET /api/test-db
   ```

2. **Test Session Creation:**
   ```
   POST /api/session
   Content-Type: application/json
   
   {
     "mode": "text",
     "language": "en"
   }
   ```

#### 3. Check Network Tab

In your browser's developer tools:
1. Open Network tab
2. Try to create a session
3. Look for the `/api/session` request
4. Check the response for detailed error information

### Environment-Specific Issues

#### Development Environment

**Common Issues:**
- Missing `.env` file
- Wrong environment variable values
- Local MongoDB not running
- Clerk keys pointing to wrong environment

**Solutions:**
1. Ensure `.env` file exists in project root
2. Use development Clerk keys
3. Start local MongoDB or use MongoDB Atlas
4. Restart development server after changing environment variables

#### Production Environment

**Common Issues:**
- Environment variables not set in deployment platform
- Database connection limits
- Clerk webhook configuration

**Solutions:**
1. Set all environment variables in your deployment platform
2. Check database connection limits
3. Configure Clerk webhooks properly

### Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look for specific error messages in the console
2. **Test the endpoints:** Use the test endpoints to isolate the problem
3. **Verify environment:** Run `npm run check-env` to ensure setup is correct
4. **Check documentation:** Review Clerk and MongoDB documentation for your specific setup

### Quick Fix Checklist

- [ ] `.env` file exists and has correct values
- [ ] MongoDB is running and accessible
- [ ] Clerk keys are correct and active
- [ ] Development server restarted after environment changes
- [ ] No firewall/network issues blocking connections
- [ ] Database schema is up to date
- [ ] User exists in Clerk dashboard

### Emergency Reset

If nothing else works:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Restart your development server
4. Clear browser cache and cookies
5. Try creating a session again
