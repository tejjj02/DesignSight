# 🔐 Security & Environment Setup

## ⚠️ IMPORTANT: Before Pushing to GitHub

This project contains sensitive environment variables that must NEVER be committed to version control.

### 1. Environment Files Status
- ✅ `.env` files are in `.gitignore`
- ✅ `.env.example` files contain safe template values
- ✅ No hardcoded credentials in source code

### 2. Required Environment Variables

Copy `.env.example` to `.env` and fill in your actual values:

```bash
# Root directory
cp .env.example .env

# Backend directory  
cp backend/.env.example backend/.env
```

### 3. Required Credentials

You'll need to obtain:

1. **Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey
   - Add to: `GEMINI_API_KEY`

2. **MongoDB Connection**
   - Atlas: Get connection string from MongoDB Atlas
   - Local: Use local MongoDB instance
   - Add to: `MONGODB_URI`

3. **JWT Secret**
   - Generate a secure random string
   - Use: `openssl rand -base64 32`
   - Add to: `JWT_SECRET`

### 4. Docker Environment (Optional)

For Docker setup, also set:
- `MONGO_ROOT_USERNAME`
- `MONGO_ROOT_PASSWORD`

### 5. Security Checklist Before Deployment

- [ ] All `.env` files are in `.gitignore`
- [ ] No real API keys in source code
- [ ] No hardcoded passwords
- [ ] JWT secret is secure random string
- [ ] Database credentials are secure
- [ ] `.env.example` files contain only placeholders

### 6. Production Deployment

For production:
1. Use environment variables in your hosting platform
2. Never commit real credentials
3. Use secure, randomly generated secrets
4. Enable SSL/TLS
5. Use proper database authentication

## 🚨 If You've Already Committed Credentials

If you've accidentally committed real credentials:

1. **Immediately revoke/regenerate**:
   - Gemini API keys
   - Database passwords
   - JWT secrets

2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env backend/.env' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (⚠️ dangerous if working with team):
   ```bash
   git push origin --force --all
   ```

## 📝 Environment Variable Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | `AIzaSy...` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Yes | Random 32+ chars |
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
