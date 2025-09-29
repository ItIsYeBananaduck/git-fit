"""
GPT-2 Model Fine-tuning and Inference Service
"""

import torch
import asyncio
import logging
from typing import Dict, Any, Optional
from transformers import (
    GPT2LMHeadModel, 
    GPT2Tokenizer, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from config import GPT2_MODEL_NAME, GPT2_FINE_TUNED_PATH, MAX_RESPONSE_LENGTH, RESPONSE_TIMEOUT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GPT2Service:
    """Service for GPT-2 model fine-tuning and inference"""
    
    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False
        
    async def load_model(self, model_path: Optional[str] = None) -> bool:
        """Load GPT-2 model and tokenizer"""
        try:
            path = model_path or GPT2_FINE_TUNED_PATH
            
            # Try to load fine-tuned model first, fallback to base model
            try:
                self.tokenizer = GPT2Tokenizer.from_pretrained(path)
                self.model = GPT2LMHeadModel.from_pretrained(path)
                logger.info(f"Loaded fine-tuned model from {path}")
            except Exception:
                logger.warning(f"Fine-tuned model not found, loading base model")
                self.tokenizer = GPT2Tokenizer.from_pretrained(GPT2_MODEL_NAME)
                self.model = GPT2LMHeadModel.from_pretrained(GPT2_MODEL_NAME)
            
            # Set pad token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            
            logger.info(f"Model loaded on device: {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    async def generate_response(
        self,
        prompt: str,
        persona_id: str,
        max_length: int = None,
        temperature: float = 0.7,
        do_sample: bool = True
    ) -> Dict[str, Any]:
        """
        Generate coaching response using GPT-2
        
        Args:
            prompt: Input prompt for generation
            persona_id: AI persona identifier (alice/aiden)
            max_length: Maximum response length
            temperature: Sampling temperature
            do_sample: Whether to use sampling
            
        Returns:
            Dict containing generated text, metadata
        """
        if not self.is_loaded:
            await self.load_model()
        
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")
        
        start_time = asyncio.get_event_loop().time()
        
        # Personalize prompt based on persona
        personalized_prompt = self._personalize_prompt(prompt, persona_id)
        
        # Tokenize input
        inputs = self.tokenizer.encode(
            personalized_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(self.device)
        
        # Generate response
        max_new_tokens = max_length or MAX_RESPONSE_LENGTH
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=do_sample,
                pad_token_id=self.tokenizer.eos_token_id,
                no_repeat_ngram_size=2,
                early_stopping=True
            )
        
        # Decode response
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_text = generated_text[len(personalized_prompt):].strip()
        
        # Post-process response
        response_text = self._post_process_response(response_text, persona_id)
        
        generation_time = (asyncio.get_event_loop().time() - start_time) * 1000
        
        # Create toast message (shortened version)
        toast_message = self._create_toast_message(response_text)
        
        return {
            "text": response_text,
            "toast_message": toast_message,
            "metadata": {
                "generation_latency": generation_time,
                "model_version": "gpt2-fine-tuned-v1",
                "input_tokens": inputs.shape[1],
                "output_tokens": outputs.shape[1] - inputs.shape[1],
                "temperature": temperature,
                "persona_id": persona_id
            }
        }
    
    def _personalize_prompt(self, prompt: str, persona_id: str) -> str:
        """Add persona-specific context to prompt"""
        persona_contexts = {
            "alice": "You are Alice, an enthusiastic and supportive fitness coach. Respond with energy and encouragement. ",
            "aiden": "You are Aiden, a direct and motivational fitness coach. Be concise but inspiring. "
        }
        
        context = persona_contexts.get(persona_id, "")
        return context + prompt
    
    def _post_process_response(self, text: str, persona_id: str) -> str:
        """Clean and personalize the generated response"""
        # Remove unwanted characters
        text = text.replace("\n", " ").strip()
        
        # Ensure it's not too long
        if len(text) > MAX_RESPONSE_LENGTH:
            # Find last complete sentence within limit
            sentences = text.split(". ")
            result = ""
            for sentence in sentences:
                if len(result + sentence + ". ") <= MAX_RESPONSE_LENGTH:
                    result += sentence + ". "
                else:
                    break
            text = result.strip()
        
        # Ensure it ends properly
        if text and not text.endswith(('.', '!', '?')):
            text += "!"
        
        return text
    
    def _create_toast_message(self, text: str) -> str:
        """Create a shortened version for toast notifications"""
        if len(text) <= 50:
            return text
        
        # Try to get first sentence
        first_sentence = text.split(". ")[0]
        if len(first_sentence) <= 50:
            return first_sentence + "!"
        
        # Truncate and add ellipsis
        return text[:47] + "..."
    
    async def fine_tune_model(
        self,
        training_data: list,
        output_dir: str = GPT2_FINE_TUNED_PATH,
        epochs: int = 3,
        batch_size: int = 4
    ) -> Dict[str, Any]:
        """
        Fine-tune GPT-2 model on coaching data
        
        Args:
            training_data: List of training examples
            output_dir: Directory to save fine-tuned model
            epochs: Number of training epochs
            batch_size: Training batch size
            
        Returns:
            Training metrics and results
        """
        try:
            # Prepare dataset
            dataset = Dataset.from_list(training_data)
            
            def tokenize_function(examples):
                return self.tokenizer(
                    examples["text"],
                    truncation=True,
                    padding=True,
                    max_length=512
                )
            
            tokenized_dataset = dataset.map(tokenize_function, batched=True)
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False
            )
            
            # Training arguments
            training_args = TrainingArguments(
                output_dir=output_dir,
                overwrite_output_dir=True,
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                save_steps=500,
                save_total_limit=2,
                prediction_loss_only=True,
                remove_unused_columns=False,
                logging_steps=100,
                load_best_model_at_end=True,
            )
            
            # Trainer
            trainer = Trainer(
                model=self.model,
                args=training_args,
                data_collator=data_collator,
                train_dataset=tokenized_dataset,
            )
            
            # Train model
            trainer.train()
            
            # Save model
            trainer.save_model()
            self.tokenizer.save_pretrained(output_dir)
            
            logger.info(f"Model fine-tuned and saved to {output_dir}")
            
            return {
                "status": "success",
                "output_dir": output_dir,
                "epochs": epochs,
                "training_samples": len(training_data)
            }
            
        except Exception as e:
            logger.error(f"Fine-tuning failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def health_check(self) -> bool:
        """Check if service is healthy"""
        try:
            if not self.is_loaded:
                await self.load_model()
            
            # Test generation with simple prompt
            test_prompt = "Great workout! "
            result = await self.generate_response(test_prompt, "alice")
            
            return len(result["text"]) > 0
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Service instance
gpt2_service = GPT2Service()