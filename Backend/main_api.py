from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
import re
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCQ Extraction Endpoint
MCQ_REGEX = r"(\d+\.\s*.+?)\s*A\)(.+?)\s*B\)(.+?)\s*C\)(.+?)\s*D\)(.+?)(?=\n?\d+\.|$)"

@app.post("/extract-mcqs/")
async def extract_mcqs(file: UploadFile = File(...)):
    contents = await file.read()
    with open("temp.pdf", "wb") as f:
        f.write(contents)
    text = ""
    with pdfplumber.open("temp.pdf") as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    matches = re.findall(MCQ_REGEX, text, re.DOTALL)
    questions = []
    for match in matches:
        questions.append({
            "question": match[0].strip(),
            "options": [match[1].strip(), match[2].strip(), match[3].strip(), match[4].strip()]
        })
    return {"count": len(questions), "questions": questions}

# Scenario-based Question Generation Endpoint
class GenRequest(BaseModel):
    topics: str
    num_questions: int

@app.post("/generate-questions/")
async def generate_questions(req: GenRequest):
    openai.api_key = os.getenv("OPENAI_API_KEY")
    topics = [t.strip() for t in req.topics.replace('\n', ',').split(',') if t.strip()]
    prompt = (
        f"Generate {req.num_questions} scenario-based questions for a quiz. "
        f"Each question should mix at least two of these topics: {', '.join(topics)}. "
        f"Each question must have at least three sub-questions (subproblems), "
        f"and sub-questions should be scenario-based, not just factual. "
        f"Format as JSON: [{{'main': '...', 'subs': ['...', '...', ...]}}]"
    )
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    import json
    questions = json.loads(response.choices[0].message['content'])
    return {"questions": questions}