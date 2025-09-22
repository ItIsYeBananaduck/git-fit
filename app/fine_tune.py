#!/usr/bin/env python3
"""
Fine-tuning script for GPT-2 on Git-Fit coaching phrases
"""

import json
import os
from datasets import Dataset
from transformers import (
    GPT2Tokenizer,
    GPT2LMHeadModel,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling
)

def load_dataset(file_path):
    """Load the JSONL dataset"""
    data = []
    with open(file_path, 'r') as f:
        for line in f:
            data.append(json.loads(line))
    return Dataset.from_list(data)

def tokenize_function(examples, tokenizer):
    """Tokenize the text data"""
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=128
    )

def main():
    print("🚀 Starting GPT-2 Fine-tuning for Git-Fit Coaching")
    print("=" * 60)

    # Check if scripts.jsonl exists
    if not os.path.exists("scripts.jsonl"):
        print("❌ Error: scripts.jsonl not found!")
        return

    # Load model and tokenizer
    print("📥 Loading GPT-2 model and tokenizer...")
    model_name = "openai-community/gpt2"
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name)

    # Set pad token
    tokenizer.pad_token = tokenizer.eos_token

    # Load dataset
    print("📚 Loading dataset...")
    dataset = load_dataset("scripts.jsonl")
    print(f"✅ Loaded {len(dataset)} training examples")

    # Tokenize dataset
    print("🔄 Tokenizing dataset...")
    tokenized_dataset = dataset.map(
        lambda examples: tokenize_function(examples, tokenizer),
        batched=True,
        remove_columns=["text"]
    )

    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # We're doing causal language modeling
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir="./fine_tuned_gpt2",
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        save_steps=500,
        save_total_limit=2,
        logging_steps=100,
        logging_dir="./logs",
        use_cpu=True,  # Force CPU usage
        report_to=[],  # Disable wandb/tensorboard
    )

    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=tokenized_dataset,
    )

    # Train the model
    print("🎯 Starting training...")
    trainer.train()

    # Save the model
    print("💾 Saving fine-tuned model...")
    trainer.save_model("./fine_tuned_gpt2")
    tokenizer.save_pretrained("./fine_tuned_gpt2")

    print("✅ Fine-tuning complete!")
    print("📁 Model saved to: ./fine_tuned_gpt2")
    print("\n🎉 Your GPT-2 model is now fine-tuned for Git-Fit coaching!")
    print("💡 Use this model in your AICoachingEnhancer for better coaching responses.")

if __name__ == "__main__":
    main()