<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		trainerCalendarManager,
		type TrainerCalendarEvent,
		type ClientSummary
	} from '$lib/services/trainerCalendarManager.js';
	import type { Id } from '$lib/convex/_generated/dataModel.js';

	export let trainerId: Id<'users'>;
	export let selectedDate: Date = new Date();

	const dispatch = createEventDispatcher<{
		eventCreated: TrainerCalendarEvent;
		eventUpdated: TrainerCalendarEvent;
		eventDeleted: { eventId: string };
		clientSelected: { clientId: Id<'users'>; summary: ClientSummary };
	}>();

	let events: TrainerCalendarEvent[] = [];
	let selectedEvent: TrainerCalendarEvent | null = null;
	let showEventModal = false;
	let showClientModal = false;
	let selectedClientId: Id<'users'> | null = null;
	let clientSummary: ClientSummary | null = null;

	// Event form data
	let eventForm = {
		clientId: '' as string,
		title: '',
		description: '',
		eventType: 'session' as TrainerCalendarEvent['eventType'],
		startTime: '',
		endTime: '',
		status: 'scheduled' as TrainerCalendarEvent['status'],
		location: 'virtual' as TrainerCalendarEvent['location'],
		notes: ''
	};

	// Load events for the selected date
	$: {
		const startOfDay = new Date(selectedDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(selectedDate);
		endOfDay.setHours(23, 59, 59, 999);

		events = trainerCalendarManager.getEvents(trainerId, {
			startDate: startOfDay.getTime(),
			endDate: endOfDay.getTime()
		});
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDateTime(timestamp: number): string {
		return new Date(timestamp).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function getEventTypeColor(type: TrainerCalendarEvent['eventType']): string {
		const colors = {
			session: 'bg-blue-100 text-blue-800',
			consultation: 'bg-green-100 text-green-800',
			assessment: 'bg-purple-100 text-purple-800',
			follow_up: 'bg-yellow-100 text-yellow-800',
			other: 'bg-gray-100 text-gray-800'
		};
		return colors[type];
	}

	function getStatusColor(status: TrainerCalendarEvent['status']): string {
		const colors = {
			scheduled: 'bg-gray-100 text-gray-800',
			confirmed: 'bg-blue-100 text-blue-800',
			completed: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			no_show: 'bg-orange-100 text-orange-800'
		};
		return colors[status];
	}

	function createNewEvent() {
		selectedEvent = null;
		eventForm = {
			clientId: '',
			title: '',
			description: '',
			eventType: 'session',
			startTime: '',
			endTime: '',
			status: 'scheduled',
			location: 'virtual',
			notes: ''
		};
		showEventModal = true;
	}

	function editEvent(event: TrainerCalendarEvent) {
		selectedEvent = event;
		eventForm = {
			clientId: event.clientId as string,
			title: event.title,
			description: event.description || '',
			eventType: event.eventType,
			startTime: new Date(event.startTime).toISOString().slice(0, 16),
			endTime: new Date(event.endTime).toISOString().slice(0, 16),
			status: event.status,
			location: event.location || 'virtual',
			notes: event.notes || ''
		};
		showEventModal = true;
	}

	async function saveEvent() {
		try {
			const eventData = {
				trainerId,
				clientId: eventForm.clientId as Id<'users'>,
				title: eventForm.title,
				description: eventForm.description || undefined,
				eventType: eventForm.eventType,
				startTime: new Date(eventForm.startTime).getTime(),
				endTime: new Date(eventForm.endTime).getTime(),
				status: eventForm.status,
				location: eventForm.location,
				notes: eventForm.notes || undefined
			};

			if (selectedEvent) {
				// Update existing event
				const updated = trainerCalendarManager.updateEvent(trainerId, selectedEvent.id, eventData);
				if (updated) {
					dispatch('eventUpdated', updated);
				}
			} else {
				// Create new event
				const newEvent = trainerCalendarManager.createEvent(eventData);
				dispatch('eventCreated', newEvent);
			}

			showEventModal = false;
			// Refresh events list
			events = trainerCalendarManager.getEvents(trainerId, {
				startDate: new Date(selectedDate).setHours(0, 0, 0, 0),
				endDate: new Date(selectedDate).setHours(23, 59, 59, 999)
			});
		} catch (error) {
			console.error('Failed to save event:', error);
		}
	}

	function deleteEvent(event: TrainerCalendarEvent) {
		if (confirm('Are you sure you want to delete this event?')) {
			const success = trainerCalendarManager.deleteEvent(trainerId, event.id);
			if (success) {
				dispatch('eventDeleted', { eventId: event.id });
				// Refresh events list
				events = trainerCalendarManager.getEvents(trainerId, {
					startDate: new Date(selectedDate).setHours(0, 0, 0, 0),
					endDate: new Date(selectedDate).setHours(23, 59, 59, 999)
				});
			}
		}
	}

	function viewClientSummary(event: TrainerCalendarEvent) {
		selectedClientId = event.clientId;
		clientSummary = trainerCalendarManager.getClientSummary(trainerId, event.clientId);
		showClientModal = true;
		dispatch('clientSelected', { clientId: event.clientId, summary: clientSummary! });
	}

	function closeModals() {
		showEventModal = false;
		showClientModal = false;
		selectedEvent = null;
		selectedClientId = null;
		clientSummary = null;
	}

	// Navigation functions
	function previousDay() {
		selectedDate = new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
	}

	function nextDay() {
		selectedDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
	}

	function goToToday() {
		selectedDate = new Date();
	}
</script>

<div class="bg-white rounded-lg shadow-lg p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center space-x-4">
			<button on:click={previousDay} class="p-2 hover:bg-gray-100 rounded-md transition-colors">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path>
				</svg>
			</button>

			<h2 class="text-2xl font-bold text-gray-900">
				{selectedDate.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</h2>

			<button on:click={nextDay} class="p-2 hover:bg-gray-100 rounded-md transition-colors">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
					></path>
				</svg>
			</button>

			<button
				on:click={goToToday}
				class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
			>
				Today
			</button>
		</div>

		<button
			on:click={createNewEvent}
			class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
				></path>
			</svg>
			<span>New Event</span>
		</button>
	</div>

	<!-- Events List -->
	<div class="space-y-4">
		{#if events.length === 0}
			<div class="text-center py-12 text-gray-500">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">No events scheduled</h3>
				<p class="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
			</div>
		{:else}
			{#each events as event (event.id)}
				<div
					class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
				>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<div class="flex items-center space-x-3 mb-2">
								<h3 class="text-lg font-semibold text-gray-900">{event.title}</h3>
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEventTypeColor(
										event.eventType
									)}"
								>
									{event.eventType}
								</span>
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(
										event.status
									)}"
								>
									{event.status}
								</span>
							</div>

							<div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
								<span class="flex items-center space-x-1">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span
										>{formatDateTime(event.startTime)} - {formatTime(new Date(event.endTime))}</span
									>
								</span>

								{#if event.location}
									<span class="flex items-center space-x-1">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											></path>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											></path>
										</svg>
										<span class="capitalize">{event.location.replace('_', ' ')}</span>
									</span>
								{/if}
							</div>

							{#if event.description}
								<p class="text-sm text-gray-700 mb-2">{event.description}</p>
							{/if}

							{#if event.notes}
								<p class="text-sm text-gray-500 italic">{event.notes}</p>
							{/if}
						</div>

						<div class="flex items-center space-x-2 ml-4">
							<button
								on:click={() => viewClientSummary(event)}
								class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
								title="View client summary"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									></path>
								</svg>
							</button>

							<button
								on:click={() => editEvent(event)}
								class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
								title="Edit event"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									></path>
								</svg>
							</button>

							<button
								on:click={() => deleteEvent(event)}
								class="p-2 text-gray-400 hover:text-red-600 transition-colors"
								title="Delete event"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									></path>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Event Modal -->
{#if showEventModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
			<div class="flex items-center justify-between p-6 border-b">
				<h3 class="text-lg font-semibold text-gray-900">
					{selectedEvent ? 'Edit Event' : 'Create New Event'}
				</h3>
				<button on:click={closeModals} class="text-gray-400 hover:text-gray-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={saveEvent} class="p-6 space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
					<input
						type="text"
						bind:value={eventForm.clientId}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter client ID"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input
						type="text"
						bind:value={eventForm.title}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Event title"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
					<select
						bind:value={eventForm.eventType}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="session">Session</option>
						<option value="consultation">Consultation</option>
						<option value="assessment">Assessment</option>
						<option value="follow_up">Follow-up</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
						<input
							type="datetime-local"
							bind:value={eventForm.startTime}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
						<input
							type="datetime-local"
							bind:value={eventForm.endTime}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
					<select
						bind:value={eventForm.status}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="scheduled">Scheduled</option>
						<option value="confirmed">Confirmed</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
						<option value="no_show">No Show</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
					<select
						bind:value={eventForm.location}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="virtual">Virtual</option>
						<option value="in_person">In Person</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<textarea
						bind:value={eventForm.description}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Optional description"
					></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
					<textarea
						bind:value={eventForm.notes}
						rows="2"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Optional notes"
					></textarea>
				</div>

				<div class="flex justify-end space-x-3 pt-4">
					<button
						type="button"
						on:click={closeModals}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
					>
						{selectedEvent ? 'Update Event' : 'Create Event'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Client Summary Modal -->
{#if showClientModal && clientSummary}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b">
				<h3 class="text-lg font-semibold text-gray-900">Client Summary</h3>
				<button on:click={closeModals} class="text-gray-400 hover:text-gray-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<div class="p-6">
				<!-- Performance Metrics -->
				<div class="grid grid-cols-3 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg">
						<h4 class="text-sm font-medium text-blue-900">Strength</h4>
						<p class="text-2xl font-bold text-blue-600">{clientSummary.performance.strength}%</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg">
						<h4 class="text-sm font-medium text-green-900">Consistency</h4>
						<p class="text-2xl font-bold text-green-600">
							{clientSummary.performance.consistency}%
						</p>
					</div>
					<div class="bg-purple-50 p-4 rounded-lg">
						<h4 class="text-sm font-medium text-purple-900">Progress</h4>
						<p class="text-2xl font-bold text-purple-600">{clientSummary.performance.progress}%</p>
					</div>
				</div>

				<!-- Session Info -->
				<div class="mb-6">
					<h4 class="text-sm font-medium text-gray-900 mb-2">Session Summary</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium">Total Sessions:</span>
							<span class="ml-1">{clientSummary.totalSessions}</span>
						</div>
						<div>
							<span class="font-medium">Upcoming Sessions:</span>
							<span class="ml-1">{clientSummary.upcomingSessions}</span>
						</div>
						<div>
							<span class="font-medium">Last Session:</span>
							<span class="ml-1"
								>{clientSummary.lastSession
									? new Date(clientSummary.lastSession).toLocaleDateString()
									: 'None'}</span
							>
						</div>
						<div>
							<span class="font-medium">Goals Progress:</span>
							<span class="ml-1">{clientSummary.goals.progress}%</span>
						</div>
					</div>
				</div>

				<!-- Insights -->
				{#if clientSummary.insights.length > 0}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
						<ul class="space-y-2">
							{#each clientSummary.insights as insight}
								<li class="flex items-start space-x-2">
									<svg
										class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clip-rule="evenodd"
										></path>
									</svg>
									<span class="text-sm text-gray-700">{insight}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Recommendations -->
				{#if clientSummary.recommendations.length > 0}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
						<ul class="space-y-2">
							{#each clientSummary.recommendations as recommendation}
								<li class="flex items-start space-x-2">
									<svg
										class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										></path>
									</svg>
									<span class="text-sm text-gray-700">{recommendation}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Recent Workouts -->
				{#if clientSummary.recentWorkouts.length > 0}
					<div>
						<h4 class="text-sm font-medium text-gray-900 mb-2">Recent Workouts</h4>
						<div class="space-y-2">
							{#each clientSummary.recentWorkouts as workout}
								<div class="bg-gray-50 p-3 rounded-md">
									<div class="flex justify-between items-start mb-1">
										<span class="text-sm font-medium text-gray-900">
											{new Date(workout.date).toLocaleDateString()}
										</span>
										<span class="text-xs text-gray-500">
											{workout.exercises.length} exercises
										</span>
									</div>
									<p class="text-xs text-gray-600">
										{workout.exercises.join(', ')}
									</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="flex justify-end p-6 border-t bg-gray-50">
				<button
					on:click={closeModals}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
