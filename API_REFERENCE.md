# API Quick Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication Header
All requests (except register/login) require:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format
Success:
```json
{
  "message": "Success message",
  "data": {}
}
```

Error:
```json
{
  "message": "Error message"
}
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "teacher" | "student"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": "123...",
    "role": "teacher"
  }
}
```

### Login
```
POST /auth/login

Body:
{
  "email": "john@example.com",
  "password": "Password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
}
```

### Get Profile
```
GET /auth/profile

Response:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "teacher",
  "bio": "...",
  "profilePicture": "..."
}
```

### Update Profile
```
PUT /auth/profile

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "New bio",
  "profilePicture": "url"
}
```

---

## Assignment Endpoints

### Create Assignment (Teacher)
```
POST /assignments

Body:
{
  "title": "Quiz 1",
  "description": "Chapter 1 Quiz",
  "type": "quiz" | "programming" | "essay",
  "className": "Math 101",
  "dueDate": "2024-01-15T23:59:59Z",
  "totalPoints": 100,
  "content": "Instructions here",
  "quizQuestions": [],
  "programmingLanguages": [],
  "testCases": [],
  "rubric": {}
}
```

### Get Teacher's Assignments
```
GET /assignments/teacher

Response:
[
  {
    "_id": "...",
    "title": "Quiz 1",
    "type": "quiz",
    ...
  }
]
```

### Get Student's Assignments
```
GET /assignments/student

Response:
[
  {
    "_id": "...",
    "title": "Quiz 1",
    "submitted": true | false,
    ...
  }
]
```

### Get Assignment Details
```
GET /assignments/:id
```

### Update Assignment
```
PUT /assignments/:id

Body: { same as create }
```

### Delete Assignment
```
DELETE /assignments/:id
```

### Get Assignment Submissions
```
GET /assignments/submissions/:id  (Teacher only)

Response:
[
  {
    "_id": "...",
    "student": { "firstName": "...", "email": "..." },
    "content": "...",
    "submittedAt": "...",
    "isLate": true | false,
    "status": "submitted" | "graded"
  }
]
```

---

## Submission Endpoints

### Submit Assignment
```
POST /submissions

Body:
{
  "assignmentId": "...",
  "content": "Student answer/essay",
  "code": "Optional code"
}

Response:
{
  "message": "Assignment submitted",
  "submission": { ... }
}
```

### Get My Submissions (Student)
```
GET /submissions/my-submissions

Response:
[
  {
    "_id": "...",
    "assignment": { "_id": "...", "title": "..." },
    "content": "...",
    "submittedAt": "..."
  }
]
```

### Get Submission Details
```
GET /submissions/:id
```

### Request AI Feedback
```
POST /submissions/:id/ai-feedback

Response:
{
  "message": "AI feedback generated",
  "feedback": "Constructive feedback text"
}
```

### Check Plagiarism
```
POST /submissions/:id/plagiarism-check  (Teacher only)

Response:
{
  "message": "Plagiarism check completed",
  "report": {
    "similarityScore": 23,
    "report": "Analysis text"
  }
}
```

### Get Plagiarism Report
```
GET /submissions/:id/plagiarism-report
```

---

## Grade Endpoints

### Grade a Submission (Teacher)
```
POST /grades

Body:
{
  "submissionId": "...",
  "score": 85,
  "feedback": "Great work!",
  "rubricScores": [
    {
      "criteriaName": "Accuracy",
      "points": 10
    }
  ]
}
```

### Get My Grades (Student)
```
GET /grades/my-grades

Response:
[
  {
    "totalScore": 85,
    "maxScore": 100,
    "teacherFeedback": "...",
    "aiGeneratedFeedback": "...",
    "assignment": { "title": "..." }
  }
]
```

### Get Grade Details
```
GET /grades/:id
```

### Get Class Grades (Teacher)
```
GET /grades/class/:assignmentId

Response:
{
  "grades": [ ... ],
  "stats": {
    "count": 25,
    "average": 78.5,
    "highest": 100,
    "lowest": 45
  }
}
```

### Add Comment to Grade
```
POST /grades/:gradeId/comment

Body:
{
  "text": "Great improvement!"
}
```

### Get Grade Comments
```
GET /grades/:gradeId/comments
```

---

## Analytics Endpoints

### Generate Analytics (Teacher)
```
POST /analytics/:assignmentId

Response:
{
  "totalStudents": 30,
  "submittedStudents": 28,
  "gradedStudents": 15,
  "averageScore": 78.5,
  "scoreDistribution": {
    "excellent": 10,
    "good": 8,
    "average": 5,
    "poor": 2
  }
}
```

### Get Analytics
```
GET /analytics/:assignmentId  (Teacher only)
```

### Get Dashboard Analytics (Teacher)
```
GET /analytics/dashboard

Response:
{
  "totalAssignments": 5,
  "totalSubmissions": 120,
  "totalGraded": 85,
  "pendingGrading": 35,
  "averageClassScore": 78.5,
  "submissionRate": 95
}
```

### Get Student Performance Analytics
```
GET /analytics/performance/:studentId

Response:
{
  "totalAssignments": 5,
  "averageScore": 82,
  "improvementTrend": 5.2,
  "strengthAreas": ["essay", "programming"],
  "improvementAreas": ["quiz"]
}
```

### Analyze Learning Outcomes
```
GET /analytics/:assignmentId/learning-outcomes  (Teacher only)

Response:
{
  "analysis": "Detailed learning outcome analysis"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (no token)
- `403` - Forbidden (wrong role)
- `404` - Not Found
- `500` - Server Error

---

## Example: Complete Workflow

### 1. Register & Login
```bash
POST /auth/register
# Get user ID

POST /auth/login
# Get JWT token
```

### 2. Teacher Creates Assignment
```bash
POST /assignments
# Send assignment details
# Get assignment ID
```

### 3. Student Submits
```bash
POST /submissions
# Send assignment ID and content
# Get submission ID
```

### 4. Teacher Grades
```bash
POST /grades
# Send submission ID, score, feedback
```

### 5. Student Views Grade
```bash
GET /grades/my-grades
# See all grades
```

### 6. Teacher Views Analytics
```bash
GET /analytics/:assignmentId
# See class performance
```

---

**API Version**: 1.0.0  
**Last Updated**: 2024
