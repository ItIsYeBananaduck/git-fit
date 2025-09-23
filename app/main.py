from fastapi import FastAPI
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import os

app = FastAPI()
# Load model from Hugging Face private repo
model_repo = os.getenv("HF_MODEL_REPO", "yourusername/git-fit-ai-models")  # Replace with your HF repo
hf_token = os.getenv("HF_TOKEN")  # Set in environment variables
model = GPT2LMHeadModel.from_pretrained(model_repo, token=hf_token)
tokenizer = GPT2Tokenizer.from_pretrained(model_repo, token=hf_token)

@app.get("/predict")
async def predict(text: str):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model.generate(**inputs, max_length=50)
    return {"response": tokenizer.decode(outputs[0], skip_special_tokens=True)}