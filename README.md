# 🏋️ Technically Fit - AI Fitness Coach

An AI-powered fitness assistant that provides personalized training advice, nutrition guidance, and strength building recommendations using advanced language models.

## Features

- 🤖 **AI-Powered Coaching**: Get personalized fitness advice from a fine-tuned GPT-2 model
- 💪 **Strength Training Focus**: Specialized knowledge in resistance training, hypertrophy, and performance optimization
- 🧠 **Smart Recommendations**: Context-aware suggestions based on your fitness goals
- 🎯 **Evidence-Based**: Responses grounded in fitness science and research

## Model Details

- **Base Model**: DistilGPT-2 (distilled version of GPT-2 for efficiency)
- **Quantization**: 8-bit quantization for optimal memory usage
- **Specialization**: Fine-tuned on fitness research and coaching principles
- **Memory Usage**: ~150MB RAM (optimized for cloud deployment)

## Usage

Simply type your fitness question in the text box and get instant AI coaching advice. Examples:

- "How should I structure my workout routine for muscle gain?"
- "What's the best way to improve my bench press?"
- "How many sets and reps should I do for hypertrophy?"
- "What should I eat before and after workouts?"

## Technical Stack

- **Framework**: Gradio for the web interface
- **Model**: Transformers library with PyTorch
- **Quantization**: BitsAndBytes for memory optimization
- **Hosting**: Hugging Face Spaces (free tier)

## Privacy & Security

- 🔒 **Private Space**: Only accessible to authorized users
- 🛡️ **No Data Storage**: Questions are processed in real-time, no conversation history saved
- 🔐 **Secure**: All computations happen server-side

## About

Built with ❤️ for the fitness community. This AI coach combines scientific research with practical training experience to help you achieve your fitness goals safely and effectively.

---

_Powered by Hugging Face Transformers and hosted on Hugging Face Spaces_
