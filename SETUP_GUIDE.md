# AI Grading System - Complete Setup Guide

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js** v14+ (download from https://nodejs.org/)
- **MongoDB Atlas** account (free tier available at https://www.mongodb.com/cloud/atlas)
- **OpenAI API** key (sign up at https://platform.openai.com/)
- **Git** (optional, for version control)
- Text editor: VS Code, WebStorm, or similar

## 🔑 Getting API Keys

### 1. MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Click "Create a Cluster"
4. Choose Cloud Provider: AWS
5. Click "Create Cluster" (wait 1-3 minutes)
6. Click "Connect"
7. Add your IP address to IP Whitelist
8. Create database user with username and password
9. Copy connection string and replace <password> with your password

Your connection string will look like:
```
mongodb+srv://username:password@cluster.mongodb.net/ai-grading?retryWrites=true&w=majority
```

### 2. OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Sign up or login to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again)
5. Store it safely

You'll use it in your `.env` file like:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

## 📦 Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd "C:\Users\{YourUsername}\OneDrive\Desktop\AI assistent"
```

Replace `{YourUsername}` with your actual Windows username.

### Step 2: Setup Backend

```bash
# Navigate to backend
cd Backend

# Install dependencies
npm install
```

Create a new file named `.env` in the Backend folder:

Windows Command Prompt:
```bash
type nul > .env
```

OR use any text editor to create `.env` file with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-grading?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your_super_secret_key_here_make_it_long_and_random_12345678901
OPENAI_API_KEY=sk-your_openai_api_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Replace:**
- `username` and `password` with your MongoDB Atlas credentials
- `sk-your_openai_api_key_here` with your actual OpenAI API key

### Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
MongoDB Connected: cluster0-xxxxx.mongodb.net
Server running on port 5000
```

Keep this terminal open!

### Step 4: Setup Frontend (New Terminal)

Open a **new terminal** and navigate to the Frontend:

```bash
cd Frontend
npm install
```

### Step 5: Start Frontend

```bash
npm start
```

Browser will automatically open at `http://localhost:3000`

## ✅ Verify Everything Works

1. **Backend Running**: Visit http://localhost:5000/api/health
   - Should show: `{"message":"Server is running"}`

2. **Frontend Running**: Visit http://localhost:3000
   - Should show login page

3. **Database Connected**: Check MongoDB Atlas
   - Should see database was accessed

## 🧪 Test the Application

### Create Test Accounts

1. Go to http://localhost:3000/register
2. Create first account (Teacher):
   - First Name: John
   - Last Name: Teacher
   - Email: teacher@example.com
   - Password: Password123!
   - Role: Teacher
3. Create second account (Student):
   - First Name: Jane
   - Last Name: Student
   - Email: student@example.com
   - Password: Password123!
   - Role: Student
   - Class: 10

### Test Teacher Flow

1. Login as teacher
2. Click "Create New Assignment"
3. Fill in:
   - Title: "Math Quiz 1"
   - Type: "Quiz"
   - Class Name: "Math 101"
   - Due Date: Tomorrow
   - Total Points: 100
   - Content: "Calculate: 5 + 3 = ?"
4. Click "Create Assignment"

### Test Student Flow

1. Logout and login as student
2. Click on "Math Quiz 1"
3. Enter answer in text field
4. Click "Submit Assignment"
5. View in Teacher Dashboard → Grade → Add score and feedback

## 🐛 Common Issues & Solutions

### Issue: "MongoDB connection failed"
**Solution:**
- Verify MONGODB_URI is correct
- Check your IP is whitelisted in MongoDB Atlas
- Ensure database user credentials are correct
- Add `?retryWrites=true&w=majority` to connection string

### Issue: "OpenAI API key invalid"
**Solution:**
- Verify API key starts with `sk-`
- Check key hasn't expired
- Ensure you have API credits
- Go to https://platform.openai.com/account/usage/overview to check usage

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or just use different port - change PORT in .env
```

### Issue: "CORS error" or "Cannot connect to backend"
**Solution:**
- Ensure backend is running (should see "Server running on port 5000")
- Check FRONTEND_URL in backend .env is correct
- If you set `Frontend/.env` `REACT_APP_API_URL`, make sure it points to a reachable backend. For local dev, leave it blank so the frontend uses `/api` with the CRA `proxy`.
- After changing any `.env` values, restart the frontend dev server (`Ctrl+C`, then `npm start`).
- Clear browser cache (Ctrl+Shift+Delete)
- Restart both terminals

### Issue: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot find module" errors
**Solution:**
```bash
# Make sure you're in correct directory
cd Backend  # for backend
cd Frontend # for frontend

# Reinstall dependencies
npm install
```

## 📱 Project Structure Explained

```
Backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js           # User schema
│   ├── Assignment.js     # Assignment schema
│   ├── Submission.js     # Submission schema
│   ├── Grade.js          # Grade schema
│   └── ...
├── controllers/
│   ├── authController.js      # Auth logic
│   ├── assignmentController.js # Assignment logic
│   └── ...
├── routes/
│   ├── authRoutes.js     # Auth endpoints
│   ├── assignmentRoutes.js
│   └── ...
├── services/
│   └── aiService.js      # OpenAI integration
├── middleware/
│   └── auth.js          # JWT verification
├── server.js             # Main server file
├── package.json          # Dependencies list
└── .env                  # Configuration (CREATE THIS!)

Frontend/
├── public/
│   ├── index.html       # HTML template
│   └── manifest.json    # PWA config
├── src/
│   ├── pages/           # Page components
│   │   ├── LoginPage.js
│   │   ├── StudentDashboard.js
│   │   ├── TeacherDashboard.js
│   │   └── ...
│   ├── components/      # Reusable components
│   ├── context/
│   │   └── AuthContext.js  # Auth state
│   ├── utils/
│   │   └── api.js       # API calls
│   ├── App.js           # Main app routing
│   ├── App.css          # App styles
│   ├── index.js         # Entry point
│   └── index.css        # Global styles
├── package.json         # Dependencies list
├── tailwind.config.js   # TailwindCSS config
└── .gitignore          # Files to ignore
```

## 🚀 Next Steps

1. **Customize Branding**:
   - Change colors in `tailwind.config.js`
   - Update metadata in `public/index.html`
   - Add your logo

2. **Deploy**:
   - Backend: Heroku, Railway, Render
   - Frontend: Vercel, Netlify
   - Database: Already on MongoDB Atlas

3. **Add More Features**:
   - Email notifications
   - Video submissions
   - Real-time collaboration
   - Mobile app

4. **Integrate More AI Services**:
   - Better code analysis (Judge0)
   - Advanced plagiarism (Turnitin API)
   - Enhanced essay grading

## 📚 Useful Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/)

## 💡 Tips

- Keep terminals organized (use different colors)
- Always check backend logs if frontend shows errors
- Use browser DevTools (F12) for debugging frontend
- Check MongoDB Atlas dashboard to see data in real-time
- Use Postman to test API endpoints directly

## 🆘 Need Help?

1. Check the README files in Backend and Frontend folders
2. Review error messages carefully - they usually tell you what's wrong
3. Check network tab in browser DevTools (F12)
4. Check MongoDB Atlas to verify database changes
5. Restart both terminals if things get stuck

---

**Happy Grading! 🎓**
