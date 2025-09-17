<script lang="ts">
import { api } from '$lib/convex/_generated/api';
let file: File | null = null;
let error = '';
let uploadStatus = '';

// Replace with actual IDs from auth/user context
let trainerId = '';
let userId = '';

function handleFileChange(event: Event) {
  error = '';
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  file = input.files[0];
}

async function uploadCertification() {
  if (!file) {
    error = 'Please select a file.';
    return;
  }
  try {
    uploadStatus = 'Uploading...';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(e.target?.result as ArrayBuffer)));
      await api.trainerCertifications.uploadTrainerCertification({
        trainerId,
        userId,
        filename: file.name,
        mimetype: file.type,
        fileContent: base64
      });
      uploadStatus = 'Upload successful!';
    };
    reader.onerror = () => {
      error = 'File read error.';
      uploadStatus = '';
    };
    reader.readAsArrayBuffer(file);
  } catch (e: any) {
    error = e.message || 'Upload failed.';
    uploadStatus = '';
  }
}
</script>

<div class="space-y-4">
  <label class="block font-medium">Upload Certification (PDF or Image)</label>
  <input type="file" accept=".pdf,image/*" on:change={handleFileChange} />
  {#if error}
    <div class="text-red-600">{error}</div>
  {/if}
  <button class="bg-primary text-white px-4 py-2 rounded" on:click={uploadCertification}>
    Upload
  </button>
  {#if uploadStatus}
    <div class="text-blue-700">{uploadStatus}</div>
  {/if}
</div>
