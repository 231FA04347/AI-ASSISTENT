# AI-Assisted Automated Grading System - Frontend

Modern React frontend for the grading system with intuitive UI for both teachers and students.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (if needed):
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

Note: for local development, you usually **do not need** `REACT_APP_API_URL` because this project uses a CRA `proxy` and the frontend defaults to calling `/api`.

## Running the Application

Development mode:
```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
```

## Features

### Teacher Features
- **Dashboard**: Overview of all assignments and submissions
- **Create Assignments**: Quiz, Programming, and Essay assignments
- **Grade Submissions**: Grade student work with feedback
- **Plagiarism Detection**: Check for plagiarism
- **Analytics**: View class performance metrics
- **Learning Outcomes**: Track student learning progress

### Student Features
- **Dashboard**: View all assigned work
- **Submit Assignments**: Submit code, essays, or quiz answers
- **View Grades**: See grades and feedback from teachers
- **AI Feedback**: Request AI-generated feedback
- **Track Progress**: Monitor personal performance

## Pages

### Authentication
- `/login` - User login
- `/register` - User registration

### Teacher
- `/teacher-dashboard` - Main dashboard
- `/grading/:assignmentId` - Grade submissions
- `/analytics/:assignmentId` - View analytics

### Student
- `/student-dashboard` - Main dashboard
- `/assignment/:id` - View and submit assignment
- `/submission/:id` - View submission details

## Technologies Used

- **React 18** - UI Framework
- **React Router** - Navigation
- **Axios** - API calls
- **TailwindCSS** - Styling
- **Chart.js** - Analytics charts
- **React Hot Toast** - Notifications

## Project Structure

```
src/
├── pages/          # Page components
├── components/     # Reusable components
├── context/        # Context API (Auth)
├── utils/          # API calls and utilities
├── App.js          # Main app routing
└── index.js        # Entry point
```

## Environment Variables

- `REACT_APP_API_URL` - Optional backend API URL override. If not set, the frontend defaults to `/api` (so CRA `proxy` can forward to the backend).

## Authentication

Uses JWT tokens stored in localStorage. Token is automatically sent with all API requests.

## Styling

- **TailwindCSS** for utility-first CSS
- Responsive design for all screen sizes
- Dark/Light mode ready

## Notes

- Make sure backend server is running on port 5000
- Frontend runs on port 3000 by default
