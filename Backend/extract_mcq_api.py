from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import re
from typing import List

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Regex for MCQ extraction
MCQ_REGEX = r"(\d+\.\s*.+?)\s*A\)(.+?)\s*B\)(.+?)\s*C\)(.+?)\s*D\)(.+?)(?=\n?\d+\.|$)"

@app.post("/extract-mcqs/")
async def extract_mcqs(file: UploadFile = File(...)):
    # Save uploaded file to disk
    contents = await file.read()
    with open("temp.pdf", "wb") as f:
        f.write(contents)
    # Extract text from PDF
    text = ""
    with pdfplumber.open("temp.pdf") as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    # Parse MCQs
    matches = re.findall(MCQ_REGEX, text, re.DOTALL)
    questions = []
    for match in matches:
        questions.append({
            "question": match[0].strip(),
            "options": [match[1].strip(), match[2].strip(), match[3].strip(), match[4].strip()]
        })
    return {"count": len(questions), "questions": questions}
