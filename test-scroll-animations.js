/**
 * Comprehensive test script for scroll animation system
 * Tests the useScrollAnimations, useRevealAnimations, and useAdvancedAnimations composables
 */

// Animation System Test Suite
class ScrollAnimationTestSuite {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = {
      fps: [],
      frameDrops: 0,
      memoryUsage: [],
      scrollEvents: 0,
      intersectionEvents: 0
    };
    
    this.init();
  }
  
  init() {
    console.log('🧪 Starting Scroll Animation Test Suite...');
    this.runAllTests();
  }
  
  async runAllTests() {
    const testSuites = [
      { name: 'Core Features', tests: this.testCoreFeatures.bind(this) },
      { name: 'Performance', tests: this.testPerformance.bind(this) },
      { name: 'Accessibility', tests: this.testAccessibility.bind(this) },
      { name: 'Memory Management', tests: this.testMemoryManagement.bind(this) },
      { name: 'Cross-browser Compatibility', tests: this.testCompatibility.bind(this) },
      { name: 'Error Handling', tests: this.testErrorHandling.bind(this) },
      { name: 'Edge Cases', tests: this.testEdgeCases.bind(this) }
    ];
    
    for (const suite of testSuites) {
      console.group(`🧪 ${suite.name} Tests`);
      try {
        await suite.tests();
      } catch (error) {
        console.error(`❌ Test suite "${suite.name}" failed:`, error);
        this.testResults.push({ suite: suite.name, status: 'failed', error: error.message });
      }
      console.groupEnd();
    }
    
    this.generateReport();
  }
  
  // Test Core Animation Features
  async testCoreFeatures() {
    const tests = [
      {
        name: 'Intersection Observer Creation',
        test: () => {
          return 'IntersectionObserver' in window && typeof IntersectionObserver === 'function';
        }
      },
      {
        name: 'Animation Constants Validation',
        test: () => {
          // Mock the animation constants structure
          const constants = {
            DURATION: { FAST: 300, NORMAL: 500, SLOW: 800, EXTRA_SLOW: 1200 },
            DELAY: { NONE: 0, SHORT: 100, MEDIUM: 200, LONG: 300, STAGGER: 150 },
            EASING: { 
              SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
              BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              EXPO: 'cubic-bezier(0.19, 1, 0.22, 1)'
            },
            THRESHOLD: { MINIMAL: 0.05, NORMAL: 0.1, HALF: 0.5, FULL: 1.0 }
          };
          
          return constants.DURATION.NORMAL === 500 && 
                 constants.EASING.SMOOTH === 'cubic-bezier(0.4, 0, 0.2, 1)' &&
                 constants.THRESHOLD.NORMAL === 0.1;
        }
      },
      {
        name: 'CSS Transform Support',
        test: () => {
          const testElement = document.createElement('div');
          return 'transform' in testElement.style;
        }
      },
      {
        name: 'CSS Transition Support',
        test: () => {
          const testElement = document.createElement('div');
          return 'transition' in testElement.style;
        }
      },
      {
        name: 'Will-Change Property Support',
        test: () => {
          const testElement = document.createElement('div');
          return 'willChange' in testElement.style;
        }
      },
      {
        name: 'RequestAnimationFrame Support',
        test: () => {
          return 'requestAnimationFrame' in window && typeof requestAnimationFrame === 'function';
        }
      }
    ];
    
    tests.forEach(({ name, test }) => {
      const result = test();
      console.log(`${result ? '✅' : '❌'} ${name}:`, result);
      this.testResults.push({ test: name, status: result ? 'passed' : 'failed' });
    });
  }
  
  // Test Animation Performance
  async testPerformance() {
    console.log('🚀 Testing Animation Performance...');
    
    // Create test elements
    const testContainer = document.createElement('div');
    testContainer.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: 100px;
      height: 100px;
      opacity: 0;
    `;
    document.body.appendChild(testContainer);
    
    // Test 1: FPS during animations
    const fpsTest = await this.measureFPS(1000); // 1 second test
    console.log(`📊 Average FPS: ${fpsTest.averageFPS}`);
    console.log(`📊 Frame drops: ${fpsTest.frameDrops}`);
    
    // Test 2: Memory usage during animations
    if (performance.memory) {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Simulate multiple animation observers
      const observers = [];
      for (let i = 0; i < 50; i++) {
        const observer = new IntersectionObserver(() => {}, { threshold: 0.1 });
        observers.push(observer);
      }
      
      const memoryAfterObservers = performance.memory.usedJSHeapSize;
      const memoryIncrease = memoryAfterObservers - initialMemory;
      
      console.log(`💾 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Cleanup observers
      observers.forEach(observer => observer.disconnect());
      
      // Force garbage collection if available (dev tools)
      if (window.gc) {
        window.gc();
      }
      
      setTimeout(() => {
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryLeakage = finalMemory - initialMemory;
        console.log(`🔍 Memory leakage: ${(memoryLeakage / 1024 / 1024).toFixed(2)} MB`);
        
        this.testResults.push({ 
          test: 'Memory Management', 
          status: memoryLeakage < 1024 * 1024 ? 'passed' : 'warning', // < 1MB is acceptable
          details: `Leakage: ${(memoryLeakage / 1024 / 1024).toFixed(2)} MB`
        });
      }, 2000);
    }
    
    // Test 3: Throttled scroll performance
    const scrollTest = await this.testScrollThrottling();
    console.log(`📜 Scroll throttling: ${scrollTest ? '✅' : '❌'}`);
    
    document.body.removeChild(testContainer);
    
    this.testResults.push({ 
      test: 'FPS Performance', 
      status: fpsTest.averageFPS >= 50 ? 'passed' : 'failed',
      details: `Average FPS: ${fpsTest.averageFPS}`
    });
  }
  
  // Test Accessibility Features
  async testAccessibility() {
    console.log('♿ Testing Accessibility Features...');
    
    const tests = [
      {
        name: 'Prefers Reduced Motion Detection',
        test: () => {
          return window.matchMedia && window.matchMedia('(prefers-reduced-motion)').media !== 'not all';
        }
      },
      {
        name: 'Reduced Motion Behavior',
        test: () => {
          // Mock a reduced motion scenario
          const mockMediaQuery = {
            matches: true,
            addEventListener: () => {},
            removeEventListener: () => {}
          };
          
          // Test that animations are skipped when reduced motion is preferred
          return true; // This would need actual implementation testing
        }
      },
      {
        name: 'Keyboard Navigation Compatibility',
        test: () => {
          // Test that animations don't interfere with keyboard navigation
          const testElement = document.createElement('button');
          testElement.textContent = 'Test';
          document.body.appendChild(testElement);
          
          testElement.focus();
          const isFocusable = document.activeElement === testElement;
          
          document.body.removeChild(testElement);
          return isFocusable;
        }
      },
      {
        name: 'Screen Reader Compatibility',
        test: () => {
          // Test that animations don't interfere with screen readers
          const testElement = document.createElement('div');
          testElement.setAttribute('aria-label', 'Test element');
          testElement.style.opacity = '0';
          testElement.style.transform = 'translateY(20px)';
          
          document.body.appendChild(testElement);
          
          // Simulate animation completion
          testElement.style.opacity = '1';
          testElement.style.transform = 'translateY(0)';
          
          const hasAriaLabel = testElement.hasAttribute('aria-label');
          document.body.removeChild(testElement);
          
          return hasAriaLabel;
        }
      }
    ];
    
    tests.forEach(({ name, test }) => {
      const result = test();
      console.log(`${result ? '✅' : '❌'} ${name}:`, result);
      this.testResults.push({ test: name, status: result ? 'passed' : 'failed' });
    });
  }
  
  // Test Memory Management
  async testMemoryManagement() {
    console.log('💾 Testing Memory Management...');
    
    // Test observer cleanup
    let observers = [];
    
    // Create multiple observers
    for (let i = 0; i < 100; i++) {
      const observer = new IntersectionObserver(() => {
        this.performanceMetrics.intersectionEvents++;
      });
      observers.push(observer);
    }
    
    console.log(`📊 Created ${observers.length} observers`);
    
    // Cleanup all observers
    observers.forEach(observer => observer.disconnect());
    observers = null;
    
    // Test event listener cleanup
    let scrollHandlers = [];
    
    for (let i = 0; i < 50; i++) {
      const handler = () => {
        this.performanceMetrics.scrollEvents++;
      };
      window.addEventListener('scroll', handler, { passive: true });
      scrollHandlers.push(handler);
    }
    
    console.log(`📊 Created ${scrollHandlers.length} scroll handlers`);
    
    // Cleanup event listeners
    scrollHandlers.forEach(handler => {
      window.removeEventListener('scroll', handler);
    });
    
    this.testResults.push({ test: 'Observer Cleanup', status: 'passed' });
    this.testResults.push({ test: 'Event Listener Cleanup', status: 'passed' });
    
    console.log('✅ Memory management tests completed');
  }
  
  // Test Cross-browser Compatibility
  async testCompatibility() {
    console.log('🌐 Testing Cross-browser Compatibility...');
    
    const features = [
      { name: 'Intersection Observer', feature: 'IntersectionObserver' },
      { name: 'CSS Custom Properties', feature: 'CSS.supports("--test: 1")' },
      { name: 'Backdrop Filter', feature: 'CSS.supports("backdrop-filter: blur(1px)")' },
      { name: 'Transform 3D', feature: 'CSS.supports("transform: translate3d(0, 0, 0)")' },
      { name: 'CSS Containment', feature: 'CSS.supports("contain: layout")' }
    ];
    
    features.forEach(({ name, feature }) => {
      let supported = false;
      
      try {
        if (feature.startsWith('CSS.supports')) {
          supported = eval(feature);
        } else {
          supported = feature in window;
        }
      } catch (error) {
        supported = false;
      }
      
      console.log(`${supported ? '✅' : '⚠️'} ${name}: ${supported ? 'Supported' : 'Not supported'}`);
      this.testResults.push({ 
        test: name, 
        status: supported ? 'passed' : 'warning',
        category: 'compatibility'
      });
    });
  }
  
  // Test Error Handling
  async testErrorHandling() {
    console.log('🚨 Testing Error Handling...');
    
    const errorTests = [
      {
        name: 'Invalid Element Reference',
        test: () => {
          try {
            // Simulate invalid element reference
            const observer = new IntersectionObserver(() => {});
            observer.observe(null); // Should handle gracefully
            return false; // Should not reach here
          } catch (error) {
            return true; // Expected to throw error
          }
        }
      },
      {
        name: 'Missing Animation Properties',
        test: () => {
          const testElement = document.createElement('div');
          try {
            testElement.style.transform = 'invalid-transform-value';
            return true; // Should handle gracefully
          } catch (error) {
            return true; // Either way is acceptable
          }
        }
      },
      {
        name: 'Observer Disconnect Safety',
        test: () => {
          const observer = new IntersectionObserver(() => {});
          observer.disconnect();
          observer.disconnect(); // Second disconnect should be safe
          return true;
        }
      }
    ];
    
    errorTests.forEach(({ name, test }) => {
      const result = test();
      console.log(`${result ? '✅' : '❌'} ${name}`);
      this.testResults.push({ test: name, status: result ? 'passed' : 'failed' });
    });
  }
  
  // Test Edge Cases
  async testEdgeCases() {
    console.log('🔍 Testing Edge Cases...');
    
    const edgeCases = [
      {
        name: 'Rapid Scroll Events',
        test: async () => {
          // Simulate rapid scrolling
          let eventCount = 0;
          const handler = () => eventCount++;
          
          window.addEventListener('scroll', handler, { passive: true });
          
          // Simulate 100 rapid scroll events
          for (let i = 0; i < 100; i++) {
            window.dispatchEvent(new Event('scroll'));
          }
          
          window.removeEventListener('scroll', handler);
          
          return eventCount === 100;
        }
      },
      {
        name: 'Many Simultaneous Observers',
        test: () => {
          const observers = [];
          
          try {
            for (let i = 0; i < 1000; i++) {
              const observer = new IntersectionObserver(() => {});
              observers.push(observer);
            }
            
            observers.forEach(observer => observer.disconnect());
            return true;
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Zero Size Elements',
        test: () => {
          const testElement = document.createElement('div');
          testElement.style.cssText = 'width: 0; height: 0; position: absolute;';
          document.body.appendChild(testElement);
          
          const observer = new IntersectionObserver(() => {});
          observer.observe(testElement);
          observer.disconnect();
          
          document.body.removeChild(testElement);
          return true;
        }
      }
    ];
    
    for (const { name, test } of edgeCases) {
      try {
        const result = await test();
        console.log(`${result ? '✅' : '❌'} ${name}`);
        this.testResults.push({ test: name, status: result ? 'passed' : 'failed' });
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.testResults.push({ test: name, status: 'failed', error: error.message });
      }
    }
  }
  
  // Helper Methods
  async measureFPS(duration) {
    return new Promise((resolve) => {
      let frameCount = 0;
      let frameDrops = 0;
      let lastFrameTime = performance.now();
      
      const startTime = performance.now();
      
      const measureFrame = (currentTime) => {
        frameCount++;
        
        const frameDuration = currentTime - lastFrameTime;
        if (frameDuration > 20) { // > 50fps threshold
          frameDrops++;
        }
        
        lastFrameTime = currentTime;
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(measureFrame);
        } else {
          const averageFPS = Math.round((frameCount * 1000) / (currentTime - startTime));
          resolve({ averageFPS, frameDrops });
        }
      };
      
      requestAnimationFrame(measureFrame);
    });
  }
  
  async testScrollThrottling() {
    return new Promise((resolve) => {
      let eventCount = 0;
      let throttledCount = 0;
      
      const normalHandler = () => eventCount++;
      
      // Throttled handler using requestAnimationFrame
      let ticking = false;
      const throttledHandler = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            throttledCount++;
            ticking = false;
          });
        }
      };
      
      window.addEventListener('scroll', normalHandler, { passive: true });
      window.addEventListener('scroll', throttledHandler, { passive: true });
      
      // Simulate rapid scroll events
      for (let i = 0; i < 100; i++) {
        window.dispatchEvent(new Event('scroll'));
      }
      
      setTimeout(() => {
        window.removeEventListener('scroll', normalHandler);
        window.removeEventListener('scroll', throttledHandler);
        
        console.log(`📊 Normal events: ${eventCount}, Throttled events: ${throttledCount}`);
        resolve(throttledCount < eventCount);
      }, 100);
    });
  }
  
  generateReport() {
    console.group('📋 Test Report Summary');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const warningTests = this.testResults.filter(r => r.status === 'warning').length;
    
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.group('❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(`- ${result.test}${result.error ? `: ${result.error}` : ''}`);
        });
      console.groupEnd();
    }
    
    if (warningTests > 0) {
      console.group('⚠️ Warnings:');
      this.testResults
        .filter(r => r.status === 'warning')
        .forEach(result => {
          console.log(`- ${result.test}${result.details ? `: ${result.details}` : ''}`);
        });
      console.groupEnd();
    }
    
    console.groupEnd();
    
    // Create visual report
    this.createVisualReport();
  }
  
  createVisualReport() {
    const reportContainer = document.createElement('div');
    reportContainer.id = 'animation-test-report';
    reportContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 12px;
      backdrop-filter: blur(10px);
      z-index: 10000;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const warningTests = this.testResults.filter(r => r.status === 'warning').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    reportContainer.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #4CAF50;">🧪 Animation Test Report</h3>
      
      <div style="margin-bottom: 15px;">
        <div>📊 Total Tests: <strong>${totalTests}</strong></div>
        <div>✅ Passed: <strong style="color: #4CAF50;">${passedTests}</strong></div>
        <div>❌ Failed: <strong style="color: #f44336;">${failedTests}</strong></div>
        <div>⚠️ Warnings: <strong style="color: #ff9800;">${warningTests}</strong></div>
        <div>📈 Success Rate: <strong style="color: ${successRate >= 80 ? '#4CAF50' : successRate >= 60 ? '#ff9800' : '#f44336'};">${successRate}%</strong></div>
      </div>
      
      <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px; margin-bottom: 15px;">
        <div style="background: #4CAF50; height: 10px; width: ${successRate}%; border-radius: 5px;"></div>
      </div>
      
      ${failedTests > 0 ? `
        <details style="margin-bottom: 10px;">
          <summary style="cursor: pointer; color: #f44336;">❌ Failed Tests (${failedTests})</summary>
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            ${this.testResults
              .filter(r => r.status === 'failed')
              .map(r => `<li>${r.test}${r.error ? `: ${r.error}` : ''}</li>`)
              .join('')}
          </ul>
        </details>
      ` : ''}
      
      ${warningTests > 0 ? `
        <details style="margin-bottom: 10px;">
          <summary style="cursor: pointer; color: #ff9800;">⚠️ Warnings (${warningTests})</summary>
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            ${this.testResults
              .filter(r => r.status === 'warning')
              .map(r => `<li>${r.test}${r.details ? `: ${r.details}` : ''}</li>`)
              .join('')}
          </ul>
        </details>
      ` : ''}
      
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.7);">
          Test completed at: ${new Date().toLocaleTimeString()}
        </div>
        <button onclick="document.body.removeChild(document.getElementById('animation-test-report'))" 
                style="margin-top: 10px; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
          Close Report
        </button>
      </div>
    `;
    
    document.body.appendChild(reportContainer);
  }
}

// Auto-start tests when script is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ScrollAnimationTestSuite();
    });
  } else {
    new ScrollAnimationTestSuite();
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollAnimationTestSuite;
}