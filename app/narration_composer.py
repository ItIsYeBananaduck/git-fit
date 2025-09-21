"""
Narration Composer Service for Git-Fit

This service composes complete workout narrations by combining:
1. AI-enhanced coaching responses
2. Existing persona scripts
3. Pronunciation guides
4. Timing and pacing information
5. User sentiment analysis

Integration with existing TypeScript services:
- aiCoaching.ts: Enhanced with dynamic response generation
- ttsEngine.ts: Improved with better pronunciation handling
- narrationComposer.ts: Extended with AI capabilities
"""

import json
import os
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from ai_coaching_enhancer import AICoachingEnhancer, CoachingContext

@dataclass
class NarrationSegment:
    """Represents a segment of workout narration"""
    phase: str
    text: str
    duration_seconds: int
    priority: int  # 1=high, 2=medium, 3=low
    exercise_name: Optional[str] = None
    set_number: Optional[int] = None
    rep_count: Optional[int] = None
    has_pr: bool = False

@dataclass
class WorkoutNarration:
    """Complete workout narration composition"""
    workout_id: str
    coach_persona: str
    segments: List[NarrationSegment]
    total_duration: int
    created_at: datetime
    metadata: Dict[str, Any]

class NarrationComposer:
    """Composes complete workout narrations with AI enhancement"""

    def __init__(self, ai_enhancer: Optional[AICoachingEnhancer] = None):
        self.ai_enhancer = ai_enhancer or AICoachingEnhancer()
        self.default_durations = {
            'welcome': 8,
            'set_start': 6,
            'set_end_no_pr': 4,
            'set_end_pr': 6,
            'rest_start_standard': 5,
            'rest_ready_30': 3,
            'rest_ready_60': 3,
            'rest_force_90': 4,
            'exercise_transition': 7,
            'workout_complete': 10
        }

    def compose_workout_narration(
        self,
        workout_plan: Dict[str, Any],
        coach_persona: str = 'alice',
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> WorkoutNarration:
        """
        Compose a complete workout narration from a workout plan

        Args:
            workout_plan: Dictionary containing workout structure
            coach_persona: 'alice' or 'aiden'
            user_preferences: User-specific preferences for narration

        Returns:
            Complete WorkoutNarration object
        """
        workout_id = workout_plan.get('id', f"workout_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        segments = []
        total_duration = 0

        # Add welcome segment
        welcome_segment = self._create_welcome_segment(workout_plan, coach_persona)
        segments.append(welcome_segment)
        total_duration += welcome_segment.duration_seconds

        # Process each exercise in the workout
        exercises = workout_plan.get('exercises', [])
        for exercise_idx, exercise in enumerate(exercises):
            exercise_segments = self._compose_exercise_segments(
                exercise, exercise_idx + 1, len(exercises), coach_persona
            )
            segments.extend(exercise_segments)
            total_duration += sum(seg.duration_seconds for seg in exercise_segments)

        # Add workout completion segment
        completion_segment = self._create_completion_segment(workout_plan, coach_persona)
        segments.append(completion_segment)
        total_duration += completion_segment.duration_seconds

        # Create metadata
        metadata = {
            'exercise_count': len(exercises),
            'estimated_duration': total_duration,
            'ai_enhanced': True,
            'coach_persona': coach_persona,
            'user_preferences': user_preferences or {},
            'generation_timestamp': datetime.now().isoformat()
        }

        return WorkoutNarration(
            workout_id=workout_id,
            coach_persona=coach_persona,
            segments=segments,
            total_duration=total_duration,
            created_at=datetime.now(),
            metadata=metadata
        )

    def _create_welcome_segment(self, workout_plan: Dict[str, Any], coach_persona: str) -> NarrationSegment:
        """Create the workout welcome segment"""
        context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='welcome',
            exercise_name='',
            set_number=0,
            rep_count=0,
            has_pr=False
        )

        welcome_text = self.ai_enhancer.generate_enhanced_response(context)

        return NarrationSegment(
            phase='welcome',
            text=welcome_text,
            duration_seconds=self.default_durations['welcome'],
            priority=1,
            exercise_name=None
        )

    def _compose_exercise_segments(
        self,
        exercise: Dict[str, Any],
        exercise_number: int,
        total_exercises: int,
        coach_persona: str
    ) -> List[NarrationSegment]:
        """Compose all segments for a single exercise"""
        segments = []
        exercise_name = exercise.get('name', 'Unknown Exercise')

        # Add exercise transition if not the first exercise
        if exercise_number > 1:
            transition_segment = self._create_transition_segment(
                exercise_name, exercise_number, total_exercises, coach_persona
            )
            segments.append(transition_segment)

        # Process each set
        sets = exercise.get('sets', [])
        for set_idx, set_info in enumerate(sets):
            set_segments = self._compose_set_segments(
                exercise_name, set_info, set_idx + 1, len(sets), coach_persona
            )
            segments.extend(set_segments)

        return segments

    def _compose_set_segments(
        self,
        exercise_name: str,
        set_info: Dict[str, Any],
        set_number: int,
        total_sets: int,
        coach_persona: str
    ) -> List[NarrationSegment]:
        """Compose segments for a single set"""
        segments = []
        rep_count = set_info.get('reps', 10)
        has_pr = set_info.get('is_pr', False)

        # Set start segment
        start_context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='set_start',
            exercise_name=exercise_name,
            set_number=set_number,
            rep_count=rep_count,
            has_pr=has_pr
        )

        start_text = self.ai_enhancer.generate_enhanced_response(start_context)
        start_segment = NarrationSegment(
            phase='set_start',
            text=start_text,
            duration_seconds=self.default_durations['set_start'],
            priority=1,
            exercise_name=exercise_name,
            set_number=set_number,
            rep_count=rep_count,
            has_pr=has_pr
        )
        segments.append(start_segment)

        # Set end segment
        end_phase = 'set_end_pr' if has_pr else 'set_end_no_pr'
        end_context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='set_end',
            exercise_name=exercise_name,
            set_number=set_number,
            rep_count=rep_count,
            has_pr=has_pr
        )

        end_text = self.ai_enhancer.generate_enhanced_response(end_context)
        end_segment = NarrationSegment(
            phase=end_phase,
            text=end_text,
            duration_seconds=self.default_durations[end_phase],
            priority=1,
            exercise_name=exercise_name,
            set_number=set_number,
            rep_count=rep_count,
            has_pr=has_pr
        )
        segments.append(end_segment)

        # Rest segment (if not the last set)
        if set_number < total_sets:
            rest_segment = self._create_rest_segment(
                set_info.get('rest_seconds', 60), coach_persona
            )
            segments.append(rest_segment)

        return segments

    def _create_transition_segment(
        self,
        exercise_name: str,
        exercise_number: int,
        total_exercises: int,
        coach_persona: str
    ) -> NarrationSegment:
        """Create exercise transition segment"""
        context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='exercise_transition',
            exercise_name=exercise_name,
            set_number=0,
            rep_count=0,
            has_pr=False
        )

        transition_text = self.ai_enhancer.generate_enhanced_response(context)

        return NarrationSegment(
            phase='exercise_transition',
            text=transition_text,
            duration_seconds=self.default_durations['exercise_transition'],
            priority=2,
            exercise_name=exercise_name
        )

    def _create_rest_segment(self, rest_seconds: int, coach_persona: str) -> NarrationSegment:
        """Create rest period segment based on duration"""
        if rest_seconds <= 30:
            phase = 'rest_ready_30'
        elif rest_seconds <= 60:
            phase = 'rest_ready_60'
        else:
            phase = 'rest_force_90'

        context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='rest_start',
            exercise_name='',
            set_number=0,
            rep_count=0,
            has_pr=False,
            rest_time=rest_seconds
        )

        rest_text = self.ai_enhancer.generate_enhanced_response(context)

        return NarrationSegment(
            phase=phase,
            text=rest_text,
            duration_seconds=self.default_durations[phase],
            priority=2
        )

    def _create_completion_segment(self, workout_plan: Dict[str, Any], coach_persona: str) -> NarrationSegment:
        """Create workout completion segment"""
        context = CoachingContext(
            coach_persona=coach_persona,
            workout_phase='workout_complete',
            exercise_name='',
            set_number=0,
            rep_count=0,
            has_pr=False
        )

        completion_text = self.ai_enhancer.generate_enhanced_response(context)

        return NarrationSegment(
            phase='workout_complete',
            text=completion_text,
            duration_seconds=self.default_durations['workout_complete'],
            priority=1
        )

    def export_narration_script(self, narration: WorkoutNarration, output_path: str):
        """Export narration as JSON script for TypeScript integration"""
        script_data = {
            'workout_id': narration.workout_id,
            'coach_persona': narration.coach_persona,
            'total_duration': narration.total_duration,
            'created_at': narration.created_at.isoformat(),
            'metadata': narration.metadata,
            'segments': [
                {
                    'phase': seg.phase,
                    'text': seg.text,
                    'duration_seconds': seg.duration_seconds,
                    'priority': seg.priority,
                    'exercise_name': seg.exercise_name,
                    'set_number': seg.set_number,
                    'rep_count': seg.rep_count,
                    'has_pr': seg.has_pr
                }
                for seg in narration.segments
            ]
        }

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(script_data, f, indent=2)

        print(f"📝 Exported narration script to {output_path}")

    def get_narration_timeline(self, narration: WorkoutNarration) -> List[Dict[str, Any]]:
        """Get timeline of narration segments with timestamps"""
        timeline = []
        current_time = 0

        for segment in narration.segments:
            timeline.append({
                'start_time': current_time,
                'end_time': current_time + segment.duration_seconds,
                'phase': segment.phase,
                'text': segment.text,
                'exercise_name': segment.exercise_name,
                'set_number': segment.set_number
            })
            current_time += segment.duration_seconds

        return timeline

def main():
    """Demo the narration composer"""
    print("🎵 Git-Fit Narration Composer")
    print("=" * 50)

    # Initialize services
    composer = NarrationComposer()

    # Sample workout plan
    sample_workout = {
        'id': 'demo_workout_001',
        'name': 'Upper Body Strength',
        'exercises': [
            {
                'name': 'Bench Press',
                'sets': [
                    {'reps': 10, 'rest_seconds': 60, 'is_pr': False},
                    {'reps': 8, 'rest_seconds': 60, 'is_pr': False},
                    {'reps': 6, 'rest_seconds': 90, 'is_pr': True}
                ]
            },
            {
                'name': 'Pull-ups',
                'sets': [
                    {'reps': 8, 'rest_seconds': 60, 'is_pr': False},
                    {'reps': 6, 'rest_seconds': 60, 'is_pr': False},
                    {'reps': 4, 'rest_seconds': 90, 'is_pr': False}
                ]
            }
        ]
    }

    # Compose narration
    print("🎯 Composing workout narration...")
    narration = composer.compose_workout_narration(sample_workout, coach_persona='alice')

    print(f"📊 Workout: {narration.workout_id}")
    print(f"👤 Coach: {narration.coach_persona}")
    print(f"⏱️  Duration: {narration.total_duration} seconds")
    print(f"🎬 Segments: {len(narration.segments)}")

    print("\n📜 Narration Timeline:")
    timeline = composer.get_narration_timeline(narration)
    for i, entry in enumerate(timeline[:10]):  # Show first 10 segments
        print(f"{entry['start_time']:3d}s - {entry['phase']:20s}: {entry['text'][:50]}...")

    if len(timeline) > 10:
        print(f"... and {len(timeline) - 10} more segments")

    # Export script
    output_path = "src/lib/data/narrations/demo_workout_narration.json"
    composer.export_narration_script(narration, output_path)

    print("\n✅ Narration composition complete!")
    print("This service integrates seamlessly with your existing TypeScript narration system.")

if __name__ == "__main__":
    main()