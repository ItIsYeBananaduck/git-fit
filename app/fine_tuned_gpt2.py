Fine-Tune GPT-2 for Technically Fit AI Coaching

Fine-tunes GPT-2 on rss_knowledge.jsonl for RIR prediction and tempo tracking.
"""

import json
import logging
from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments, DataCollatorForLanguageModeling
from datasets import load_dataset
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_dataset(file_path: str = 'data/rss_knowledge.jsonl'):
    """Load and tokenize the dataset."""
    dataset = load_dataset('json', data_files=file_path, split='train')
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    tokenizer.pad_token = tokenizer.eos_token

    def tokenize_function(examples):
        return tokenizer(examples['text'], truncation=True, padding=True, max_length=128)

    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    return tokenized_dataset, tokenizer

def fine_tune_model(dataset, tokenizer, output_dir: str = 'fine_tuned_gpt2'):
    """Fine-tune GPT-2 on the dataset."""
    model = GPT2LMHeadModel.from_pretrained('gpt2')
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    training_args = TrainingArguments(
        output_dir=output_dir,
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        save_steps=500,
        save_total_limit=2,
        prediction_loss_only=True,
        dataloader_num_workers=0,  # Windows compatibility
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=dataset,
    )

    trainer.train()
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    logger.info(f"Model saved to {output_dir}")

if __name__ == '__main__':
    dataset, tokenizer = load_dataset()
    fine_tune_model(dataset, tokenizer)