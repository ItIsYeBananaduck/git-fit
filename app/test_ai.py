from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

# Load the model (downloads once, then caches)
tokenizer = GPT2Tokenizer.from_pretrained("openai-community/gpt2")
model = GPT2LMHeadModel.from_pretrained("openai-community/gpt2").to("cpu")

# Set pad_token_id to eos_token_id explicitly
tokenizer.pad_token = tokenizer.eos_token

# Test prompt-like Alice saying start-of-set motivation
prompt = "Keep pushing, you're almost there! Let's make this set count!"
inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True).to("cpu")
outputs = model.generate(
    inputs["input_ids"],
    attention_mask=inputs["attention_mask"],  # Pass attention mask
    max_length=50,
    num_return_sequences=1,
    no_repeat_ngram_size=2,
    pad_token_id=tokenizer.eos_token_id  # Explicitly set pad token
)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print("AI says:", response)