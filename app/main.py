from fastapi import FastAPI
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import os

app = FastAPI()
model_path = os.path.join(os.getcwd(), "fine_tuned_gpt2.bin")  # LFS pulls to repo
model = GPT2LMHeadModel.from_pretrained(model_path)
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

@app.get("/predict")
async def predict(text: str):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model.generate(**inputs, max_length=50)
    return {"response": tokenizer.decode(outputs[0], skip_special_tokens=True)}