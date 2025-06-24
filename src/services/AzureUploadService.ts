// Azure Functions Upload Service - Integrates with existing ClipUploader UI
export interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  speed: number;
  eta: number;
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  bytesUploaded: number;
  totalBytes: number;
}

export interface UploadResult {
  success: boolean;
  videoId: string;
  shareLink: string;
  downloadUrl: string;
  size: number;
  filename: string;
  metadata?: {
    videoId: string;
    blobName: string;
    blobUrl: string;
    size: number;
    originalName: string;
  };
}

const MAX_SIZE_MB = 300; // 300MB max file size

class AzureUploadService {
  private azureFunctionUrl: string;
  private uploadQueue: Array<() => Promise<void>> = [];
  private activeUploads = 0;
  private maxConcurrentUploads = 2; // Limit concurrent uploads to prevent connection issues

  constructor() {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://villainarc-clipupload-func.azurewebsites.net'
      : 'http://localhost:7071';
    this.azureFunctionUrl = `${baseUrl}/api/upload`;
  }

  private async processUploadQueue(): Promise<void> {
    if (this.activeUploads >= this.maxConcurrentUploads || this.uploadQueue.length === 0) {
      return;
    }
    const uploadTask = this.uploadQueue.shift();
    if (uploadTask) {
      this.activeUploads++;
      try {
        await uploadTask();
      } finally {
        this.activeUploads--;
        this.processUploadQueue();
      }
    }
  }

  async getUploadToken(): Promise<{token: string, userStats: any}> {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/get-azure-upload-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get upload token: ${errorData.error || response.status}`);
    }
    const data = await response.json();
    return { token: data.uploadToken, userStats: data.user };
  }

  async getUserQuotaStats(): Promise<any> {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/user-quota-stats`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get quota stats: ${errorData.error || response.status}`);
    }
    const data = await response.json();
    return data.stats;
  }

  async uploadFile(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Enforce 300MB max file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`File size exceeds ${MAX_SIZE_MB}MB limit. Please upload a smaller file.`);
    }
    // For large files, queue the upload to prevent overwhelming connections
    if (file.size > 200 * 1024 * 1024) {
      return new Promise((resolve, reject) => {
        const uploadTask = async () => {
          try {
            const result = await this.performUpload(file, onProgress);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        this.uploadQueue.push(uploadTask);
        this.processUploadQueue();
      });
    } else {
      // Small files can upload immediately
      return this.performUpload(file, onProgress);
    }
  }

  private async performUpload(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;
    try {
      // Get authorization token using existing backend session
      onProgress({
        uploadId,
        filename: file.name,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'preparing',
        bytesUploaded: 0,
        totalBytes: file.size
      });
      const tokenData = await this.getUploadToken();
      const uploadToken = tokenData.token;
      const userStats = tokenData.userStats;
      // Check if user has enough quota before starting upload
      if (file.size > userStats.remainingQuota) {
        throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds remaining quota (${(userStats.remainingQuota / 1024 / 1024).toFixed(1)} MB)`);
      }
      return await new Promise<UploadResult>((resolve, reject) => {
        let retryCount = 0;
        const maxRetries = file.size > 200 * 1024 * 1024 ? 3 : 1;
        const attemptUpload = () => {
          const xhr = new XMLHttpRequest();
          xhr.timeout = 20 * 60 * 1000;
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const currentTime = Date.now();
              const timeDiff = (currentTime - lastProgressTime) / 1000;
              const bytesDiff = event.loaded - lastBytesUploaded;
              const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
              const remainingBytes = event.total - event.loaded;
              const eta = speed > 0 ? remainingBytes / speed : 0;
              const progress = (event.loaded / event.total) * 100;
              onProgress({
                uploadId,
                filename: file.name,
                progress: Math.round(progress),
                speed,
                eta,
                status: progress >= 99 ? 'processing' : 'uploading',
                bytesUploaded: event.loaded,
                totalBytes: event.total
              });
              lastProgressTime = currentTime;
              lastBytesUploaded = event.loaded;
            }
          });
          xhr.onload = async () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              if (response.metadata) {
                try {
                  await this.storeVideoMetadata(response.metadata, uploadToken);
                } catch (metadataError) {
                  // Don't fail the upload if metadata storage fails
                }
              }
              onProgress({
                uploadId,
                filename: file.name,
                progress: 100,
                speed: 0,
                eta: 0,
                status: 'completed',
                bytesUploaded: file.size,
                totalBytes: file.size
              });
              resolve({
                success: true,
                videoId: response.videoId,
                shareLink: response.shareLink,
                downloadUrl: response.downloadUrl,
                size: file.size,
                filename: file.name
              });
            } else {
              const errorResponse = JSON.parse(xhr.responseText || '{}');
              if (retryCount < maxRetries && (xhr.status === 0 || xhr.status >= 500)) {
                retryCount++;
                const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
                setTimeout(attemptUpload, waitTime);
              } else {
                reject(new Error(`Upload failed: ${errorResponse.error || xhr.status}`));
              }
            }
          };
          xhr.onerror = () => {
            if (retryCount < maxRetries) {
              retryCount++;
              const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              setTimeout(attemptUpload, waitTime);
            } else {
              reject(new Error('Upload failed: Network error (possible CORS issue)'));
            }
          };
          xhr.ontimeout = () => {
            if (retryCount < maxRetries) {
              retryCount++;
              const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              setTimeout(attemptUpload, waitTime);
            } else {
              reject(new Error('Upload failed: Timeout (file too large or connection too slow)'));
            }
          };
          xhr.onabort = () => {
            reject(new Error('Upload failed: Upload was cancelled'));
          };
          xhr.open('POST', this.azureFunctionUrl, true);
          xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');
          xhr.setRequestHeader('x-filename', file.name);
          xhr.setRequestHeader('x-filesize', file.size.toString());
          xhr.send(file);
        };
        attemptUpload();
      });
    } catch (error) {
      onProgress({
        uploadId,
        filename: file.name,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'error',
        bytesUploaded: 0,
        totalBytes: file.size
      });
      throw error;
    }
  }

  async storeVideoMetadata(metadata: any, uploadToken: string): Promise<void> {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/store-video-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${uploadToken}`
      },
      body: JSON.stringify(metadata)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to store metadata: ${errorData.error || response.status}`);
    }
  }
}

export default new AzureUploadService();
