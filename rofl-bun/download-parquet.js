const { AkaveClient } = require('./adapters');
const fs = require('fs');
const path = require('path');

// Helper function to implement sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Bun automatically loads .env files
(async () => {
  // Create AkaveClient instance using env variables from .env
  const client = new AkaveClient(
    process.env.AKAVE_ENDPOINT,
    process.env.AKAVE_ACCESS_KEY,
    process.env.AKAVE_SECRET_KEY,
    process.env.AKAVE_REGION
  );
  
  const bucketName = 'BaMaMe-Bucket';
  // Make sure we use the correct object key that matches what was uploaded
  // Check both 'names-and-cities' and 'names-and-cities.parquet'
  const possibleKeys = ['names-and-cities', 'names-and-cities.parquet'];
  const outputPath = './downloaded-names-and-cities.parquet';
  
  let foundKey = null;
  
  // First list all objects to confirm what's in the bucket
  try {
    console.log(`Listing objects in ${bucketName} to find our file...`);
    const listResult = await client.listObjects(bucketName);
    console.log(`Found ${listResult.contents.length} objects in bucket:`);
    
    for (const obj of listResult.contents) {
      console.log(`- ${obj.key} (${obj.size} bytes)`);
      // Check if one of our possible keys matches
      if (possibleKeys.includes(obj.key)) {
        foundKey = obj.key;
        console.log(`✅ Found our target object with key: ${foundKey}`);
      }
    }
    
    if (!foundKey) {
      // If we couldn't find the exact key, try to find a key that contains our target name
      for (const obj of listResult.contents) {
        if (obj.key.includes('names-and-cities')) {
          foundKey = obj.key;
          console.log(`✅ Found similar object with key: ${foundKey}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error(`Error listing objects: ${error.message}`);
  }
  
  // If we still don't have a key, try our possible keys
  if (!foundKey) {
    console.log('Could not determine exact key, will try possible keys...');
    foundKey = possibleKeys[0]; // Default to first possible key
  }
  
  console.log(`Downloading ${foundKey} from ${bucketName}...`);
  
  try {
    // Check if object exists
    console.log(`Verifying object exists...`);
    const objectExists = await client.headObject(bucketName, foundKey);
    if (!objectExists) {
      console.error(`Object ${foundKey} not found in bucket ${bucketName}`);
      return;
    }
    
    console.log(`Object confirmed to exist, downloading...`);
    console.log(`This may take some time with multiple retries...`);
    
    // Download the object
    const content = await client.getObject(bucketName, foundKey);
    
    // Save to file
    fs.writeFileSync(outputPath, Buffer.from(content));
    
    console.log(`\n✅ Download successful! Saved to ${outputPath}`);
    console.log(`File size: ${content.length} bytes`);
  } catch (error) {
    console.error('\n❌ Error downloading object:');
    console.error(error);
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify your .env file has valid credentials');
    console.log('2. Try running the script again (sometimes temporary network issues resolve)');
    console.log('3. Check if the Akave service is experiencing issues');
    console.log('4. The file may be too large - try downloading a smaller file first to test');
  }
})();
