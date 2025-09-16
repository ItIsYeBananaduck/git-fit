<script lang="ts">
  export type SplitOption = {
    name: string;
    days: number;
    description: string;
    pros: string[];
    cons: string[];
    recommendedFor: string;
  };

  export let splits: SplitOption[] = [
    {
      name: "Full Body 3x",
      days: 3,
      description: "Full body workouts 3x/week. Great for beginners and busy schedules.",
      pros: ["Efficient for limited time", "Frequent muscle stimulation", "Simple structure"],
      cons: ["Limited volume per muscle group", "Can be fatiguing if not managed"],
      recommendedFor: "Beginners, general fitness, time-constrained"
    },
    {
      name: "Upper/Lower",
      days: 4,
      description: "Upper and lower body split, 4x/week. Balanced for most goals.",
      pros: ["Good balance of frequency and volume", "Easier recovery management"],
      cons: ["Requires 4 days/week", "Less specialization"],
      recommendedFor: "All levels, balanced goals"
    },
    {
      name: "Push/Pull/Legs (PPL)",
      days: 6,
      description: "Classic PPL split, 6x/week. High frequency and volume.",
      pros: ["High training frequency", "Customizable", "Popular for hypertrophy"],
      cons: ["Requires 5-6 days/week", "Can be hard to recover for some"],
      recommendedFor: "Intermediate/advanced, muscle gain"
    },
    {
      name: "Body Part Split",
      days: 5,
      description: ""Bro split" with one muscle group per day. 5x/week.",
      pros: ["High volume per muscle group", "Simple to follow"],
      cons: ["Low frequency per muscle group", "Not optimal for all goals"],
      recommendedFor: "Advanced, bodybuilding"
    },
    {
      name: "Custom",
      days: 0,
      description: "Your own split (e.g., PPL + arms/core + cardio). Tailored to your needs.",
      pros: ["Fully personalized", "Can address specific goals"],
      cons: ["Requires planning", "May lack structure if not careful"],
      recommendedFor: "Experienced, specific needs"
    }
  ];

  export let onSelect: (split: SplitOption) => void;
</script>

<div class="split-comparison-panel">
	<h2>Compare Training Splits</h2>
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Days/Week</th>
				<th>Description</th>
				<th>Pros</th>
				<th>Cons</th>
				<th>Recommended For</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each splits as split}
				<tr>
					<td>{split.name}</td>
					<td>{split.days > 0 ? split.days : 'Custom'}</td>
					<td>{split.description}</td>
					<td
						><ul>
							{#each split.pros as pro}<li>{pro}</li>{/each}
						</ul></td
					>
					<td
						><ul>
							{#each split.cons as con}<li>{con}</li>{/each}
						</ul></td
					>
					<td>{split.recommendedFor}</td>
					<td><button type="button" on:click={() => onSelect(split)}>Select</button></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="educational-content">
		<h3>How to Choose a Split</h3>
		<ul>
			<li>
				<strong>Beginners:</strong> Start with full body or upper/lower splits for frequency and recovery.
			</li>
			<li>
				<strong>Intermediate:</strong> Try PPL or upper/lower for more volume and specialization.
			</li>
			<li>
				<strong>Advanced:</strong> Consider body part splits or custom routines for specific goals.
			</li>
			<li>Always match your split to your schedule, recovery, and preferences.</li>
		</ul>
	</div>
</div>

<style>
	.split-comparison-panel {
		max-width: 1000px;
		margin: 2rem auto;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		padding: 2rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}
	th,
	td {
		border: 1px solid #e0e0e0;
		padding: 0.5rem;
		text-align: left;
		vertical-align: top;
	}
	th {
		background: #f8f8f8;
	}
	ul {
		margin: 0;
		padding-left: 1.2em;
	}
	button {
		padding: 0.4rem 1rem;
		border: none;
		border-radius: 4px;
		background: #0070f3;
		color: #fff;
		cursor: pointer;
	}
	.educational-content {
		margin-top: 2rem;
		background: #f6faff;
		border-radius: 6px;
		padding: 1rem 1.5rem;
	}
</style>
