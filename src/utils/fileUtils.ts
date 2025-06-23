// File utility functions for better file handling and validation

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    duration?: number;
    resolution?: string;
    bitrate?: number;
    codec?: string;
  };
}

export const SUPPORTED_FORMATS = {
  'video/mp4': { extension: '.mp4', name: 'MP4', browserSupport: 'excellent' },
  'video/webm': { extension: '.webm', name: 'WebM', browserSupport: 'excellent' },
  'video/ogg': { extension: '.ogg', name: 'OGG', browserSupport: 'good' },
  'video/quicktime': { extension: '.mov', name: 'MOV', browserSupport: 'good' },
  'video/x-msvideo': { extension: '.avi', name: 'AVI', browserSupport: 'limited' },
  'video/x-flv': { extension: '.flv', name: 'FLV', browserSupport: 'limited' },
  'video/x-ms-wmv': { extension: '.wmv', name: 'WMV', browserSupport: 'limited' },
  'video/x-matroska': { extension: '.mkv', name: 'MKV', browserSupport: 'limited' }
};

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
export const RECOMMENDED_MAX_SIZE = 500 * 1024 * 1024; // 500MB for better performance

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    isValid: true,
    warnings: []
  };

  // Check file type
  if (!Object.keys(SUPPORTED_FORMATS).includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Please use MP4, WebM, MOV, AVI, FLV, WMV, or MKV.`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large: ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Warning for large files
  if (file.size > RECOMMENDED_MAX_SIZE) {
    result.warnings?.push(`Large file detected (${formatFileSize(file.size)}). Upload may take longer.`);
  }

  // Browser compatibility warnings
  const format = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
  if (format.browserSupport === 'limited') {
    result.warnings?.push(`${format.name} files may have limited browser compatibility. Consider converting to MP4 for best results.`);
  }

  // Try to get video metadata
  try {
    const metadata = await getVideoMetadata(file);
    result.metadata = metadata;
    
    // Add duration warning for very long videos
    if (metadata.duration && metadata.duration > 1800) { // 30 minutes
      result.warnings?.push('Very long video detected. Consider trimming for better sharing experience.');
    }
  } catch (error) {
    console.warn('Could not extract video metadata:', error);
  }

  return result;
}

export function getVideoMetadata(file: File): Promise<{
  duration?: number;
  resolution?: string;
  bitrate?: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: video.duration,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        bitrate: Math.round((file.size * 8) / video.duration) // Rough estimate
      };
      
      URL.revokeObjectURL(url);
      resolve(metadata);
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load video metadata'));
    });
    
    video.src = url;
  });
}

export function generateVideoThumbnail(file: File, timeOffset: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = Math.min(timeOffset, video.duration / 2);
    });
    
    video.addEventListener('seeked', () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(url);
        resolve(thumbnail);
      } else {
        reject(new Error('Could not create canvas context'));
      }
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load video for thumbnail'));
    });
    
    video.src = url;
  });
}
