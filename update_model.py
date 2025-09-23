#!/usr/bin/env python3
"""
Automated pipeline for updating Git-Fit AI model
- Updates knowledge base from PubMed
- Fine-tunes GPT-2 model
- Uploads to Hugging Face
"""

import os
import subprocess
import sys
from dotenv import load_dotenv
from huggingface_hub import create_repo, upload_folder

def run_command(cmd, cwd=None):
    """Run a shell command and return success"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        print(f"✅ {cmd}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {cmd}")
        print(e.stderr)
        return False

def main():
    print("🚀 Starting Git-Fit AI Model Update Pipeline")
    print("=" * 50)

    # Load environment variables from .env file
    load_dotenv()

    # 1. Update knowledge base
    print("📚 Updating knowledge base from PubMed...")
    if not run_command("python app/fetch_pubmed_studies.py"):
        print("Failed to update knowledge base")
        return

    # 2. Fine-tune model
    print("🎯 Fine-tuning GPT-2 model...")
    if not run_command("python app/fine_tune.py"):
        print("Failed to fine-tune model")
        return

    # 3. Upload to Hugging Face
    print("☁️ Uploading model to Hugging Face...")
    token = os.getenv("HF_TOKEN")
    if not token:
        print("❌ HF_TOKEN not set. Please set it in environment variables.")
        return

    repo_id = "PhilmoLSC/philmoLSC"
    try:
        # Create repo if it doesn't exist
        create_repo(repo_id, private=True, token=token)
        upload_folder(
            folder_path="fine_tuned_gpt2",
            repo_id=repo_id,
            repo_type="model",
            token=token
        )
        print(f"✅ Model uploaded to https://huggingface.co/{repo_id}")
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return

    print("🎉 Pipeline complete! Model updated and deployed.")

if __name__ == "__main__":
    main()