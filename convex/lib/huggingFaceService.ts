/**
 * Hugging Face Hub Integration Service
 * Handles AI model training, deployment, and management
 */

import { ConvexError } from 'convex/values';

export interface HuggingFaceConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ModelTrainingRequest {
  modelName: string;
  baseModel: string;
  trainingData: any[];
  hyperparameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    warmupSteps?: number;
    weightDecay?: number;
  };
  tags?: string[];
  description?: string;
}

export interface ModelTrainingResponse {
  jobId: string;
  modelName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime?: number;
}

export interface ModelInferenceRequest {
  modelName: string;
  inputs: any;
  parameters?: Record<string, any>;
}

export interface ModelInferenceResponse {
  predictions: any[];
  confidence?: number;
  processingTime: number;
}

export interface DatasetUploadRequest {
  datasetName: string;
  data: any[];
  description?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface DatasetUploadResponse {
  datasetId: string;
  datasetName: string;
  uploadUrl: string;
}

export class HuggingFaceService {
  private config: HuggingFaceConfig;

  constructor(config: HuggingFaceConfig) {
    this.config = config;
  }

  /**
   * Start a model training job
   */
  async startTraining(request: ModelTrainingRequest): Promise<ModelTrainingResponse> {
    const url = `${this.config.baseUrl}/api/training-jobs`;

    const body = {
      model_name: request.modelName,
      base_model: request.baseModel,
      training_data: request.trainingData,
      hyperparameters: {
        learning_rate: request.hyperparameters.learningRate,
        per_device_train_batch_size: request.hyperparameters.batchSize,
        num_train_epochs: request.hyperparameters.epochs,
        warmup_steps: request.hyperparameters.warmupSteps || 500,
        weight_decay: request.hyperparameters.weightDecay || 0.01,
      },
      tags: request.tags || [],
      description: request.description,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace training error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        jobId: result.job_id || result.id,
        modelName: request.modelName,
        status: 'pending',
        estimatedTime: result.estimated_time,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to start training: ${error}`);
    }
  }

  /**
   * Check training job status
   */
  async getTrainingStatus(jobId: string): Promise<ModelTrainingResponse> {
    const url = `${this.config.baseUrl}/api/training-jobs/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace status error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        jobId: result.job_id || result.id,
        modelName: result.model_name,
        status: result.status,
        estimatedTime: result.estimated_time,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get training status: ${error}`);
    }
  }

  /**
   * Run inference on a trained model
   */
  async runInference(request: ModelInferenceRequest): Promise<ModelInferenceResponse> {
    const url = `${this.config.baseUrl}/models/${request.modelName}`;

    const body = {
      inputs: request.inputs,
      parameters: request.parameters || {},
    };

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace inference error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        predictions: Array.isArray(result) ? result : [result],
        confidence: result.confidence || result.score,
        processingTime,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to run inference: ${error}`);
    }
  }

  /**
   * Upload dataset to Hugging Face Hub
   */
  async uploadDataset(request: DatasetUploadRequest): Promise<DatasetUploadResponse> {
    const url = `${this.config.baseUrl}/api/datasets`;

    const body = {
      name: request.datasetName,
      description: request.description,
      tags: request.tags || [],
      private: request.isPrivate || false,
      data: request.data,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace dataset error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        datasetId: result.dataset_id || result.id,
        datasetName: request.datasetName,
        uploadUrl: result.upload_url || result.url,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to upload dataset: ${error}`);
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<any> {
    const url = `${this.config.baseUrl}/api/models/${modelName}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace model info error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get model info: ${error}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<boolean> {
    const url = `${this.config.baseUrl}/api/models/${modelName}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      throw new ConvexError(`Failed to delete model: ${error}`);
    }
  }

  /**
   * Get user's models
   */
  async getUserModels(): Promise<any[]> {
    const url = `${this.config.baseUrl}/api/models`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ConvexError(`HuggingFace user models error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.models || result;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get user models: ${error}`);
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getUserModels();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Prepare training data for Hugging Face format
   */
  static prepareTrainingData(rawData: any[]): any[] {
    return rawData.map(item => ({
      text: item.text || item.input,
      label: item.label || item.output,
      metadata: item.metadata || {},
    }));
  }

  /**
   * Calculate model training cost estimate
   */
  static estimateTrainingCost(dataSize: number, epochs: number): number {
    // Rough estimate based on compute hours
    const baseHourlyRate = 0.5; // $0.50 per hour
    const estimatedHours = Math.max(1, Math.ceil((dataSize * epochs) / 10000));
    return estimatedHours * baseHourlyRate;
  }
}

/**
 * Factory function to create Hugging Face service instance
 */
export function createHuggingFaceService(): HuggingFaceService {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const baseUrl = process.env.HUGGINGFACE_BASE_URL || 'https://huggingface.co';

  if (!apiKey) {
    throw new ConvexError('HUGGINGFACE_API_KEY environment variable is required');
  }

  return new HuggingFaceService({
    apiKey,
    baseUrl,
  });
}