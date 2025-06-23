// Frontend: Direct Azure Blob Upload Service
import { BlobServiceClient, BlockBlobClient, AnonymousCredential } from '@azure/storage-blob';

interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

class DirectAzureUploadService {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://villainarc-clipupload-func.azurewebsites.net'
    : 'http://localhost:8000';
  // Get SAS token from your server for secure upload
  async getSASToken(filename: string, filesize: number): Promise<{sasUrl: string, uploadId: string}> {
    const response = await fetch(`${this.baseUrl}/api/upload/sas-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, filesize })
    });
    
    if (!response.ok) throw new Error('Failed to get upload token');
    const { sasUrl, uploadId } = await response.json();
    return { sasUrl, uploadId };
  }

  // Upload directly to Azure with maximum performance
  async uploadFile(
    file: File, 
    onProgress: (progress: UploadProgress) => void
  ): Promise<string> {
    const startTime = Date.now();
    let lastTime = startTime;
    let lastBytes = 0;

    try {
      // Get secure upload URL
      const { sasUrl, uploadId } = await this.getSASToken(file.name, file.size);
      
      // Create blob client with SAS URL
      const blockBlobClient = new BlockBlobClient(sasUrl, new AnonymousCredential());
      
      // Ultra-fast upload configuration
      const uploadOptions = {
        // Massive chunks for speed (64MB)
        blockSize: 64 * 1024 * 1024,
        // Maximum concurrency (16 parallel connections)
        concurrency: 16,
        // Progress tracking
        onProgress: (progressEvent: any) => {
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastTime) / 1000;
          const bytesDiff = progressEvent.loadedBytes - lastBytes;
          
          // Calculate real-time speed
          const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
          const remainingBytes = file.size - progressEvent.loadedBytes;
          const eta = speed > 0 ? remainingBytes / speed : 0;
          const progress = (progressEvent.loadedBytes / file.size) * 100;
          
          onProgress({
            uploadId,
            filename: file.name,
            progress: Math.round(progress),
            speed,
            eta,
            status: progress >= 99 ? 'processing' : 'uploading'
          });
          
          lastTime = currentTime;
          lastBytes = progressEvent.loadedBytes;
        }
      };

      // Execute ultra-fast upload
      await blockBlobClient.uploadData(file, uploadOptions);
      
      // Notify server of completion
      await this.notifyUploadComplete(uploadId, {
        filename: file.name,
        size: file.size,
        uploadTime: Date.now() - startTime
      });

      onProgress({
        uploadId,
        filename: file.name,
        progress: 100,
        speed: 0,
        eta: 0,
        status: 'completed'
      });

      return uploadId;

    } catch (error) {
      onProgress({
        uploadId: 'error',
        filename: file.name,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'error'
      });
      throw error;
    }
  }

  // Upload multiple files with intelligent concurrency
  async uploadMultipleFiles(
    files: File[],
    onProgress: (uploadId: string, progress: UploadProgress) => void
  ): Promise<string[]> {
    // Smart concurrency: 2-3 large uploads or 4-6 small uploads
    const maxConcurrent = files.some(f => f.size > 100 * 1024 * 1024) ? 2 : 4;
    
    const uploadPromises = files.map((file, index) => 
      this.uploadWithQueue(file, index, maxConcurrent, onProgress)
    );

    return Promise.all(uploadPromises);
  }

  private async uploadWithQueue(
    file: File, 
    index: number, 
    maxConcurrent: number,
    onProgress: (uploadId: string, progress: UploadProgress) => void
  ): Promise<string> {
    // Simple queue implementation
    await this.waitForSlot(index, maxConcurrent);
    
    return this.uploadFile(file, (progress) => {
      onProgress(`upload-${index}`, progress);
    });
  }

  private async waitForSlot(index: number, maxConcurrent: number): Promise<void> {
    const delay = Math.floor(index / maxConcurrent) * 100; // Stagger uploads
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private async notifyUploadComplete(uploadId: string, metadata: any): Promise<void> {
    await fetch(`${this.baseUrl}/api/upload/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, metadata })
    });
  }
}

export default new DirectAzureUploadService();
