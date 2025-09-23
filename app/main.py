from fastapi import FastAPI
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import os
import torch
from transformers import BitsAndBytesConfig

app = FastAPI()

# Use smallest GPT-2 model with 8-bit quantization for maximum memory efficiency
model_name = "gpt2"  # Base GPT-2 is smaller than distilgpt2

# Configure 8-bit quantization
quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_enable_fp32_cpu_offload=True
)

# Load tokenizer
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Load model with aggressive memory optimizations
model = GPT2LMHeadModel.from_pretrained(
    model_name,
    quantization_config=quantization_config,
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True,
    device_map="auto"  # Automatically handle device placement
)

@app.get("/predict")
async def predict(text: str):
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=50)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=75,  # Reduced from 100
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                max_new_tokens=25  # Limit new token generation
            )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"response": response, "status": "success"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model": model_name, "quantized": "8-bit"}