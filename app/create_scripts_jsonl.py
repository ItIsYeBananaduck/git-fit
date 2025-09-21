import json
import os

def create_scripts_jsonl():
    """Create scripts.jsonl from alice.json and aiden.json"""

    # Categories to extract from both personas
    categories = [
        "welcome", "set_start", "set_end_no_pr", "set_end_pr",
        "rest_start_standard", "rest_ready_30", "rest_ready_60", "rest_force_90",
        "exercise_transition", "workout_complete"
    ]

    scripts = []

    # Load alice.json
    alice_path = "src/lib/data/personas/alice.json"
    if os.path.exists(alice_path):
        with open(alice_path, 'r') as f:
            alice_data = json.load(f)

        if "phrases" in alice_data:
            for category in categories:
                if category in alice_data["phrases"]:
                    for phrase in alice_data["phrases"][category]:
                        scripts.append({"text": phrase})

    # Load aiden.json
    aiden_path = "src/lib/data/personas/aiden.json"
    if os.path.exists(aiden_path):
        with open(aiden_path, 'r') as f:
            aiden_data = json.load(f)

        if "phrases" in aiden_data:
            for category in categories:
                if category in aiden_data["phrases"]:
                    for phrase in aiden_data["phrases"][category]:
                        scripts.append({"text": phrase})

    # Write to scripts.jsonl
    with open("scripts.jsonl", 'w') as f:
        for script in scripts:
            f.write(json.dumps(script) + '\n')

    print(f"Created scripts.jsonl with {len(scripts)} phrases")

if __name__ == "__main__":
    create_scripts_jsonl()