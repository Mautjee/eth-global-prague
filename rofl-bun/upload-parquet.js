const { AkaveClient } = require('./adapters');
const fs = require('fs');
const path = require('path');

// Bun automatically loads .env files
(async () => {
  // Create AkaveClient instance using env variables from .env
  const client = new AkaveClient(
    process.env.AKAVE_ENDPOINT,
    process.env.AKAVE_ACCESS_KEY,
    process.env.AKAVE_SECRET_KEY,
    process.env.AKAVE_REGION
  );
  
  // Read the file
  const filePath = './names-and-cities.parquet';
  const fileContent = fs.readFileSync(filePath);
  
  // Convert to Uint8Array as required by putObject
  const content = new Uint8Array(fileContent);
  
  console.log(`Uploading ${filePath} to BaMaMe-Bucket...`);
  
  try {
    // Check if bucket exists, create if not
    const bucketExists = await client.headBucket('BaMaMe-Bucket');
    if (!bucketExists) {
      console.log('Creating bucket BaMaMe-Bucket...');
      await client.createBucket('BaMaMe-Bucket');
    }
    
    // Upload file with putObject
    await client.putObject('BaMaMe-Bucket', 'names-and-cities', content);
    console.log('Upload successful!');
  } catch (error) {
    console.error('Error:', error);
  }
})();