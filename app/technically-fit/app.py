import gradio as gr
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "distilgpt2"
MAX_LENGTH = 150
DEVICE = "cpu"

def load_model():
    """Load DistilGPT2 model and tokenizer with error handling"""
    try:
        logger.info(f"Loading model: {MODEL_NAME}")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model for CPU
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float32,  # Use float32 for CPU
            low_cpu_mem_usage=True,
            device_map="cpu"
        )
        
        logger.info("Model loaded successfully")
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

# Load model and tokenizer
try:
    model, tokenizer = load_model()
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    model, tokenizer = None, None

def generate_fitness_response(user_input):
    """Generate fitness advice using DistilGPT2"""
    if model is None or tokenizer is None:
        return "⚠️ Model not loaded. Please try again later."
    
    if not user_input or len(user_input.strip()) == 0:
        return "Please enter a fitness question!"
    
    try:
        # Create fitness-focused prompt
        prompt = f"Fitness Question: {user_input.strip()}\nFitness Answer:"
        
        # Tokenize input
        inputs = tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_length=min(len(inputs[0]) + 100, MAX_LENGTH),
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                top_k=50,
                top_p=0.95,
                pad_token_id=tokenizer.eos_token_id,
                attention_mask=torch.ones(inputs.shape, dtype=torch.long)
            )
        
        # Decode response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract just the answer part
        if "Fitness Answer:" in response:
            answer = response.split("Fitness Answer:")[-1].strip()
        else:
            answer = response[len(prompt):].strip()
        
        # Clean up the response
        if not answer:
            answer = "I'd be happy to help with your fitness question! Could you provide more details?"
        
        return answer
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return f"⚠️ Error generating response: {str(e)}"

def create_interface():
    """Create Gradio interface"""
    
    # Custom CSS for better styling
    css = """
    .gradio-container {
        max-width: 800px !important;
    }
    .gr-form {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    """
    
    # Create interface
    interface = gr.Interface(
        fn=generate_fitness_response,
        inputs=[
            gr.Textbox(
                lines=3,
                placeholder="Ask me about workouts, nutrition, recovery, or any fitness topic...",
                label="Your Fitness Question"
            )
        ],
        outputs=[
            gr.Textbox(
                lines=6,
                label="AI Fitness Coach Response",
                show_copy_button=True
            )
        ],
        title="🏋️ Technically Fit AI Coach",
        description="""
        **Your Personal AI Fitness Assistant**
        
        Ask me anything about:
        • Workout routines and exercise form
        • Nutrition and meal planning  
        • Recovery and injury prevention
        • Training programs and goals
        
        *Powered by DistilGPT2 - Optimized for quick responses*
        """,
        article="""
        ### 📋 Disclaimer
        This AI provides general fitness information and should not replace professional medical advice. 
        Always consult healthcare professionals for personalized guidance.
        
        ### 🔧 Technical Info
        - Model: DistilGPT2 (Lightweight & Fast)
        - Deployment: Hugging Face Spaces
        - Hardware: CPU Optimized
        """,
        examples=[
            ["What's a good beginner workout routine?"],
            ["How much protein should I eat per day?"],
            ["Best exercises for core strength?"],
            ["How to prevent workout injuries?"],
            ["What's the difference between cardio and strength training?"]
        ],
        cache_examples=False,
        css=css,
        theme=gr.themes.Soft()
    )
    
    return interface

# Health check function
def health_check():
    """Simple health check for the app"""
    try:
        if model is not None and tokenizer is not None:
            return {"status": "healthy", "model": MODEL_NAME}
        else:
            return {"status": "unhealthy", "error": "Model not loaded"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    logger.info("Starting Technically Fit AI Coach...")
    
    # Log system info
    logger.info(f"Torch version: {torch.__version__}")
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Model: {MODEL_NAME}")
    
    # Create and launch interface
    try:
        app = create_interface()
        
        # Launch with optimized settings for Spaces
        app.launch(
            server_name="0.0.0.0",
            server_port=7860,
            share=False,  # Don't create share link in Spaces
            show_error=True,
            quiet=False,
            enable_queue=True,
            max_threads=4  # Limit threads for CPU Basic
        )
        
    except Exception as e:
        logger.error(f"Failed to launch app: {str(e)}")
        raise