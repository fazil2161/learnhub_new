# Deploying LearnHub to Render

## Prerequisites

1. A Render account (https://render.com)
2. A PostgreSQL database (can be created on Render or another provider)

## Deployment Steps

### 1. Set Up Your PostgreSQL Database

- Create a PostgreSQL database on Render or any other provider
- Note the connection string for your database (you'll need this later)

### 2. Prepare Your Local Files

1. Replace your `package.json` with the provided `package.json.render` file:
   ```bash
   copy package.json.render package.json
   ```

2. The new package.json includes all required type definitions and a proper build script for deployment.

### 3. Configure Render Web Service

1. Go to the Render dashboard and click "New" → "Web Service"
2. Connect your GitHub repository or upload your code
3. Configure the following settings:
   - **Name**: learnhub (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the one closest to your target audience
   - **Branch**: main (or your main branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Instance Type**: Free (to start) or paid plan for production

4. Add Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A random string used for session encryption (generate with `openssl rand -base64 32`)
   - `NODE_ENV`: production

5. Click "Create Web Service"

### 4. Seed the Database

After your web service is deployed, you need to seed the database:

1. Install the required packages locally:
   ```bash
   npm install
   ```

2. Create a temporary `.env` file with your `DATABASE_URL`:
   ```
   DATABASE_URL=your_database_connection_string
   ```

3. Run the seed script:
   ```bash
   npx tsx scripts/seed-db.ts
   ```

### 5. Access Your Application

Once deployed, you can access your application at the URL provided by Render (usually https://your-app-name.onrender.com).

### Default Admin User

After seeding, you can login with the following credentials:

- Username: admin
- Password: admin123

**Important**: Change the admin password after your first login for security.

## Troubleshooting

### Database Connection Issues

- Make sure your `DATABASE_URL` is correctly formatted
- Check that the database server allows connections from your Render service

### Build Failures

- Check the build logs in Render for specific errors
- Verify that all dependencies are correctly listed in package.json

### Runtime Errors

- Check the logs in the Render dashboard
- If you see TypeScript errors, make sure you're using the correct tsconfig.build.json file

## Updating Your Application

To update your application:

1. Push changes to your connected repository
2. Render will automatically rebuild and redeploy your application
