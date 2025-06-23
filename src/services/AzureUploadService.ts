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

class AzureUploadService {
  private azureFunctionUrl: string;
  
  constructor() {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://villainarc-clipupload-func.azurewebsites.net'
      : 'http://localhost:7071';
    
    this.azureFunctionUrl = `${baseUrl}/api/upload`;
  }
  // Get upload token from backend session (existing auth flow)
  async getUploadToken(): Promise<string> {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';

    console.log('🔑 Requesting upload token from:', `${backendUrl}/api/get-azure-upload-token`);

    const response = await fetch(`${backendUrl}/api/get-azure-upload-token`, {
      method: 'POST',
      credentials: 'include', // Use existing session cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('🔑 Token response status:', response.status);
    console.log('🔑 Token response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('🔑 Token request failed:', errorData);
      throw new Error(`Failed to get upload token: ${errorData.error || response.status}`);
    }

    const data = await response.json();
    console.log('🔑 Token received successfully for user:', data.user?.username);
    return data.uploadToken;
  }

  // Upload file with progress callback that matches existing interface
  async uploadFile(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastBytesUploaded = 0;    try {
      // Get authorization token using existing backend session
      console.log('🚀 Starting Azure upload for:', file.name, '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)');
      
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

      console.log('🔑 Getting upload token from backend...');
      const uploadToken = await this.getUploadToken();      // Convert file to base64 for Azure Function
      console.log('📁 Converting file to base64...');
      const fileBuffer = await this.fileToArrayBuffer(file);
      const base64Data = this.arrayBufferToBase64(fileBuffer);
      console.log('📁 File converted, base64 length:', base64Data.length);

      console.log('☁️ Uploading to Azure Function:', this.azureFunctionUrl);

      // Create XMLHttpRequest for progress tracking (matches existing UI expectations)
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
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
        });        xhr.onload = async () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            
            // Store metadata in backend for video view page
            if (response.metadata) {
              try {
                console.log('📋 Storing metadata in backend...');
                await this.storeVideoMetadata(response.metadata, uploadToken);
                console.log('✅ Metadata stored successfully');
              } catch (metadataError) {
                console.error('❌ Failed to store metadata:', metadataError);
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
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(`Upload failed: ${errorResponse.error || xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('POST', this.azureFunctionUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('x-filename', file.name);
        xhr.setRequestHeader('x-filesize', file.size.toString());
        
        xhr.send(base64Data);
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
  // Store video metadata in backend after Azure upload (fallback)
  async storeVideoMetadata(metadata: any, uploadToken: string): Promise<void> {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://va-expressupload.onrender.com'
      : 'http://localhost:8000';

    console.log('🔄 Storing video metadata in backend as fallback...');

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

    console.log('✅ Video metadata stored in backend successfully');
  }

  // Helper methods
  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default new AzureUploadService();
