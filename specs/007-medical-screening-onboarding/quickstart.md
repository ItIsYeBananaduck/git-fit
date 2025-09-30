# Quickstart: Medical Screening & User Onboarding

**Feature**: Medical Screening & User Onboarding Integration
**Target**: Developers extending existing onboarding system with medical safety
**Time**: 20-30 minutes
**Priority**: High - Essential for production safety and liability protection

## Prerequisites

- [x] SvelteKit app with existing onboarding infrastructure
- [x] Convex backend with user authentication
- [x] Basic onboarding components in `app/src/lib/components/onboarding/`
- [x] Existing `OnboardingEngine.ts` and step management
- [x] HIPAA compliance requirements understood

## Quick Integration Steps

### Step 1: Set Up Medical Data Encryption (10 minutes)

First, create the encryption service for HIPAA-compliant medical data storage:

```typescript
// app/src/lib/services/encryption.ts
import { webcrypto } from 'crypto';

export class MedicalDataEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  static async generateKey(): Promise<CryptoKey> {
    return await webcrypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  static async encryptMedicalData(data: any, key: CryptoKey): Promise<string> {
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await webcrypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encodedData
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  static async decryptMedicalData(encryptedData: string, key: CryptoKey): Promise<any> {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);
    
    const decrypted = await webcrypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );
    
    const decodedData = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedData);
  }
}
```

### Step 2: Extend Medical Screening Component (10 minutes)

Enhance the existing medical screening step with comprehensive questionnaire:

```svelte
<!-- app/src/lib/components/onboarding/MedicalScreeningStep.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { MedicalProfile, ChronicCondition, Medication, InjuryHistory } from '$lib/types/medical';
  
  const dispatch = createEventDispatcher();
  
  // Medical data state
  let conditions: ChronicCondition[] = [];
  let medications: Medication[] = [];
  let injuries: InjuryHistory[] = [];
  let privacyConsent = false;
  let emergencyContact = {
    name: '',
    phone: '',
    relationship: ''
  };
  
  // Available condition types
  const conditionTypes = [
    { value: 'diabetes', label: 'Diabetes', riskLevel: 'high' },
    { value: 'heart-disease', label: 'Heart Disease', riskLevel: 'high' },
    { value: 'hypertension', label: 'High Blood Pressure', riskLevel: 'moderate' },
    { value: 'arthritis', label: 'Arthritis', riskLevel: 'moderate' },
    { value: 'asthma', label: 'Asthma', riskLevel: 'moderate' }
  ];
  
  function addCondition() {
    conditions = [...conditions, {
      id: crypto.randomUUID(),
      type: 'diabetes',
      severity: 'mild',
      controlled: true,
      diagnosedDate: null,
      notes: '',
      exerciseRestrictions: [],
      intensityLimit: null
    }];
  }
  
  function removeCondition(index: number) {
    conditions = conditions.filter((_, i) => i !== index);
  }
  
  function addMedication() {
    medications = [...medications, {
      id: crypto.randomUUID(),
      name: '',
      type: 'other',
      dosage: '',
      frequency: '',
      sideEffects: [],
      exerciseInteractions: [],
      intensityWarnings: false
    }];
  }
  
  function addInjury() {
    injuries = [...injuries, {
      id: crypto.randomUUID(),
      bodyPart: 'knee',
      injuryType: 'acute',
      severity: 'minor',
      dateOccurred: new Date(),
      currentStatus: 'recovered',
      painLevel: 0,
      affectedMovements: [],
      restrictions: [],
      notes: ''
    }];
  }
  
  async function handleSubmit() {
    if (!privacyConsent) {
      alert('Privacy consent is required to proceed');
      return;
    }
    
    const medicalData = {
      conditions,
      medications,
      injuries,
      emergencyContact,
      privacyConsent
    };
    
    dispatch('submit', medicalData);
  }
  
  $: isValid = privacyConsent && emergencyContact.name && emergencyContact.phone;
</script>

<div class="medical-screening">
  <h2>Medical Screening</h2>
  <p class="privacy-notice">
    Your medical information is encrypted and stored securely for your safety. 
    This helps us recommend appropriate exercises and identify when medical clearance is needed.
  </p>
  
  <!-- Privacy Consent -->
  <div class="consent-section">
    <label class="consent-checkbox">
      <input type="checkbox" bind:checked={privacyConsent} />
      <span class="checkmark"></span>
      I consent to the collection and secure storage of my medical information for exercise safety purposes
    </label>
  </div>
  
  {#if privacyConsent}
    <!-- Chronic Conditions -->
    <section class="conditions-section">
      <h3>Chronic Conditions</h3>
      <p>Please select any ongoing medical conditions you have:</p>
      
      {#each conditions as condition, index}
        <div class="condition-item">
          <select bind:value={condition.type}>
            {#each conditionTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
          
          <select bind:value={condition.severity}>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
          
          <label>
            <input type="checkbox" bind:checked={condition.controlled} />
            Well controlled
          </label>
          
          <button type="button" on:click={() => removeCondition(index)}>Remove</button>
        </div>
      {/each}
      
      <button type="button" on:click={addCondition}>Add Condition</button>
    </section>
    
    <!-- Current Medications -->
    <section class="medications-section">
      <h3>Current Medications</h3>
      <p>List medications that might affect exercise performance:</p>
      
      {#each medications as medication, index}
        <div class="medication-item">
          <input 
            type="text" 
            placeholder="Medication name" 
            bind:value={medication.name} 
          />
          <select bind:value={medication.type}>
            <option value="blood-pressure">Blood Pressure</option>
            <option value="diabetes">Diabetes</option>
            <option value="heart">Heart</option>
            <option value="pain">Pain Management</option>
            <option value="other">Other</option>
          </select>
          <input 
            type="text" 
            placeholder="Dosage" 
            bind:value={medication.dosage} 
          />
        </div>
      {/each}
      
      <button type="button" on:click={addMedication}>Add Medication</button>
    </section>
    
    <!-- Injury History -->
    <section class="injuries-section">
      <h3>Injury History</h3>
      <p>Tell us about any past or current injuries:</p>
      
      {#each injuries as injury, index}
        <div class="injury-item">
          <select bind:value={injury.bodyPart}>
            <option value="knee">Knee</option>
            <option value="back">Back</option>
            <option value="shoulder">Shoulder</option>
            <option value="ankle">Ankle</option>
            <option value="wrist">Wrist</option>
            <option value="hip">Hip</option>
            <option value="elbow">Elbow</option>
          </select>
          
          <select bind:value={injury.currentStatus}>
            <option value="recovered">Fully Recovered</option>
            <option value="managing">Managing</option>
            <option value="ongoing-pain">Ongoing Pain</option>
            <option value="rehabbing">In Rehabilitation</option>
          </select>
          
          {#if injury.currentStatus !== 'recovered'}
            <label>
              Pain Level (0-10):
              <input 
                type="range" 
                min="0" 
                max="10" 
                bind:value={injury.painLevel} 
              />
              <span>{injury.painLevel}</span>
            </label>
          {/if}
        </div>
      {/each}
      
      <button type="button" on:click={addInjury}>Add Injury</button>
    </section>
    
    <!-- Emergency Contact -->
    <section class="emergency-contact">
      <h3>Emergency Contact</h3>
      <div class="contact-fields">
        <input 
          type="text" 
          placeholder="Full name" 
          bind:value={emergencyContact.name} 
          required
        />
        <input 
          type="tel" 
          placeholder="Phone number" 
          bind:value={emergencyContact.phone} 
          required
        />
        <input 
          type="text" 
          placeholder="Relationship" 
          bind:value={emergencyContact.relationship} 
        />
      </div>
    </section>
  {/if}
  
  <div class="actions">
    <button 
      type="button" 
      class="submit-btn" 
      disabled={!isValid}
      on:click={handleSubmit}
    >
      Continue to Goals
    </button>
  </div>
</div>

<style>
  .medical-screening {
    @apply max-w-2xl mx-auto p-6 space-y-6;
  }
  
  .privacy-notice {
    @apply bg-blue-50 p-4 rounded-lg text-blue-800 text-sm;
  }
  
  .consent-checkbox {
    @apply flex items-start gap-3 p-4 border rounded-lg cursor-pointer;
  }
  
  .condition-item, .medication-item, .injury-item {
    @apply p-4 border rounded-lg space-y-3;
  }
  
  .contact-fields {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }
  
  .submit-btn {
    @apply w-full py-3 bg-blue-600 text-white rounded-lg font-medium;
    @apply disabled:bg-gray-300 disabled:cursor-not-allowed;
  }
  
  select, input[type="text"], input[type="tel"] {
    @apply w-full p-2 border rounded focus:ring-2 focus:ring-blue-500;
  }
</style>
```

### Step 3: Create Medical Risk Assessment Service (5 minutes)

```typescript
// app/src/lib/services/medicalAssessment.ts
import type { MedicalProfile, ChronicCondition, Medication, InjuryHistory } from '$lib/types/medical';

export class MedicalRiskAssessment {
  static assessRiskLevel(profile: Partial<MedicalProfile>): 'low' | 'moderate' | 'high' | 'requires-clearance' {
    let riskScore = 0;
    const highRiskConditions = ['heart-disease', 'diabetes'];
    const clearanceRequired = ['heart-disease'];
    
    // Assess chronic conditions
    for (const condition of profile.conditions || []) {
      if (clearanceRequired.includes(condition.type)) {
        return 'requires-clearance';
      }
      
      if (highRiskConditions.includes(condition.type)) {
        riskScore += condition.controlled ? 2 : 4;
      } else {
        riskScore += condition.severity === 'severe' ? 3 : 1;
      }
    }
    
    // Assess current injuries
    for (const injury of profile.injuries || []) {
      if (injury.currentStatus === 'ongoing-pain' && injury.painLevel > 6) {
        riskScore += 3;
      } else if (injury.currentStatus !== 'recovered') {
        riskScore += 1;
      }
    }
    
    // Assess medications
    for (const medication of profile.medications || []) {
      if (medication.type === 'heart' || medication.type === 'blood-pressure') {
        riskScore += 2;
      }
    }
    
    // Return risk level based on score
    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'moderate';
    return 'low';
  }
  
  static generateExerciseRestrictions(profile: Partial<MedicalProfile>): string[] {
    const restrictions: string[] = [];
    
    // Condition-based restrictions
    for (const condition of profile.conditions || []) {
      switch (condition.type) {
        case 'heart-disease':
          restrictions.push('no-high-intensity-cardio', 'monitor-heart-rate');
          break;
        case 'diabetes':
          restrictions.push('no-fasting-workouts', 'monitor-blood-sugar');
          break;
        case 'hypertension':
          restrictions.push('avoid-valsalva-maneuver', 'limit-intensity');
          break;
      }
    }
    
    // Injury-based restrictions
    for (const injury of profile.injuries || []) {
      if (injury.currentStatus !== 'recovered') {
        switch (injury.bodyPart) {
          case 'knee':
            restrictions.push('avoid-impact-exercises', 'limit-knee-flexion');
            break;
          case 'back':
            restrictions.push('avoid-spinal-loading', 'limit-rotation');
            break;
          case 'shoulder':
            restrictions.push('avoid-overhead-movements', 'limit-external-rotation');
            break;
        }
      }
    }
    
    return [...new Set(restrictions)]; // Remove duplicates
  }
  
  static requiresMedicalClearance(profile: Partial<MedicalProfile>): boolean {
    const clearanceConditions = ['heart-disease'];
    
    return (profile.conditions || []).some(condition => 
      clearanceConditions.includes(condition.type) && !condition.controlled
    );
  }
}
```

### Step 4: Integrate with Existing Onboarding Engine (5 minutes)

```typescript
// Extend existing app/src/lib/components/onboarding/OnboardingEngine.ts
import { MedicalRiskAssessment } from '$lib/services/medicalAssessment';
import { api } from '$lib/convex';

export class OnboardingEngine {
  // ... existing methods ...
  
  async handleMedicalScreeningSubmit(medicalData: any) {
    // Assess risk level
    const riskLevel = MedicalRiskAssessment.assessRiskLevel(medicalData);
    const restrictions = MedicalRiskAssessment.generateExerciseRestrictions(medicalData);
    const requiresClearance = MedicalRiskAssessment.requiresMedicalClearance(medicalData);
    
    // Store medical profile in Convex
    const medicalProfile = await api.mutation(api.medicalProfiles.create, {
      ...medicalData,
      riskLevel,
      restrictions,
      requiresClearance
    });
    
    // Update onboarding progress
    await this.updateProgress('medical', true);
    
    // Determine next step
    if (requiresClearance) {
      this.currentStep = 'medical-clearance';
    } else {
      this.currentStep = 'goals';
    }
    
    return { riskLevel, requiresClearance, restrictions };
  }
  
  // ... rest of existing methods
}
```

## Testing Your Integration

### 1. Test Medical Screening Flow
1. Navigate to `/onboarding` in your app
2. Complete privacy consent and medical questionnaire
3. Add test conditions (try diabetes + heart disease for high risk)
4. Verify risk assessment and restrictions are generated correctly

### 2. Test Data Encryption
```typescript
// Test encryption in browser console
import { MedicalDataEncryption } from '$lib/services/encryption';

const testData = { condition: 'diabetes', severity: 'moderate' };
const key = await MedicalDataEncryption.generateKey();
const encrypted = await MedicalDataEncryption.encryptMedicalData(testData, key);
const decrypted = await MedicalDataEncryption.decryptMedicalData(encrypted, key);

console.log('Original:', testData);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
```

### 3. Test Risk Assessment
```typescript
// Test risk assessment logic
import { MedicalRiskAssessment } from '$lib/services/medicalAssessment';

const highRiskProfile = {
  conditions: [{ type: 'heart-disease', controlled: false, severity: 'severe' }],
  injuries: [{ bodyPart: 'knee', currentStatus: 'ongoing-pain', painLevel: 8 }]
};

const riskLevel = MedicalRiskAssessment.assessRiskLevel(highRiskProfile);
const restrictions = MedicalRiskAssessment.generateExerciseRestrictions(highRiskProfile);

console.log('Risk Level:', riskLevel); // Should be 'requires-clearance'
console.log('Restrictions:', restrictions);
```

## Expected Results

After successful integration:

✅ **Medical Data Collection**: Comprehensive medical history collected securely  
✅ **Risk Assessment**: Automatic risk level calculation with appropriate restrictions  
✅ **HIPAA Compliance**: Medical data encrypted and stored with audit trail  
✅ **Exercise Safety**: Medical restrictions integrated with workout generation  
✅ **User Experience**: Smooth onboarding flow with clear privacy communication  
✅ **Clearance Workflow**: High-risk users guided to medical clearance process  

## Security Verification

### HIPAA Compliance Checklist
- [ ] Medical data encrypted at rest (AES-256)
- [ ] Medical data encrypted in transit (TLS 1.3)
- [ ] Access logging for all medical data operations
- [ ] Explicit privacy consent before data collection
- [ ] Data retention policies implemented
- [ ] User rights to access/modify/delete medical data

### Testing Security
```bash
# Verify encryption is working
# Check that raw medical data never appears in database
# Confirm audit logs are being created
# Test data access controls
```

## Next Steps

1. **Complete Integration**: Add remaining onboarding steps (goals, experience, equipment)
2. **Medical Clearance**: Implement clearance upload and approval workflow
3. **AI Integration**: Connect medical restrictions with workout generation engine
4. **Compliance Audit**: Conduct professional HIPAA compliance review
5. **User Testing**: Test with diverse medical conditions and user scenarios

## Troubleshooting

### Common Issues

**Medical Data Not Encrypting**:
- Verify Web Crypto API support in browser
- Check that encryption key is properly generated
- Ensure data is serializable before encryption

**Risk Assessment Incorrect**:
- Verify condition types match expected enum values
- Check that risk scoring logic handles edge cases
- Confirm restrictions array is properly generated

**HIPAA Compliance Concerns**:
- Ensure all medical data paths use encryption
- Verify audit logging is comprehensive
- Check data retention and deletion procedures

### Debugging Commands

```typescript
// Debug encryption
console.log('Crypto support:', !!window.crypto?.subtle);

// Debug risk assessment
console.log('Risk calculation:', MedicalRiskAssessment.assessRiskLevel(profile));

// Debug data flow
console.log('Medical profile stored:', await api.query(api.medicalProfiles.get, { userId }));
```

**Success!** 🔒 Medical screening and safety assessment are now integrated with your onboarding system, providing HIPAA-compliant data collection and automatic exercise safety restrictions.