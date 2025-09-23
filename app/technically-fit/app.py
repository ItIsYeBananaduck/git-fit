import gradio as gr
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch
import os

# Load model from Hugging Face (use CPU for low memory)
model = GPT2LMHeadModel.from_pretrained(
    "PhilmoLSC/philmoLSC",
    torch_dtype=torch.float32,  # Use float32 for CPU
    low_cpu_mem_usage=True,
    token=os.getenv("HF_TOKEN")
)
tokenizer = GPT2Tokenizer.from_pretrained("PhilmoLSC/philmoLSC", token=os.getenv("HF_TOKEN"))
tokenizer.pad_token = tokenizer.eos_token

def predict(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            max_length=100,
            pad_token_id=tokenizer.eos_token_id,
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True
        )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# Create Gradio interface
iface = gr.Interface(
    fn=predict,
    inputs=gr.Textbox(lines=2, placeholder="Enter your fitness question..."),
    outputs=gr.Textbox(lines=5),
    title="Technically Fit AI Coach",
    description="Ask me anything about fitness and training!"
)

if __name__ == "__main__":
    iface.launch(server_name="0.0.0.0", server_port=7860)
