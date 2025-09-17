<script lang="ts">
import { api } from '$lib/convex/_generated/api';
import { onMount } from 'svelte';

let certifications = [];
let error = '';
let reviewStatus = '';

async function fetchCertifications() {
  try {
    certifications = await api.adminCertifications.listPendingCertifications({});
  } catch (e: any) {
    error = e.message || 'Failed to fetch certifications.';
  }
}

async function reviewCertification(certificationId: string, status: 'approved' | 'rejected', adminId: string, reviewNotes: string) {
  try {
    reviewStatus = 'Submitting...';
    await api.adminCertifications.reviewTrainerCertification({
      certificationId,
      status,
      adminId,
      reviewNotes
    });
    reviewStatus = `Certification ${status}.`;
    await fetchCertifications();
  } catch (e: any) {
    error = e.message || 'Review failed.';
    reviewStatus = '';
  }
}

onMount(fetchCertifications);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900 mb-4">Trainer Certification Review</h1>
  {#if error}
    <div class="text-red-600">{error}</div>
  {/if}
  {#if reviewStatus}
    <div class="text-blue-700">{reviewStatus}</div>
  {/if}
  {#if certifications.length === 0}
    <div class="text-gray-600">No pending certifications.</div>
  {:else}
    <div class="grid gap-6">
      {#each certifications as cert}
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex justify-between items-center mb-2">
            <div>
              <div class="font-medium text-gray-900">Trainer ID: {cert.trainerId}</div>
              <div class="text-sm text-gray-600">User ID: {cert.userId}</div>
              <div class="text-sm text-gray-600">Filename: {cert.filename}</div>
              <div class="text-sm text-gray-600">Uploaded: {new Date(cert.uploadedAt).toLocaleString()}</div>
            </div>
            <a href={`data:${cert.mimetype};base64,${cert.fileContent}`} target="_blank" class="text-primary underline ml-4">View File</a>
          </div>
          <div class="flex gap-2 mt-2">
            <button class="bg-green-600 text-white px-4 py-2 rounded" on:click={() => reviewCertification(cert._id, 'approved', 'ADMIN_ID', '')}>Approve</button>
            <button class="bg-red-600 text-white px-4 py-2 rounded" on:click={() => reviewCertification(cert._id, 'rejected', 'ADMIN_ID', '')}>Reject</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
