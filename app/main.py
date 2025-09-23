from fastapi import FastAPI
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import os
import torch

app = FastAPI()

# Use DistilGPT-2 for memory efficiency (much smaller than full GPT-2)
model_name = "distilgpt2"

# Load tokenizer
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Load model with memory optimizations
model = GPT2LMHeadModel.from_pretrained(
    model_name,
    torch_dtype=torch.float16,  # Use half precision to save memory
    low_cpu_mem_usage=True
)

# Move to CPU explicitly (Render free tier doesn't have GPU)
model = model.to('cpu')

@app.get("/predict")
async def predict(text: str):
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=50)
        with torch.no_grad():  # Disable gradients for inference
            outputs = model.generate(
                **inputs,
                max_length=100,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"response": response, "status": "success"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model": model_name}