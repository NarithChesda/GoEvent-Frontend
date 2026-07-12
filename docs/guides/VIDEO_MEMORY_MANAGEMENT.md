# Video Memory Management System

## Overview

This document describes the comprehensive video memory management system implemented to fix progressive memory leaks on mobile devices in the event showcase system.

## Problem Analysis

### Original Issues
1. **Blob URL Accumulation**: Videos created blob URLs that weren't properly cleaned up
2. **Video Element Lifecycle**: Multiple video elements created without proper disposal
3. **Event Listener Leaks**: Incomplete cleanup of event listeners
4. **Mobile Browser Constraints**: No proper handling of mobile-specific video limitations
5. **Stage Transition Memory**: Videos persisted across stage transitions without cleanup

### Mobile-Specific Challenges
- Limited memory on mobile devices (typically 2-4GB)
- Aggressive garbage collection by mobile browsers
- Different video handling behavior between desktop and mobile
- Network constraints affecting video loading strategies

## Solution Architecture

### 1. Enhanced Video Resource Manager (`useVideoResourceManager.ts`)

#### Key Features:
- **Mobile Detection**: Automatic detection of mobile devices and low-memory scenarios
- **Resource Limits**: Different video limits for mobile (5) vs desktop (10)
- **Blob URL Tracking**: Comprehensive tracking and cleanup of blob URLs
- **Event Listener Management**: AbortController-based cleanup with WeakMap storage
- **Memory Pressure Detection**: Automatic cleanup triggers based on resource usage

#### Mobile Optimizations:
```typescript
// Mobile-specific configuration
const maxVideos = isMobile ? VIDEO_CONFIG.MOBILE_MAX_VIDEOS : VIDEO_CONFIG.MAX_MANAGED_VIDEOS
const cleanupTimeout = isMobile ? VIDEO_CONFIG.MOBILE_CLEANUP_TIMEOUT : VIDEO_CONFIG.MAX_CLEANUP_TIME
```

### 2. Enhanced Stage Manager (`useShowcaseStages.ts`)

#### Improvements:
- **Async Cleanup**: Proper async/await cleanup patterns
- **Audio Resource Management**: Blob URL cleanup for audio files
- **Integration with Video Manager**: Uses enhanced video resource manager

### 3. Cover Stage Video Composable (`useCoverStageVideo.ts`)

#### Key Changes:
- **Mobile-Aware Video Loading**: Different preload strategies for mobile
- **Resource Registration**: All video elements registered with resource manager
- **Enhanced Error Handling**: Mobile-specific error handling for video playback
- **Timeout Management**: Shorter timeouts for mobile devices

### 4. Main Showcase View (`EventShowcaseRefactored.vue`)

#### Mobile Memory Management:
- **Periodic Cleanup**: Automatic cleanup every 2 minutes on mobile
- **Resource Monitoring**: Logs memory stats for debugging
- **Cleanup Timer**: Proper timer cleanup on component unmount

## Usage Guidelines

### For Developers

#### 1. Video Element Creation
Always use the resource manager for video creation:
```typescript
const video = videoResourceManager.createManagedVideo(src, 'unique-identifier')
```

#### 2. Event Listener Registration
Use the managed event listener system:
```typescript
videoResourceManager.addVideoEventListener(video, 'loadeddata', handler)
```

#### 3. Manual Cleanup
Force cleanup when needed:
```typescript
await videoResourceManager.cleanupVideo(videoElement)
```

#### 4. Blob URL Management
Register blob URLs for tracking:
```typescript
videoResourceManager.registerBlobUrl(originalUrl, blobUrl, videoElement)
```

### For Testing

#### Memory Testing Utilities
Use the provided testing utilities:
```typescript
import { videoMemoryTester, testVideoCleanup } from '@/utils/videoMemoryTest'

// Test video cleanup
await testVideoCleanup(videoResourceManager)

// Generate detailed report
console.log(videoMemoryTester.generateReport())
```

#### Mobile Testing Checklist
1. Test on actual mobile devices (not just browser dev tools)
2. Monitor memory usage using Chrome DevTools
3. Test video transitions multiple times
4. Verify blob URL cleanup
5. Check for DOM element accumulation

## Performance Monitoring

### Memory Stats API
```typescript
const stats = videoResourceManager.getMemoryStats()
console.log('Memory Stats:', {
  managedVideos: stats.managedVideos,
  activeBlobUrls: stats.activeBlobUrls,
  pendingCleanups: stats.pendingCleanups,
  totalListeners: stats.totalListeners,
  isMobileDevice: stats.isMobileDevice,
  isLowMemoryDevice: stats.isLowMemoryDevice
})
```

### Development Logging
The system includes comprehensive logging (disabled in production):
- Video loading progress
- Memory cleanup operations
- Mobile-specific optimizations
- Error states and recovery

## Mobile-Specific Optimizations

### 1. Video Loading Strategy
- **Mobile**: Progressive loading with metadata preload
- **Low Memory**: Skip background videos, limit concurrent downloads
- **Desktop**: Full auto preload for smooth experience

### 2. Resource Limits
- **Mobile**: Maximum 5 concurrent videos
- **Desktop**: Maximum 10 concurrent videos
- **Low Memory**: Maximum 2 concurrent videos

### 3. Cleanup Timing
- **Mobile**: 3-second cleanup timeout
- **Desktop**: 5-second cleanup timeout
- **Mobile GC**: Trigger after every 3 video cleanups

### 4. Error Handling
- **Mobile**: More aggressive error recovery
- **Codec Issues**: Automatic fallback strategies
- **Network**: Adaptive loading based on connection

## Best Practices

### Do's ✅
- Always register video elements with the resource manager
- Use async/await for cleanup operations
- Monitor memory stats during development
- Test on real mobile devices
- Use the provided testing utilities

### Don'ts ❌
- Don't create video elements without registration
- Don't ignore cleanup promises
- Don't assume desktop behavior on mobile
- Don't skip mobile-specific testing
- Don't create blob URLs without tracking

## Troubleshooting

### Common Issues
1. **Videos not cleaning up**: Check if properly registered with resource manager
2. **Memory still increasing**: Verify blob URL cleanup and event listener removal
3. **Mobile performance**: Check if mobile optimizations are active
4. **Stage transitions**: Ensure proper async cleanup completion

### Debug Commands
```typescript
// Get current memory stats
console.log(videoResourceManager.getMemoryStats())

// Force cleanup
await videoResourceManager.cleanupAllVideos()

// Trigger garbage collection (development only)
videoResourceManager.triggerMemoryCleanup()
```

### Browser Dev Tools
1. **Memory Tab**: Monitor heap size and garbage collection
2. **Performance Tab**: Record timeline with memory tracking
3. **Application Tab**: Check for blob URL accumulation
4. **Console**: Monitor memory management logs

## Future Improvements

### Potential Enhancements
1. **WebAssembly Integration**: For more efficient video processing
2. **Service Worker Caching**: Intelligent video cache management
3. **Intersection Observer**: Cleanup videos when out of view
4. **Memory Pressure API**: Native browser memory pressure detection
5. **WebRTC Integration**: For lower-latency video delivery

### Monitoring Improvements
1. **Real User Monitoring**: Track memory usage in production
2. **Error Reporting**: Detailed mobile-specific error tracking
3. **Performance Metrics**: Video load time and memory impact correlation

## Conclusion

This comprehensive video memory management system addresses the progressive memory leaks that were affecting mobile devices. The system provides:

- ✅ **Comprehensive Resource Tracking**: All video elements and blob URLs tracked
- ✅ **Mobile-Specific Optimizations**: Tailored behavior for mobile devices
- ✅ **Proper Async Cleanup**: Non-blocking cleanup with proper error handling
- ✅ **Memory Pressure Management**: Automatic cleanup based on resource usage
- ✅ **Development Tools**: Testing utilities and debugging capabilities

The implementation maintains backward compatibility while significantly improving memory efficiency, particularly on mobile devices where memory constraints are most critical.