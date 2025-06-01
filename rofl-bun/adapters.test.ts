import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AkaveClient } from './adapters';

// Utility function for logging timestamps
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Set NODE_ENV to test for the special test mode handling
process.env.NODE_ENV = 'test';

// Configure global timeout for all tests (90 seconds)
process.env.BUN_TEST_TIMEOUT = "90000";

// Helper function for delays (helps with eventual consistency)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to generate unique resource names for each test
const generateUniqueName = (prefix: string) => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000000);
  return `${prefix}-${timestamp}-${randomSuffix}`;
};

// Test suite for Akave adapter - integration tests (run with an actual Akave instance)
describe('AkaveClient - Integration Tests', () => {
  // Using ! to tell TypeScript that client will be defined when used
  let client!: AkaveClient;
  
  // Helper function for logging with timestamps
  const log = (message: string) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };
  
  // Base prefix for all test resources to help with identification and cleanup
  const testPrefix = `test-${Date.now()}`;
  // We'll generate unique names per test to prevent conflicts
  let testBucketName: string;
  let testObjectKey: string;
  const testObjectContent = new TextEncoder().encode('Hello, Akave!');
  
  beforeEach(() => {
    // Skip if env vars not set
    const endpoint = process.env.AKAVE_ENDPOINT;
    const accessKey = process.env.AKAVE_ACCESS_KEY;
    const secretKey = process.env.AKAVE_SECRET_KEY;
    const region = process.env.AKAVE_REGION;
    
    if (!endpoint || !accessKey || !secretKey || !region) {
      console.log('Skipping integration tests: missing environment variables');
      return;
    }
    
    client = new AkaveClient(endpoint, accessKey, secretKey, region);
  });

  afterEach(async () => {
    log('🧹 Starting global cleanup in afterEach hook');
    // Skip cleanup if env vars not set
    if (!process.env.AKAVE_ENDPOINT || !process.env.AKAVE_ACCESS_KEY || !process.env.AKAVE_SECRET_KEY) {
      return;
    }
    
    // The per-test cleanup should have handled most resources, but as a safety net,
    // we could look for any lingering test buckets and clean them up
    // This is much lighter than before since each test is doing its own cleanup
    
    // try {
    //   // List all buckets and clean up any older test buckets that might be lingering
    //   log('🧹 Looking for lingering test buckets to clean up');
    //   const listing = await client.listBuckets();
    //   const testBuckets = listing.buckets.filter(bucket => 
    //     bucket.name.startsWith('test-') && 
    //     // Only clean up buckets older than 10 minutes
    //     (Date.now() - new Date(bucket.creationDate).getTime() > 10 * 60 * 1000)
    //   );
      
    //   if (testBuckets.length > 0) {
    //     log(`🧹 Found ${testBuckets.length} lingering test buckets to clean up`);
    //     for (const bucket of testBuckets) {
    //       try {
    //         log(`🧹 Cleaning up lingering bucket: ${bucket.name}`);
    //         await client.deleteBucket(bucket.name).catch(err => 
    //           log(`⚠️ Warning: Failed to delete lingering bucket ${bucket.name}: ${err instanceof Error ? err.message : String(err)}`))
    //       } catch (err) {
    //         log(`⚠️ Warning: Error cleaning up lingering bucket: ${err instanceof Error ? err.message : String(err)}`);
    //       }
    //     }
    //   } else {
    //     log('🧹 No lingering test buckets found');
    //   }
      
    //   log('🧹 Global cleanup completed');
    // } catch (err) {
    //   log(`⚠️ Warning: Global cleanup error: ${err instanceof Error ? err.message : String(err)}`);
    // }
  });

  // 1. Test listBuckets
  test('listBuckets should return a list of buckets', async () => {
    log('🥵 STARTING TEST: listBuckets');
    
    // No unique resources needed for this test
    
    // List buckets
    log('📋 Calling listBuckets...');
    const startTime = Date.now();
    const result = await client.listBuckets();
    log(`✅ listBuckets succeeded in ${Date.now() - startTime}ms`);
    
    // Validate result
    expect(result).toBeDefined();
    expect(Array.isArray(result.buckets)).toBe(true);
    expect(result.owner).toBeDefined();
    log(`📈 Result: ${result.buckets.length} buckets, owner ID: ${result.owner.id.substring(0, 8)}`);
  });

  // 2. Test createBucket
  test('createBucket should create a new bucket', async () => {
    log('🥵 STARTING TEST: createBucket');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-create-bucket`);
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Verify bucket exists
      log(`📋 Checking if bucket ${testBucketName} exists...`);
      const exists = await client.headBucket(testBucketName);
      expect(exists).toBe(true);
      log(`📈 Bucket exists: ${exists}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for createBucket test`);
      try {
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 3. Test headBucket
  test('headBucket should check if a bucket exists', async () => {
    log('🥵 STARTING TEST: headBucket');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-head-bucket`);
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Check if bucket exists
      log(`📋 Checking if bucket ${testBucketName} exists...`);
      const headStartTime = Date.now();
      const exists = await client.headBucket(testBucketName);
      log(`✅ headBucket completed in ${Date.now() - headStartTime}ms`);
      
      // Validate result
      expect(exists).toBe(true);
      log(`📈 Bucket exists: ${exists}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for headBucket test`);
      try {
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 4. Test putObject
  test('putObject should store an object in a bucket', async () => {
    log('🥵 STARTING TEST: putObject');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-put-object`);
    const testObjectKey = generateUniqueName('object') + '.txt';
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Put an object
      log(`📋 Putting object: ${testObjectKey} (${testObjectContent.byteLength} bytes)`);
      const putStartTime = Date.now();
      log(`⏱️ putObject operation starting at ${new Date().toISOString()}`);
      await client.putObject(testBucketName, testObjectKey, testObjectContent);
      log(`✅ putObject completed in ${Date.now() - putStartTime}ms`);
      log(`⏱️ putObject operation completed at ${new Date().toISOString()}`);
      
      // Verify object exists
      log(`📋 Checking if object exists...`);
      const exists = await client.headObject(testBucketName, testObjectKey);
      expect(exists).toBe(true);
      log(`📈 Object exists: ${exists}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for putObject test`);
      try {
        // Delete object first
        await client.deleteObject(testBucketName, testObjectKey).catch(err => 
          log(`⚠️ Cleanup error deleting object: ${err instanceof Error ? err.message : String(err)}`))
        
        // Then delete bucket
      //   await client.deleteBucket(testBucketName).catch(err => 
      //     log(`⚠️ Cleanup error deleting bucket: ${err instanceof Error ? err.message : String(err)}`))
      // } catch (err) {
      //   log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 5. Test headObject
  test('headObject should check if an object exists', async () => {
    log('🥵 STARTING TEST: headObject');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-head-object`);
    const testObjectKey = generateUniqueName('object') + '.txt';
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Put an object
      log(`📋 Putting object: ${testObjectKey} (${testObjectContent.byteLength} bytes)`);
      const putStartTime = Date.now();
      log(`⏱️ putObject operation starting at ${new Date().toISOString()}`);
      await client.putObject(testBucketName, testObjectKey, testObjectContent);
      log(`✅ putObject completed in ${Date.now() - putStartTime}ms`);
      log(`⏱️ putObject operation completed at ${new Date().toISOString()}`);
      
      // Check if object exists
      log(`📋 Checking if object ${testObjectKey} exists...`);
      const headStartTime = Date.now();
      const exists = await client.headObject(testBucketName, testObjectKey);
      log(`✅ headObject completed in ${Date.now() - headStartTime}ms`);
      
      // Validate result
      expect(exists).toBe(true);
      log(`📈 Object exists: ${exists}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for headObject test`);
      try {
        // Delete object first
        await client.deleteObject(testBucketName, testObjectKey).catch(err => 
          log(`⚠️ Cleanup error deleting object: ${err instanceof Error ? err.message : String(err)}`))
        
        // Then delete bucket
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error deleting bucket: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 6. Test getObject
  test('getObject should retrieve an object from a bucket', async () => {
    log('🥵 STARTING TEST: getObject');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-get-object`);
    const testObjectKey = generateUniqueName('object') + '.txt';
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Put an object
      log(`📋 Putting object: ${testObjectKey} (${testObjectContent.byteLength} bytes)`);
      const putStartTime = Date.now();
      log(`⏱️ putObject operation starting at ${new Date().toISOString()}`);
      await client.putObject(testBucketName, testObjectKey, testObjectContent);
      log(`✅ putObject completed in ${Date.now() - putStartTime}ms`);
      log(`⏱️ putObject operation completed at ${new Date().toISOString()}`);
      
      // Get the object
      log(`📋 Getting object: ${testObjectKey}`);
      const getStartTime = Date.now();
      log(`⏱️ getObject operation starting at ${new Date().toISOString()}`);
      const content = await client.getObject(testBucketName, testObjectKey);
      log(`✅ getObject completed in ${Date.now() - getStartTime}ms`);
      log(`⏱️ getObject operation completed at ${new Date().toISOString()}`);
      log(`📊 Retrieved content size: ${content.byteLength} bytes`);
      
      // Verify the content
      expect(content).toBeInstanceOf(Uint8Array);
      const originalText = new TextDecoder().decode(testObjectContent);
      const retrievedText = new TextDecoder().decode(content);
      expect(retrievedText).toBe(originalText);
      log(`📊 Content verification successful: '${retrievedText.substring(0, 20)}${retrievedText.length > 20 ? '...' : ''}'`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for getObject test`);
      try {
        // Delete object first
        await client.deleteObject(testBucketName, testObjectKey).catch(err => 
          log(`⚠️ Cleanup error deleting object: ${err instanceof Error ? err.message : String(err)}`))
        
        // Then delete bucket
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error deleting bucket: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 7. Test listObjects
  test('listObjects should list objects in a bucket', async () => {
    log('🥵 STARTING TEST: listObjects');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-list-objects`);
    const testObjectKey = generateUniqueName('object') + '.txt';
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Put an object
      log(`📋 Putting object: ${testObjectKey} (${testObjectContent.byteLength} bytes)`);
      const putStartTime = Date.now();
      log(`⏱️ putObject operation starting at ${new Date().toISOString()}`);
      await client.putObject(testBucketName, testObjectKey, testObjectContent);
      log(`✅ putObject completed in ${Date.now() - putStartTime}ms`);
      log(`⏱️ putObject operation completed at ${new Date().toISOString()}`);
      
      // List objects
      log(`📋 Listing objects in bucket: ${testBucketName}`);
      const listStartTime = Date.now();
      log(`⏱️ listObjects operation starting at ${new Date().toISOString()}`);
      const result = await client.listObjects(testBucketName);
      log(`✅ listObjects completed in ${Date.now() - listStartTime}ms`);
      log(`⏱️ listObjects operation completed at ${new Date().toISOString()}`);
      
      // Validate result
      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBeGreaterThan(0);
      expect(result.contents.some(obj => obj.key === testObjectKey)).toBe(true);
      
      log(`📊 Listed ${result.contents.length} objects in bucket`);
      log(`📊 Object keys: ${result.contents.map(o => o.key).join(', ')}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for listObjects test`);
      try {
        // Delete object first
        await client.deleteObject(testBucketName, testObjectKey).catch(err => 
          log(`⚠️ Cleanup error deleting object: ${err instanceof Error ? err.message : String(err)}`))
        
        // Then delete bucket
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error deleting bucket: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 8. Test deleteObject
  test('deleteObject should remove an object from a bucket', async () => {
    log('🥵 STARTING TEST: deleteObject');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-delete-object`);
    const testObjectKey = generateUniqueName('object') + '.txt';
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Put an object
      log(`📋 Putting object: ${testObjectKey} (${testObjectContent.byteLength} bytes)`);
      const putStartTime = Date.now();
      log(`⏱️ putObject operation starting at ${new Date().toISOString()}`);
      await client.putObject(testBucketName, testObjectKey, testObjectContent);
      log(`✅ putObject completed in ${Date.now() - putStartTime}ms`);
      log(`⏱️ putObject operation completed at ${new Date().toISOString()}`);
      
      // Verify object exists
      log(`📋 Verifying object exists before deletion...`);
      const verifyBeforeStartTime = Date.now();
      const existsBefore = await client.headObject(testBucketName, testObjectKey);
      log(`✅ headObject before deletion completed in ${Date.now() - verifyBeforeStartTime}ms`);
      expect(existsBefore).toBe(true);
      log(`📊 Object exists before deletion: ${existsBefore}`);
      
      // Delete the object
      log(`📋 Deleting object: ${testObjectKey}`);
      const deleteStartTime = Date.now();
      log(`⏱️ deleteObject operation starting at ${new Date().toISOString()}`);
      await client.deleteObject(testBucketName, testObjectKey);
      log(`✅ deleteObject completed in ${Date.now() - deleteStartTime}ms`);
      log(`⏱️ deleteObject operation completed at ${new Date().toISOString()}`);
      
      // Add an additional delay before verification to ensure eventual consistency
      const additionalConsistencyDelay = 3000; // 3 seconds
      log(`⏱️ Test: Waiting ${additionalConsistencyDelay}ms for eventual consistency before verification...`);
      await new Promise(resolve => setTimeout(resolve, additionalConsistencyDelay));
      
      // Verify object no longer exists with multiple attempts if needed
      log(`📋 Verifying object no longer exists...`);
      const verifyAfterStartTime = Date.now();
      
      // Try verification multiple times with increasing delays
      let existsAfter = true;
      const maxVerifyAttempts = 3;
      
      for (let verifyAttempt = 1; verifyAttempt <= maxVerifyAttempts; verifyAttempt++) {
        log(`📋 Verification attempt ${verifyAttempt}/${maxVerifyAttempts}...`);
        existsAfter = await client.headObject(testBucketName, testObjectKey);
        
        if (!existsAfter) {
          // Success - object is gone
          log(`✅ Object confirmed deleted on verification attempt ${verifyAttempt}`);
          break;
        } else if (verifyAttempt < maxVerifyAttempts) {
          // Object still exists, wait and retry
          const verifyDelay = 2000 * verifyAttempt; // Increasing delay for each attempt
          log(`⏱️ Object still exists, waiting ${verifyDelay}ms before next verification attempt...`);
          await new Promise(resolve => setTimeout(resolve, verifyDelay));
        }
      }
      
      log(`✅ headObject verification completed in ${Date.now() - verifyAfterStartTime}ms`);
      // Custom message for more descriptive failures
      if (existsAfter) {
        log(`⚠️ Object still exists after ${maxVerifyAttempts} verification attempts!`);
      }
      expect(existsAfter).toBe(false);
      log(`📊 Object exists after deletion: ${existsAfter}`);
    } finally {
      // Clean up - ensure this test's resources are removed
      log(`🧹 Cleaning up test resources for deleteObject test`);
      try {
        // Bucket should be empty, so just delete it
        await client.deleteBucket(testBucketName).catch(err => 
          log(`⚠️ Cleanup error: ${err instanceof Error ? err.message : String(err)}`))
      } catch (err) {
        log(`⚠️ Final cleanup error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  });

  // 9. Test deleteBucket
  test('deleteBucket should remove a bucket', async () => {
    log('🥵 STARTING TEST: deleteBucket');
    
    // Generate unique resource names for this test
    const testBucketName = generateUniqueName(`${testPrefix}-delete-bucket`);
    
    try {
      // Create a bucket
      log(`📋 Creating bucket: ${testBucketName}...`);
      const startTime = Date.now();
      await client.createBucket(testBucketName);
      log(`✅ Bucket creation completed in ${Date.now() - startTime}ms`);
      
      // Verify bucket exists
      log(`📋 Verifying bucket exists before deletion...`);
      const verifyBeforeStartTime = Date.now();
      const existsBefore = await client.headBucket(testBucketName);
      log(`✅ headBucket before deletion completed in ${Date.now() - verifyBeforeStartTime}ms`);
      expect(existsBefore).toBe(true);
      log(`📈 Bucket exists before deletion: ${existsBefore}`);
      
      // Delete the bucket
      log(`📋 Deleting bucket: ${testBucketName}`);
      const deleteStartTime = Date.now();
      log(`⏱️ deleteBucket operation starting at ${new Date().toISOString()}`);
      await client.deleteBucket(testBucketName);
      log(`✅ deleteBucket completed in ${Date.now() - deleteStartTime}ms`);
      log(`⏱️ deleteBucket operation completed at ${new Date().toISOString()}`);
      
      // Verify the bucket no longer exists
      log(`📋 Verifying bucket no longer exists...`);
      const verifyAfterStartTime = Date.now();
      const existsAfter = await client.headBucket(testBucketName);
      log(`✅ headBucket after deletion completed in ${Date.now() - verifyAfterStartTime}ms`);
      expect(existsAfter).toBe(false);
      log(`📈 Bucket exists after deletion: ${existsAfter}`);
    } catch (err) {
      // Use the current time rather than a missing startTime variable
      log(`❌ deleteBucket test failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  });
});
