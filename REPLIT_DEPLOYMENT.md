# 🚀 Deploying DesignSight to Replit

## 📋 Pre-Deployment Checklist

### ✅ Requirements
- Replit account (free tier works, paid for Always On)
- Google Gemini API key
- MongoDB Atlas account (or use Replit Database)

## 🔧 Step-by-Step Deployment

### 1. **Import Repository to Replit**

1. Go to [Replit](https://replit.com)
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Enter: `https://github.com/tejjj02/DesignSight`
5. Choose **"Node.js"** as template
6. Click **"Import from GitHub"**

### 2. **Configure Environment Variables**

In your Repl, go to **Tools → Secrets** and add:

```bash
# Essential Variables
GEMINI_API_KEY=your_actual_gemini_key
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_string

# Replit-specific URLs (Update with your actual Repl URL)
FRONTEND_URL=https://your-repl-name.username.repl.co
REACT_APP_API_URL=https://your-repl-name.username.repl.co:3001/api
REACT_APP_BACKEND_URL=https://your-repl-name.username.repl.co:3001
CORS_ORIGIN=https://your-repl-name.username.repl.co

# Optional (use defaults if not set)
NODE_ENV=production
PORT=5000
MAX_FILE_SIZE=50mb
LOG_LEVEL=info
```

### 3. **Database Setup Options**

#### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Add your connection string to `MONGODB_URI`
4. Whitelist all IPs (0.0.0.0/0) for Replit

#### Option B: Replit Database
1. Enable Replit Database in your Repl
2. Update backend code to use Replit DB
3. Less features but easier setup

### 4. **Update Configuration for Replit**

The following files have been configured for Replit:
- ✅ `.replit` - Replit configuration
- ✅ `replit.nix` - Dependencies
- ✅ `package.json` - Updated scripts
- ✅ `.env.replit` - Environment template

### 5. **Deploy & Test**

1. Click **"Run"** in Replit
2. Wait for installation and startup
3. Frontend: Access your Repl URL directly
4. Backend: Access your Repl URL + `:3001/api`

## 🌐 **Public Access**

### **Your App URLs:**
- **Frontend**: `https://your-repl-name.username.repl.co`
- **Backend API**: `https://your-repl-name.username.repl.co:3001/api`

### **Share with Others:**
- ✅ **Public URL**: Works for everyone worldwide
- ✅ **No login required**: Direct access for users
- ✅ **HTTPS**: Secure by default
- ✅ **Always On**: 24/7 availability (with paid plan)

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Module not found" errors**
   - Run: `npm run install-all` in Shell

2. **Database connection failed**
   - Check `MONGODB_URI` in Secrets
   - Verify MongoDB Atlas IP whitelist

3. **API calls failing**
   - Update `REACT_APP_API_URL` with correct Repl URL
   - Check CORS configuration

4. **Environment variables not working**
   - Use "Secrets" tab, not .env files
   - Restart the Repl after adding secrets

### **Performance Optimization:**

1. **Always On** (Paid feature)
   - Keeps your app running 24/7
   - Faster response times
   - No cold starts

2. **Boost** (Paid feature)
   - More CPU and RAM
   - Better performance for AI processing

## 📊 **Monitoring**

### **Check App Status:**
- Frontend health: Visit your Repl URL
- Backend health: Visit `your-repl-url:3001/api/health`
- Database: Check connection in console

### **View Logs:**
- Click "Console" tab in Replit
- Monitor for errors and performance

## 🎯 **Next Steps After Deployment**

1. **Test all features**:
   - Image upload
   - AI analysis
   - Feedback system
   - Role filtering

2. **Share your app**:
   - Copy the public URL
   - Share with users/clients
   - Add to portfolio

3. **Monitor usage**:
   - Check Replit analytics
   - Monitor API usage
   - Track performance

## 💡 **Benefits of Replit Deployment**

- ✅ **Zero DevOps**: No server management
- ✅ **Instant deployment**: Push and run
- ✅ **Collaborative**: Share and edit together
- ✅ **Scalable**: Built-in scaling
- ✅ **Secure**: HTTPS and environment variables
- ✅ **Cost-effective**: Free tier available

Your DesignSight app will be accessible worldwide at your Replit URL! 🌍
