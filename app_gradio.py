gitimport gradio as gr
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch
from transformers import BitsAndBytesConfig

# Use DistilGPT-2 model with 8-bit quantization for maximum memory efficiency
model_name = "distilgpt2"  # Smaller than base GPT-2

# Configure 8-bit quantization for CPU
quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_enable_fp32_cpu_offload=False  # Disable since we're on CPU
)

# Load tokenizer
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Load model with aggressive memory optimizations
model = GPT2LMHeadModel.from_pretrained(
    model_name,
    quantization_config=quantization_config,
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True
)

# Force CPU placement for quantized model
model = model.to('cpu')

def generate_fitness_advice(user_input):
    """Generate fitness advice based on user input"""
    try:
        inputs = tokenizer(user_input, return_tensors="pt", truncation=True, max_length=50)
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
        return response
    except Exception as e:
        return f"Error generating response: {str(e)}"

# Create Gradio interface
iface = gr.Interface(
    fn=generate_fitness_advice,
    inputs=gr.Textbox(
        lines=3,
        placeholder="Ask me about fitness, training, nutrition, or strength building...",
        label="Your Fitness Question"
    ),
    outputs=gr.Textbox(
        lines=5,
        label="AI Fitness Coach Response"
    ),
    title="🏋️ Technically Fit - AI Fitness Coach",
    description="Get personalized fitness advice powered by AI. Ask questions about training, nutrition, strength building, and more!",
    examples=[
        "How should I structure my workout routine for muscle gain?",
        "What's the best way to improve my bench press?",
        "How many sets and reps should I do for hypertrophy?",
        "What should I eat before and after workouts?",
        "How can I prevent workout injuries?"
    ],
    theme=gr.themes.Soft(),
    allow_flagging="never"
)

if __name__ == "__main__":
    iface.launch()