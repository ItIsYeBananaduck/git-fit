"""
AI Enhancement Service for Git-Fit Coaching System

This service integrates advanced AI capabilities with the existing TypeScript coaching system.
Instead of replacing the existing architecture, it enhances it with:
- Advanced text generation for dynamic coaching responses
- Sentiment analysis for user feedback processing
- Enhanced pronunciation generation for complex fitness terms
- Smart content generation for personalized coaching

Integration Points:
1. Enhances existing aiCoaching.ts service with dynamic response generation
2. Improves ttsEngine.ts with better pronunciation handling
3. Augments persona narration scripts with AI-generated variations
4. Provides fallback content when manual scripts are insufficient
"""

import json
import os
import random
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from transformers import pipeline, GPT2LMHeadModel, GPT2Tokenizer
import torch

@dataclass
class CoachingContext:
    """Context information for generating coaching responses"""
    coach_persona: str  # 'alice' or 'aiden'
    workout_phase: str  # 'set_start', 'set_end', 'rest', 'transition'
    exercise_name: str
    set_number: int
    rep_count: int
    has_pr: bool
    heart_rate: Optional[int] = None
    rest_time: Optional[int] = None
    user_sentiment: Optional[str] = None

class AICoachingEnhancer:
    """Enhances the existing coaching system with AI capabilities"""

    def __init__(self, model_path: str = "./fine_tuned_gpt2", fallback_model: str = "openai-community/gpt2"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")

        # Try to load fine-tuned model, fallback to original
        self.model_path = model_path
        self.fallback_model = fallback_model
        self.tokenizer = None
        self.model = None

        self._load_model()

        # Initialize sentiment analyzer
        self.sentiment_analyzer = pipeline("sentiment-analysis", device=0 if self.device == "cuda" else -1)

        # Load existing persona scripts for enhancement
        self.persona_scripts = self._load_persona_scripts()

        # Track used phrases to avoid repetition
        self.used_phrases = {
            'alice': {phase: set() for phase in self._get_all_phases()},
            'aiden': {phase: set() for phase in self._get_all_phases()}
        }

    def _load_model(self):
        """Load fine-tuned model with fallback"""
        try:
            print(f"[LOADING] Attempting to load fine-tuned model: {self.model_path}")
            self.tokenizer = GPT2Tokenizer.from_pretrained(self.model_path)
            self.model = GPT2LMHeadModel.from_pretrained(self.model_path).to(self.device)
            print("[SUCCESS] Fine-tuned model loaded successfully!")
        except Exception as e:
            print(f"[WARNING] Fine-tuned model not found ({e}), falling back to: {self.fallback_model}")
            try:
                self.tokenizer = GPT2Tokenizer.from_pretrained(self.fallback_model)
                self.model = GPT2LMHeadModel.from_pretrained(self.fallback_model).to(self.device)
                print("[SUCCESS] Fallback model loaded successfully!")
            except Exception as e2:
                print(f"[ERROR] Failed to load any model: {e2}")
                raise

        # Set pad token
        self.tokenizer.pad_token = self.tokenizer.eos_token

    def _get_all_phases(self) -> List[str]:
        """Get all available workout phases"""
        return [
            'welcome', 'set_start', 'set_end_no_pr', 'set_end_pr',
            'rest_start_standard', 'rest_ready_30', 'rest_ready_60', 'rest_force_90',
            'exercise_transition', 'workout_complete'
        ]

    def _load_persona_scripts(self) -> Dict[str, Any]:
        """Load existing persona scripts to enhance rather than replace"""
        scripts = {}
        # Use absolute path to ensure it works from any working directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        script_dir = os.path.join(current_dir, "src", "lib", "data", "personas")

        for persona_file in ["alice.json", "aiden.json"]:
            try:
                file_path = os.path.join(script_dir, persona_file)
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        persona_name = persona_file.split('.')[0]
                        scripts[persona_name] = json.load(f)
                        print(f"Loaded {persona_name} persona scripts")
                else:
                    print(f"Warning: {file_path} not found")
            except Exception as e:
                print(f"Warning: Could not load {persona_file}: {e}")

        return scripts

    def generate_enhanced_response(self, context: CoachingContext) -> str:
        """
        Generate an enhanced coaching response that works with existing system.
        This creates variations of existing script patterns rather than generic AI text.
        """
        base_responses = self._get_base_responses(context)

        if not base_responses:
            return self._generate_fallback_response(context)

        # Use AI to create a variation of existing response patterns
        enhanced_response = self._enhance_with_ai(base_responses, context)

        return enhanced_response

    def _get_base_responses(self, context: CoachingContext) -> List[str]:
        """Get base responses from existing persona scripts"""
        if context.coach_persona not in self.persona_scripts:
            return []

        persona_data = self.persona_scripts[context.coach_persona]
        phase_key = self._map_phase_to_script_key(context.workout_phase, context.has_pr)

        if 'phrases' in persona_data and phase_key in persona_data['phrases']:
            return persona_data['phrases'][phase_key]

        return []

    def _map_phase_to_script_key(self, phase: str, has_pr: bool) -> str:
        """Map workout phase to existing script keys"""
        phase_mapping = {
            'set_start': 'set_start',
            'set_end': 'set_end_pr' if has_pr else 'set_end_no_pr',
            'rest_start': 'rest_start_standard',
            'rest_ready_30': 'rest_ready_30',
            'rest_ready_60': 'rest_ready_60',
            'rest_force_90': 'rest_force_90',
            'exercise_transition': 'exercise_transition'
        }
        return phase_mapping.get(phase, 'set_start')

    def _enhance_with_ai(self, base_responses: List[str], context: CoachingContext) -> str:
        """Use AI to create a variation of existing response patterns"""
        if not base_responses:
            return self._generate_fallback_response(context)

        # Select a base response to enhance (avoid repetition)
        available_responses = [r for r in base_responses if r not in self.used_phrases[context.coach_persona][context.workout_phase]]
        if not available_responses:
            # Reset used phrases if we've used them all
            self.used_phrases[context.coach_persona][context.workout_phase].clear()
            available_responses = base_responses

        base_response = random.choice(available_responses)
        self.used_phrases[context.coach_persona][context.workout_phase].add(base_response)

        # Create a more sophisticated prompt for the fine-tuned model
        persona_style = "encouraging and motivational" if context.coach_persona == 'alice' else "disciplined and precise"
        prompt = f"Coach {context.coach_persona.title()} style: {persona_style}\nPhase: {context.workout_phase}\nExercise: {context.exercise_name}\nBase: {base_response}\nVariation:"

        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=128
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_length=len(prompt.split()) + 30,  # Allow longer variations
                    min_length=len(prompt.split()) + 5,   # Ensure meaningful variation
                    num_return_sequences=1,
                    no_repeat_ngram_size=3,  # Prevent repetitive phrases
                    temperature=0.8,         # Slightly higher for more creativity
                    top_p=0.9,              # Nucleus sampling
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )

            enhanced_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Extract the variation part after "Variation:"
            if "Variation:" in enhanced_text:
                variation_part = enhanced_text.split("Variation:", 1)[1].strip()
                # Clean up the variation
                variation_part = variation_part.split('\n')[0].strip()  # Take first line only
                if variation_part and len(variation_part) > 10:  # Ensure meaningful length
                    return variation_part

            # If extraction fails, try to find a natural response
            lines = enhanced_text.split('\n')
            for line in lines:
                line = line.strip()
                if line and not line.startswith('Coach') and not line.startswith('Phase') and len(line) > 10:
                    return line

            return base_response  # Fallback to original

        except Exception as e:
            print(f"AI enhancement failed: {e}")
            return base_response

    def _generate_fallback_response(self, context: CoachingContext) -> str:
        """Generate a basic fallback response when no scripts are available"""
        if context.coach_persona == 'alice':
            if context.workout_phase == 'set_start':
                return f"Let's crush this {context.exercise_name} set! You've got this!"
            elif context.workout_phase == 'set_end':
                return "Great work! Take a moment to recover."
            else:
                return "You're doing amazing! Keep pushing forward!"
        else:  # aiden
            if context.workout_phase == 'set_start':
                return f"Execute {context.exercise_name} with precision. Focus on form."
            elif context.workout_phase == 'set_end':
                return "Set complete. Rest strategically."
            else:
                return "Consistency creates champions. Stay disciplined."

    def analyze_user_sentiment(self, user_input: str) -> Dict[str, Any]:
        """Analyze user sentiment for adaptive coaching"""
        try:
            result = self.sentiment_analyzer(user_input)
            return {
                'sentiment': result[0]['label'],
                'confidence': result[0]['score'],
                'original_input': user_input
            }
        except Exception as e:
            print(f"Sentiment analysis failed: {e}")
            return {
                'sentiment': 'NEUTRAL',
                'confidence': 0.5,
                'original_input': user_input
            }

    def generate_pronunciation_guide(self, exercise_name: str) -> str:
        """Generate pronunciation guide for complex exercise names"""
        # This could integrate with the existing pronunciation service
        complex_exercises = {
            'Romanian Deadlift': 'roh-MAY-nee-an ded-lift',
            'Good Mornings': 'good MOR-nings',
            'Clean and Press': 'kleen and press',
            'Snatches': 'snach-es',
            'Thrusters': 'thrus-ters'
        }

        return complex_exercises.get(exercise_name, exercise_name.lower())

    def export_enhanced_scripts(self, output_dir: str = "../data/personas/enhanced"):
        """Export enhanced persona scripts with AI-generated variations"""
        os.makedirs(output_dir, exist_ok=True)

        for persona_name, persona_data in self.persona_scripts.items():
            enhanced_data = persona_data.copy()

            if 'phrases' in enhanced_data:
                for phase, responses in enhanced_data['phrases'].items():
                    if isinstance(responses, list) and len(responses) > 0:
                        # Generate 5 additional variations for each phase
                        base_context = CoachingContext(
                            coach_persona=persona_name,
                            workout_phase=phase,
                            exercise_name="Bench Press",
                            set_number=1,
                            rep_count=10,
                            has_pr=False
                        )

                        enhanced_responses = responses.copy()
                        for _ in range(5):
                            variation = self._enhance_with_ai(responses, base_context)
                            if variation not in enhanced_responses:
                                enhanced_responses.append(variation)

                        enhanced_data['phrases'][phase] = enhanced_responses

            # Save enhanced script
            output_file = os.path.join(output_dir, f"{persona_name}_enhanced.json")
            with open(output_file, 'w') as f:
                json.dump(enhanced_data, f, indent=2)

            print(f"Exported enhanced {persona_name} script to {output_file}")

def main():
    """Demo the AI coaching enhancer"""
    print("🤖 Git-Fit AI Coaching Enhancer")
    print("=" * 50)

    enhancer = AICoachingEnhancer()

    # Demo context
    context = CoachingContext(
        coach_persona='alice',
        workout_phase='set_start',
        exercise_name='Bench Press',
        set_number=1,
        rep_count=10,
        has_pr=False
    )

    print(f"🎯 Generating response for: {context.coach_persona} - {context.workout_phase}")
    response = enhancer.generate_enhanced_response(context)
    print(f"💬 Response: {response}")

    # Demo sentiment analysis
    print("\n😊 Testing sentiment analysis:")
    test_inputs = [
        "I feel great after that workout!",
        "This exercise is too hard for me",
        "I'm making progress with my fitness goals"
    ]

    for user_input in test_inputs:
        sentiment = enhancer.analyze_user_sentiment(user_input)
        print(f"Input: '{user_input}'")
        print(f"Sentiment: {sentiment['sentiment']} ({sentiment['confidence']:.2f})")
        print()

    # Demo pronunciation
    print("🔊 Pronunciation guide:")
    exercises = ['Bench Press', 'Romanian Deadlift', 'Good Mornings']
    for exercise in exercises:
        pronunciation = enhancer.generate_pronunciation_guide(exercise)
        print(f"{exercise}: {pronunciation}")

    print("\n✅ AI Enhancement service ready!")
    print("This service enhances your existing coaching system without breaking it.")

if __name__ == "__main__":
    main()