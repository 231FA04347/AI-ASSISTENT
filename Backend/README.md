# AI-Assisted Automated Grading System - Backend

Backend API server built with Node.js, Express, and MongoDB.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure your environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `PORT`: Server port (default: 5000)

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Assignments (Teacher)
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/teacher` - Get teacher's assignments
- `GET /api/assignments/:id` - Get assignment details
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `GET /api/assignments/submissions/:id` - Get submissions

### Submissions (Student)
- `POST /api/submissions` - Submit assignment
- `GET /api/submissions/my-submissions` - Get student submissions
- `GET /api/submissions/:id` - Get submission details
- `POST /api/submissions/:id/ai-feedback` - Request AI feedback
- `POST /api/submissions/:id/plagiarism-check` - Check plagiarism
- `GET /api/submissions/:id/plagiarism-report` - Get plagiarism report

### Grading
- `POST /api/grades` - Grade submission
- `GET /api/grades/my-grades` - Get student grades
- `GET /api/grades/:id` - Get grade details
- `GET /api/grades/class/:assignmentId` - Get class grades
- `POST /api/grades/:id/comment` - Add comment

### Analytics
- `POST /api/analytics/:assignmentId` - Generate analytics
- `GET /api/analytics/:assignmentId` - Get analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/performance/:studentId` - Get performance analytics

## Features

- **User Authentication**: Secure login/registration with JWT
- **Role-Based Access**: Teacher and Student roles
- **Assignment Management**: Create, edit, delete assignments
- **Automated Grading**: Quiz grading automation
- **AI-Powered Features**:
  - Essay Analysis
  - Plagiarism Detection
  - Automated Feedback Generation
  - Learning Outcome Analytics
- **Comprehensive Analytics**: Performance tracking and insights

## Required API Keys

- OpenAI API Key (for AI features)
- MongoDB connection string

## Database Models

- **User**: Teacher and Student accounts
- **Assignment**: Quiz, Programming, Essay assignments
- **Submission**: Student submissions
- **Grade**: Assignment grades and feedback
- **PlagiarismReport**: Plagiarism detection results
- **Analytics**: Class and performance analytics
