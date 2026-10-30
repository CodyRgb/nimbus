# Deploying CipherVault to Vercel

This guide will walk you through deploying the CipherVault frontend to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your backend API deployed and accessible via HTTPS
- Git repository connected to Vercel

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `nimbus` folder as the root directory

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `nimbus`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**
   
   Add the following environment variable in your Vercel project settings:
   
   | Name | Value | Description |
   |------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.com/api` | Your production backend API URL |
   
   > **Important**: Replace `https://your-backend.com/api` with your actual backend API URL.

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### 3. Deploy via Vercel CLI (Alternative)

```bash
# Navigate to the nimbus directory
cd d:\chirag\Projects\cloudcontainer\nimbus

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

When prompted, set the environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend.com/api
```

## Post-Deployment Verification

After deployment, verify the following:

1. **Check API Connection**
   - Open your deployed site
   - Open browser DevTools → Network tab
   - Attempt to login or register
   - Verify API requests are going to your production backend URL (not localhost)

2. **Test Core Features**
   - User registration
   - User login
   - File upload
   - File browsing
   - Telegram connection

3. **Check Console for Errors**
   - Open browser DevTools → Console tab
   - Look for any errors related to API calls or environment variables

## Environment Variables

The application requires the following environment variable:

### `NEXT_PUBLIC_API_URL`
- **Required**: Yes
- **Description**: The base URL of your backend API
- **Example**: `https://api.nimbus.com/api` or `https://your-backend.onrender.com/api`
- **Note**: Must include the `/api` path if your backend uses it

## Updating Environment Variables

To update environment variables after deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update the value of `NEXT_PUBLIC_API_URL`
4. Redeploy your application for changes to take effect

## Custom Domain (Optional)

To add a custom domain:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### API Requests Failing

**Problem**: API requests return CORS errors or fail to connect

**Solutions**:
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Ensure your backend allows requests from your Vercel domain
- Check backend CORS configuration

### Build Failures

**Problem**: Build fails during deployment

**Solutions**:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Test build locally: `npm run build`
- Verify Node.js version compatibility

### Environment Variable Not Working

**Problem**: App still connects to localhost

**Solutions**:
- Ensure variable name is exactly `NEXT_PUBLIC_API_URL`
- Redeploy after setting environment variables
- Check browser console for the actual API URL being used

## Local Development

For local development, create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Support

For more information:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
