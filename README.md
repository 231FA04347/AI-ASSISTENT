# 🎓 AI-Assisted Automated Grading and Academic Assessment System

A comprehensive MERN stack application for automated grading, essay analysis, plagiarism detection, and AI-powered feedback generation for educational institutions.

## 📋 Features

### Core Features
- ✅ **Automated Quiz Grading** - Instant quiz grading with answer tracking
- ✅ **Programming Assignment Evaluation** - Test case validation and code analysis
- ✅ **Essay Analysis** - AI-powered essay quality assessment
- ✅ **Plagiarism Detection** - Detect academic dishonesty
- ✅ **AI-Based Feedback** - Intelligent, constructive feedback generation
- ✅ **Learning Outcome Analytics** - Track student progress and mastery

### Additional Features
- 🔐 **Dual Login System** - Separate Teacher and Student logins
- 📊 **Advanced Analytics Dashboard** - Performance metrics and insights
- 💬 **Comment System** - Teacher feedback with discussion threads
- 📈 **Performance Tracking** - Student progress visualization
- 🎨 **Modern UI/UX** - Professional, responsive design with TailwindCSS
- 📱 **Mobile Responsive** - Works on all devices

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB
- JWT Authentication
- OpenAI API Integration

**Frontend:**
- React 18
- React Router v6
- TailwindCSS
- Chart.js for analytics
- Axios for API calls

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account or local MongoDB
- OpenAI API key
- Git

### Step 1: Clone/Setup Project

```bash
cd "AI assistent"
```

### Step 2: Setup Backend

```bash
cd Backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-grading?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your_very_long_secret_key_here_make_it_secure
OPENAI_API_KEY=sk-your-openai-api-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Run backend:
```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

### Step 3: Setup Frontend

```bash
cd Frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## 📚 User Roles

### Teacher Account
- Create assignments (Quiz, Programming, Essay)
- Grade submissions manually or with AI assistance
- Check plagiarism
- View analytics and learning outcomes
- Provide feedback to students

### Student Account
- View assigned work
- Submit assignments
- Request AI feedback
- View grades and comments
- Track performance analytics

## 🎯 How to Use

### For Teachers

1. **Register/Login** as Teacher
2. **Create Assignment**:
   - Click "Create New Assignment"
   - Fill in details (title, type, due date, points)
   - Add instructions and content

3. **Grade Submissions**:
   - Go to assignment
   - Click "Grade" button
   - View student submissions
   - Add score and feedback
   - Option to check plagiarism

4. **View Analytics**:
   - Click "Analytics" on assignment
   - See class performance metrics
   - Identify struggling students
   - Get recommendations

### For Students

1. **Register/Login** as Student
2. **View Assignments**:
   - See all pending assignments
   - Check due dates
   - Identify pending vs. submitted

3. **Submit Work**:
   - Click on assignment
   - Write code/essay/answers
   - Submit before due date

4. **Get Feedback**:
   - View grades once graded
   - Read teacher feedback
   - Request AI feedback for additional insights
   - Track improvements

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db-name

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here

# AI Services
OPENAI_API_KEY=sk-your-key-here

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend
Automatic proxy to backend via package.json. The frontend defaults to calling `/api`.

If you set `Frontend/.env` `REACT_APP_API_URL`, the frontend will call that URL directly (bypassing the proxy). Only set it if your backend is running on a different host.

## 📁 Project Structure

```
AI assistent/
├── Backend/
│   ├── config/        # Database config
│   ├── models/        # MongoDB schemas
│   ├── controllers/   # Request handlers
│   ├── routes/        # API routes
│   ├── middleware/    # Auth middleware
│   ├── services/      # AI services
│   ├── server.js      # Entry point
│   └── package.json
│
└── Frontend/
    ├── public/        # Static files
    ├── src/
    │   ├── pages/     # Page components
    │   ├── components/# Reusable components
    │   ├── context/   # Auth context
    │   ├── utils/     # API utilities
    │   ├── App.js     # Main app
    │   └── index.js   # Entry point
    └── package.json
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
```

### Assignments
```
GET    /api/assignments/teacher        (Teacher)
GET    /api/assignments/student        (Student)
POST   /api/assignments                (Teacher)
GET    /api/assignments/:id
PUT    /api/assignments/:id            (Teacher)
DELETE /api/assignments/:id            (Teacher)
GET    /api/assignments/submissions/:id (Teacher)
```

### Submissions
```
POST   /api/submissions                      (Student)
GET    /api/submissions/my-submissions       (Student)
GET    /api/submissions/:id
POST   /api/submissions/:id/ai-feedback
POST   /api/submissions/:id/plagiarism-check (Teacher)
GET    /api/submissions/:id/plagiarism-report
```

### Grades
```
POST   /api/grades                     (Teacher)
GET    /api/grades/my-grades           (Student)
GET    /api/grades/:id
GET    /api/grades/class/:assignmentId (Teacher)
POST   /api/grades/:id/comment
GET    /api/grades/:id/comments
```

### Analytics
```
POST   /api/analytics/:assignmentId           (Teacher)
GET    /api/analytics/:assignmentId           (Teacher)
GET    /api/analytics/dashboard               (Teacher)
GET    /api/analytics/performance/:studentId
GET    /api/analytics/:assignmentId/learning-outcomes (Teacher)
```

## 🤖 AI Features

### 1. Essay Analysis
Analyzes essay quality, grammar, structure, and content.

### 2. Plagiarism Detection
Detects potentially plagiarized content and identifies similar submissions.

### 3. Automated Feedback
Generates constructive, encouraging feedback based on submission.

### 4. Learning Outcome Tracking
Analyzes student performance against learning objectives.

## 📊 Analytics Dashboard

- **Class Performance**: Average, highest, lowest scores
- **Score Distribution**: Visual breakdown of grade ranges
- **Submission Analysis**: On-time vs. late submissions
- **Performance Trends**: Student improvement over time
- **Recommendations**: AI-generated insights for instruction

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for secure passwords
- **Role-Based Access**: Different permissions for teacher/student
- **CORS Protection**: Configured CORS headers
- **Environment Variables**: Sensitive data in .env files

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI in .env
- Ensure MongoDB Atlas IP whitelist includes your IP
- Verify username/password

### OpenAI API Errors
- Verify API key is correct
- Check API quota and billing
- Ensure key has necessary permissions

### Frontend API Errors
- Check backend is running on port 5000
- Verify FRONTEND_URL in backend .env
- Check browser console for CORS errors

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📈 Next Steps

1. **Get API Keys**:
   - Sign up for [OpenAI API](https://platform.openai.com)
   - Create MongoDB Atlas cluster
   - Get API keys

2. **Configure Environment**:
   - Update .env files with real credentials
   - Test database connection
   - Test OpenAI integration

3. **Deploy**:
   - Backend: Heroku, Railway, Render, etc.
   - Frontend: Vercel, Netlify, etc.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Support

For issues or questions, please refer to the README files in Backend and Frontend directories.

## 🎓 Educational Use

Created for educational institutions to modernize grading and assessment processes using AI technology while maintaining academic integrity.

---

**Made with ❤️ for educators and students**
