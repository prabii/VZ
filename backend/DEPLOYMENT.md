# Deploy Backend to Render

## Step-by-Step Deployment Guide

### Prerequisites
1. GitHub account with your code pushed to https://github.com/prabii/VZ.git
2. Render account (sign up at https://render.com)
3. MongoDB Atlas account (or your MongoDB connection string)

### Step 1: Prepare Your Code
✅ Code is already in GitHub repository: `https://github.com/prabii/VZ.git`
✅ Backend is located at: `VZ/backend/`

### Step 2: Create New Web Service on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in or create an account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Repository**
   - Click "Connect account" if not connected
   - Select GitHub and authorize Render
   - Find and select repository: `prabii/VZ`
   - Click "Connect"

### Step 3: Configure Service Settings

**Basic Settings:**
- **Name**: `vzcourier-backend` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., Singapore, Mumbai)
- **Branch**: `main`
- **Root Directory**: `VZ/backend` ⚠️ **IMPORTANT: Set this!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Select **Free** plan (or paid if you need better performance)

### Step 4: Environment Variables

Click "Advanced" and add these environment variables:

**Required Variables:**
```
NODE_ENV = production
PORT = 10000
MONGODB_URI = your_mongodb_connection_string
CORS_ORIGIN = https://your-frontend-domain.com,http://localhost:5173,http://localhost:8080
```

**How to get MongoDB URI:**
- If using MongoDB Atlas:
  1. Go to MongoDB Atlas dashboard
  2. Click "Connect" on your cluster
  3. Choose "Connect your application"
  4. Copy the connection string
  5. Replace `<password>` with your database password
  6. Replace `<dbname>` with `vzcourier` (or your database name)

**Example MongoDB URI:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vzcourier?retryWrites=true&w=majority
```

**CORS_ORIGIN:**
- Add your frontend URL(s) separated by commas
- Include localhost URLs for development
- Example: `https://your-app.onrender.com,http://localhost:5173`

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Start your server (`npm start`)
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 6: Get Your Backend URL

After deployment:
- Your backend will be available at: `https://vzcourier-backend.onrender.com`
- Or your custom domain if you set one up
- Test it: Visit `https://your-backend-url.onrender.com/api/health`

### Step 7: Update Frontend API URL

Update your frontend `.env` or `vite.config.ts`:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

### Troubleshooting

**Common Issues:**

1. **Build Fails:**
   - Check Root Directory is set to `VZ/backend`
   - Verify `package.json` exists in backend folder
   - Check build logs in Render dashboard

2. **Server Crashes:**
   - Check environment variables are set correctly
   - Verify MongoDB connection string is correct
   - Check logs in Render dashboard

3. **CORS Errors:**
   - Make sure `CORS_ORIGIN` includes your frontend URL
   - Check frontend is using correct API base URL

4. **Database Connection Issues:**
   - Verify MongoDB Atlas IP whitelist includes Render IPs (0.0.0.0/0 for all)
   - Check MongoDB username/password are correct
   - Ensure database name in connection string matches

### Render Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plan for always-on service

### Useful Render Features

- **Auto-Deploy**: Automatically deploys on git push to main branch
- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and request metrics
- **Custom Domain**: Add your own domain name

### Next Steps

After backend is deployed:
1. Update frontend API URL to point to Render backend
2. Test all API endpoints
3. Deploy frontend (can also use Render or Vercel/Netlify)
