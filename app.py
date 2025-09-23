import gradio as gr
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model():
    """Load DistilGPT2 model and tokenizer"""
    try:
        logger.info("Loading DistilGPT2 model...")
        
        # Load model with CPU optimization (removed low_cpu_mem_usage for compatibility)
        model = GPT2LMHeadModel.from_pretrained(
            "distilgpt2",
            torch_dtype=torch.float32  # Use float32 for CPU
        )
        
        # Load tokenizer
        tokenizer = GPT2Tokenizer.from_pretrained("distilgpt2")
        tokenizer.pad_token = tokenizer.eos_token
        
        logger.info("Model loaded successfully!")
        return model, tokenizer
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None, None

def generate_fitness_advice(user_input, model, tokenizer):
    """Generate fitness advice using DistilGPT2"""
    try:
        # Create fitness-focused prompt
        fitness_prompt = f"Fitness Coach: {user_input}\n\nAdvice: "
        
        # Tokenize input
        inputs = tokenizer.encode(fitness_prompt, return_tensors="pt", max_length=512, truncation=True)
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_length=inputs.shape[1] + 100,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        # Decode response
        full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the advice part
        advice = full_response.replace(fitness_prompt, "").strip()
        
        # Clean up and limit response
        advice = advice.split('\n')[0][:200] + "..." if len(advice) > 200 else advice
        
        return advice if advice else "I'd recommend consulting with a fitness professional for personalized advice!"
        
    except Exception as e:
        logger.error(f"Error generating advice: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

# Load model and tokenizer
logger.info("Initializing model...")
model, tokenizer = load_model()

if model is None or tokenizer is None:
    logger.error("❌ Model initialization failed!")
else:
    logger.info("✅ Model initialization successful!")

def fitness_chat(message, history):
    """Main chat function for Gradio interface"""
    if model is None or tokenizer is None:
        return "Sorry, the fitness AI model is not available. Please try again later."
    
    try:
        response = generate_fitness_advice(message, model, tokenizer)
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return "I'm having trouble processing your request. Please try again."

# Create Gradio interface (simplified for compatibility)
try:
    logger.info("Creating Gradio interface...")
    
    demo = gr.ChatInterface(
        fn=fitness_chat,
        title="🏋️ Technically Fit AI Coach",
        description="Get personalized fitness advice from your AI trainer! Ask about workouts, nutrition, or health tips.",
        examples=[
            "What's a good beginner workout routine?",
            "How can I lose weight effectively?",
            "What should I eat before a workout?",
            "How do I build muscle at home?",
            "Tips for staying motivated to exercise?"
        ]
    )
    
    logger.info("✅ Interface created successfully!")
    
except Exception as e:
    logger.error(f"❌ Interface creation failed: {e}")
    raise

if __name__ == "__main__":
    try:
        logger.info("🚀 Launching Fitness AI Coach...")
        demo.launch(
            server_name="0.0.0.0",
            server_port=7860,
            share=False
        )
        
    except Exception as e:
        logger.error(f"❌ Launch failed: {e}")
        print(f"Error: {e}")