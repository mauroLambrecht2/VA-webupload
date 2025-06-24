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

const MAX_SIZE_MB = 500; // 500MB max file size for direct-to-blob

class AzureUploadService {
  private backendUrl: string;
  private uploadQueue: Array<() => Promise<void>> = [];
  private activeUploads = 0;
  private maxConcurrentUploads = 2; // Limit concurrent uploads to prevent connection issues

  constructor() {
    this.backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';
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

  async getUserQuotaStats(): Promise<any> {
    const response = await fetch(`${this.backendUrl}/api/user-quota-stats`, {
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
    // Enforce 500MB max file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`File size exceeds ${MAX_SIZE_MB}MB limit. Please upload a smaller file.`);
    }
    // For large files, queue the upload to prevent overwhelming connections
    if (file.size > 200 * 1024 * 1024) {
      return new Promise((resolve, reject) => {
        const uploadTask = async () => {
          try {
            const result = await this.performDirectBlobUpload(file, onProgress);
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
      return this.performDirectBlobUpload(file, onProgress);
    }
  }

  private async performDirectBlobUpload(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;
    try {
      // Notify preparing status
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
      // Get SAS URL from backend
      const sasRes = await fetch(`${this.backendUrl}/api/generate-sas-url`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, filesize: file.size })
      });
      if (!sasRes.ok) {
        const errorData = await sasRes.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get upload URL: ${errorData.error || sasRes.status}`);
      }
      const { sasUrl, blobName } = await sasRes.json();
      // Upload file directly to Azure Blob Storage
      return await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', sasUrl, true);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        xhr.upload.onprogress = (event) => {
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
        };
        xhr.onload = () => {
          if (xhr.status === 201) {
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
            // Optionally: notify backend to store metadata
            resolve({
              success: true,
              videoId: blobName,
              shareLink: '', // You can generate a share link based on blobName
              downloadUrl: sasUrl.split('?')[0],
              size: file.size,
              filename: file.name,
              metadata: {
                videoId: blobName,
                blobName,
                blobUrl: sasUrl.split('?')[0],
                size: file.size,
                originalName: file.name
              }
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed: Network error'));
        xhr.ontimeout = () => reject(new Error('Upload failed: Timeout'));
        xhr.onabort = () => reject(new Error('Upload failed: Upload was cancelled'));
        xhr.send(file);
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
}

export default new AzureUploadService();
