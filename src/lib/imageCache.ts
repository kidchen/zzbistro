import { getImageSignedUrl } from './imageUpload';

interface CachedImage {
  signedUrl: string;
  imagePath: string;
  cachedAt: number;
}

const cache = new Map<string, CachedImage>();
const CACHE_DURATION = 20 * 60 * 60 * 1000; // 20 hours (refresh before 24h expiry)
const LOCAL_STORAGE_KEY = 'zzbistro_image_cache';
let cacheLoaded = false;

// Load cache from localStorage on initialization
const loadCacheFromStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Load asynchronously to avoid blocking startup
  setTimeout(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          cache.set(key, value as CachedImage);
        });
      }
    } catch (error) {
      console.error('Failed to load image cache from localStorage:', error);
    }
  }, 0);
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(cache.entries());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save image cache to localStorage:', error);
  }
};

// Initialize cache from localStorage
// Don't call this on module load - let it be lazy
const ensureCacheLoaded = () => {
  if (cacheLoaded || typeof window === 'undefined') return;
  cacheLoaded = true;
  loadCacheFromStorage();
};

export const getCachedImageUrl = async (imagePath: string): Promise<string> => {
  if (!imagePath) return '';
  
  // Lazy load cache on first use
  ensureCacheLoaded();
  
  const cached = cache.get(imagePath);
  
  // Return cached if still valid (20 hours)
  if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
    return cached.signedUrl;
  }
  
  // Get fresh signed URL with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const signedUrl = await getImageSignedUrl(imagePath, controller.signal);
    clearTimeout(timeoutId);
    
    if (signedUrl) {
      const cacheEntry = {
        signedUrl,
        imagePath,
        cachedAt: Date.now()
      };
      
      cache.set(imagePath, cacheEntry);
      // Save to localStorage asynchronously
      setTimeout(() => saveCacheToStorage(), 0);
      return signedUrl;
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Failed to get signed URL:', error);
    }
  }
  
  return '';
};

// Clear expired cache entries
export const cleanImageCache = () => {
  const now = Date.now();
  let hasChanges = false;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.cachedAt > CACHE_DURATION) {
      cache.delete(key);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    saveCacheToStorage();
  }
};

// Clear all cache (useful for debugging or when switching storage methods)
export const clearAllImageCache = () => {
  cache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};

// Clear specific image from cache (useful when image is updated)
export const clearImageFromCache = (imagePath: string) => {
  cache.delete(imagePath);
  saveCacheToStorage();
};

// Preload image URL into cache
export const preloadImageUrl = async (imagePath: string): Promise<void> => {
  await getCachedImageUrl(imagePath);
};
