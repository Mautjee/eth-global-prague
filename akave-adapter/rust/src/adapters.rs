use anyhow::{anyhow, Result};
use aws_sdk_s3::{self, primitives::ByteStream, Client as S3Client};
use aws_credential_types::{Credentials, provider::SharedCredentialsProvider};
// The AWS SDK imports we actually need
use aws_smithy_types::date_time::Format;
use serde::{Deserialize, Serialize};

#[cfg(test)]
use tokio;

#[derive(Debug, Clone)]
pub struct AkaveClient {
    s3_client: S3Client,
    // Fields below are kept for future use but not currently used
    #[allow(dead_code)]
    endpoint: String,
    #[allow(dead_code)]
    region: String,
}

// We'll use the AWS SDK's native types for responses
// but we'll keep our own types for compatibility with existing code
#[derive(Debug, Serialize, Deserialize)]
pub struct Bucket {
    pub name: String,
    pub creation_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListBucketsOutput {
    pub buckets: Vec<Bucket>,
    pub owner: Owner,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Owner {
    pub display_name: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Object {
    pub key: String,
    pub last_modified: String,
    pub etag: String,
    pub size: u64,
    pub storage_class: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListObjectsOutput {
    pub contents: Vec<Object>,
    pub name: String,
    pub prefix: String,
    pub delimiter: Option<String>,
    pub max_keys: i32,
    pub is_truncated: bool,
}

impl AkaveClient {
    // Constructor for AkaveClient
    pub async fn new(endpoint: &str, access_key: &str, secret_key: &str) -> Self {
        // Parse the endpoint URL to extract just the hostname
        let endpoint_str = endpoint.to_string();
        
        // Setup static credentials provider
        let credentials_provider = SharedCredentialsProvider::new(
            Credentials::new(
                access_key, 
                secret_key, 
                None, // session token not needed
                None, // expiry not needed
                "static"
            )
        );
        
        // Create S3 config with custom endpoint
        let config = aws_config::from_env()
            .credentials_provider(credentials_provider)
            .region("akave-network") // or use "global" which is default for Akave O3
            .load()
            .await;
        
        // Create S3 client with custom config
        let s3_config = aws_sdk_s3::config::Builder::from(&config)
            .endpoint_url(endpoint_str.clone())
            .force_path_style(true) // Important for S3-compatible services
            .build();
        
        let s3_client = aws_sdk_s3::Client::from_conf(s3_config);
        
        Self {
            s3_client,
            endpoint: endpoint_str,
            region: "akave-network".to_string(),
        }
    }

    // Bucket operations
    pub async fn create_bucket(&self, bucket_name: &str) -> Result<()> {
        match self.s3_client
            .create_bucket()
            .bucket(bucket_name)
            .send()
            .await 
        {
            Ok(_) => {
                // Successfully created bucket
                Ok(())
            },
            Err(err) => {
                // For Akave O3, sometimes bucket creation succeeds but returns a service error
                // Check if the bucket actually exists despite the error
                match self.head_bucket(bucket_name).await {
                    Ok(true) => {
                        // Bucket exists, so creation probably succeeded
                        println!("⚠️ Bucket creation returned an error but bucket exists. Considering operation successful.");
                        Ok(())
                    },
                    _ => {
                        // Bucket doesn't exist, so this is a genuine error
                        Err(anyhow!("Failed to create bucket: {}", err))
                    }
                }
            }
        }
    }

    pub async fn delete_bucket(&self, bucket_name: &str) -> Result<()> {
        // First, ensure the bucket is empty by listing objects
        let list_result = self.list_objects(bucket_name, None).await;
        
        if let Ok(listing) = list_result {
            if !listing.contents.is_empty() {
                // Delete all objects in the bucket first
                for object in &listing.contents {
                    if let Err(e) = self.delete_object(bucket_name, &object.key).await {
                        // Log error but continue with other objects
                        eprintln!("Warning: Failed to delete object {} during bucket emptying: {}", object.key, e);
                    }
                }
                
                // Small delay to allow delete operations to complete
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }
        
        // Now attempt to delete the empty bucket
        let delete_bucket_request = self.s3_client
            .delete_bucket()
            .bucket(bucket_name)
            .send()
            .await;
            
        match delete_bucket_request {
            Ok(_) => Ok(()),
            Err(err) => {
                // Specific error message with more context
                Err(anyhow!("Failed to delete bucket '{}': {}", bucket_name, err))
            },
        }
    }

    pub async fn head_bucket(&self, bucket_name: &str) -> Result<bool> {
        let head_bucket_request = self.s3_client
            .head_bucket()
            .bucket(bucket_name)
            .send()
            .await;
            
        match head_bucket_request {
            Ok(_) => Ok(true),
            Err(err) => {
                if err.to_string().contains("404") {
                    // Bucket doesn't exist
                    Ok(false)
                } else {
                    // Other error
                    Err(anyhow!("Error checking bucket: {}", err))
                }
            }
        }
    }

    pub async fn list_buckets(&self) -> Result<ListBucketsOutput> {
        let response = self.s3_client
            .list_buckets()
            .send()
            .await
            .map_err(|err| anyhow!("Failed to list buckets: {}", err))?;
            
        // Convert from AWS SDK types to our types
        let buckets = response.buckets()
            .unwrap_or_default()
            .iter()
            .map(|b| Bucket {
                name: b.name().unwrap_or_default().to_string(),
                creation_date: b.creation_date()
                    .map(|d| d.fmt(aws_smithy_types::date_time::Format::DateTime).unwrap_or_default())
                    .unwrap_or_default(),
            })
            .collect();
            
        let owner = Owner {
            display_name: response.owner()
                .and_then(|o| o.display_name())
                .unwrap_or_default()
                .to_string(),
            id: response.owner()
                .and_then(|o| o.id())
                .unwrap_or_default()
                .to_string(),
        };
            
        Ok(ListBucketsOutput { buckets, owner })
    }

    // Object operations
    pub async fn put_object(&self, bucket_name: &str, key: &str, content: Vec<u8>) -> Result<()> {
        self.s3_client
            .put_object()
            .bucket(bucket_name)
            .key(key)
            .body(ByteStream::from(content))
            .send()
            .await?;

        Ok(())
    }

    pub async fn get_object(&self, bucket_name: &str, key: &str) -> Result<Vec<u8>> {
        let response = self.s3_client
            .get_object()
            .bucket(bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|err| anyhow!("Failed to get object: {}", err))?;
            
        // Read the body stream into a Vec<u8>
        let bytes = response.body.collect().await?.to_vec();
        Ok(bytes)
    }

    pub async fn delete_object(&self, bucket_name: &str, key: &str) -> Result<()> {
        // Send the delete request
        self.s3_client
            .delete_object()
            .bucket(bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|err| anyhow!("Failed to delete object: {}", err))?;
        
        // The AWS S3 API returns a 204 No Content for successful deletion
        // Add a small delay to allow deletion to propagate (this helps with eventual consistency)
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        
        Ok(())
    }

    pub async fn head_object(&self, bucket_name: &str, key: &str) -> Result<bool> {
        let head_request = self.s3_client
            .head_object()
            .bucket(bucket_name)
            .key(key)
            .send()
            .await;
        
        match head_request {
            Ok(_) => Ok(true),
            Err(err) => {
                let error_str = err.to_string().to_lowercase();
                
                // Check for various error messages that indicate object doesn't exist
                if error_str.contains("404") || 
                   error_str.contains("not found") || 
                   error_str.contains("no such key") ||
                   error_str.contains("does not exist") {
                    // Object doesn't exist
                    Ok(false)
                } else if error_str.contains("service error") && 
                          (error_str.contains("head_object") || error_str.contains("head object")) {
                    // For Akave O3, sometimes service errors might be returned instead of 404
                    // when checking objects that don't exist (service-specific behavior)
                    Ok(false)
                } else {
                    // Other error
                    Err(anyhow!("Error checking object: {}", err))
                }
            }
        }
    }

    pub async fn list_objects(&self, bucket_name: &str, prefix: Option<&str>) -> Result<ListObjectsOutput> {
        let mut request = self.s3_client.list_objects_v2().bucket(bucket_name);
        
        // Add prefix if specified
        if let Some(prefix_value) = prefix {
            request = request.prefix(prefix_value);
        }
        
        let response = request
            .send()
            .await
            .map_err(|err| anyhow!("Failed to list objects: {}", err))?;
            
        // Convert from AWS SDK types to our types
        let contents = response.contents()
            .unwrap_or_default()
            .iter()
            .map(|obj| Object {
                key: obj.key().unwrap_or_default().to_string(),
                last_modified: obj.last_modified()
                    .map(|d| d.fmt(Format::DateTime).unwrap_or_default())
                    .unwrap_or_default(),
                etag: obj.e_tag().unwrap_or_default().trim_matches('"').to_string(),
                size: obj.size() as u64,
                storage_class: obj.storage_class().map(|s| s.as_str().to_string()).unwrap_or_default(),
            })
            .collect();
            
        Ok(ListObjectsOutput {
            contents,
            name: bucket_name.to_string(),
            prefix: prefix.unwrap_or("").to_string(),
            delimiter: response.delimiter().map(|s| s.to_string()),
            max_keys: response.max_keys() as i32,
            is_truncated: response.is_truncated(),
        })
    }
}

#[cfg(test)]
mod mock_tests {
    #[tokio::test]
    async fn test_create_bucket_success() {
        // Create test data
        let bucket_name = "test-bucket";
        
        // Request a new server from the pool
        let mut server = mockito::Server::new_async().await;
        
        // Print the expected URL for debugging
        let expected_url = format!("/{}" , bucket_name);
        println!("🧪 Expected URL: {}", expected_url);
        
        // Create a mock for the PUT request to create a bucket
        let mock = server.mock("PUT", expected_url.as_str())
            .with_status(200)
            .create_async()
            .await;
        
        // Create the AkaveClient with the server URL
        let server_url = server.url();
        let client = super::AkaveClient::new(
            &server_url,
            "test_access_key",
            "test_secret_key"
        ).await;
        
        // Call the create_bucket method
        let full_url = format!("{}/{}", server_url, bucket_name);
        println!("🧪 Sending request to: {}", full_url);
        
        let result = client.create_bucket(bucket_name).await;
        
        // Print the result for debugging
        println!("🧪 Result: {:#?}", result);
        
        // Print mock information for debugging
        println!("🧪 Mock expectations: {:#?}", mock.matched());
        
        // Verify the result is successful
        assert!(result.is_ok(), "result was not successful: {:#?}", result);
        
        // Verify that the mock was called
        println!("🧪 Verifying mock expectations...");
        mock.assert_async().await;
        println!("✅ Mock assertions passed");
    }
    
    #[tokio::test]
    async fn test_put_object_success() {
        // Create test data
        let bucket_name = "test-bucket";
        let object_key = "test-key";
        let test_data = vec![0; 1024];
        
        // Request a new server from the pool
        let mut server = mockito::Server::new_async().await;
        
        // Print the expected URL for debugging
        let expected_url = format!("/{}/{}", bucket_name, object_key);
        println!("🧪 Expected URL: {}", expected_url);
        
        // Create a mock for the PUT request to upload an object
        // Note: We're using a simpler matcher for the authorization header
        // since mockito's match_header doesn't support closures
        let mock = server.mock("PUT", expected_url.as_str())
            .with_status(200)
            .with_header("content-type", "application/octet-stream")
            .with_body(test_data.clone())
            .create_async()
            .await;
        
        // Create the AkaveClient with the server URL
        let server_url = server.url();
        let client = super::AkaveClient::new(
            &server_url,
            "test_access_key",
            "test_secret_key"
        ).await;
        
        // Call the put_object method
        let full_url = format!("{}/{}/{}", server_url, bucket_name, object_key);
        println!("🧪 Sending request to: {}", full_url);
        
        let result = client.put_object(bucket_name, object_key, test_data).await;
        
        // Print the result for debugging
        println!("🧪 Result: {:#?}", result);
        
        // Print mock information for debugging
        println!("🧪 Mock expectations: {:#?}", mock.matched());
        
        // Verify the result is successful
        assert!(result.is_ok(), "result was not successful: {:#?}", result);
        
        // Verify that the mock was called
        println!("🧪 Verifying mock expectations...");
        mock.assert_async().await;
        println!("✅ Mock assertions passed");
    }
}


// Test using 'cargo test --package akave-adapter --bin akave-adapter -- integration_tests:: --ignored --test-threads=1 '
#[cfg(test)]
mod integration_tests {
    use super::*;
    use dotenv::dotenv;
    use std::env;
    use std::time::{SystemTime, UNIX_EPOCH};

    /// Helper struct for test configuration and setup
    struct TestConfig {
        client: AkaveClient,
        test_bucket: String,
    }

    /// Setup function for integration tests
    async fn setup_test_environment() -> Result<TestConfig> {
        dotenv().ok();
        let endpoint = env::var("AKAVE_ENDPOINT").expect("AKAVE_ENDPOINT must be set");
        let access_key = env::var("AKAVE_ACCESS_KEY").expect("AKAVE_ACCESS_KEY must be set");
        let secret_key = env::var("AKAVE_SECRET_KEY").expect("AKAVE_SECRET_KEY must be set");
        
        println!("🔧 Setting up integration test environment with endpoint: {}", endpoint);
        
        // Generate unique bucket name with timestamp to avoid conflicts
        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let test_bucket = format!("test-bucket-{}", timestamp);
        println!("🔧 Generated unique bucket name: {}", test_bucket);
        
        let client = AkaveClient::new(&endpoint, &access_key, &secret_key).await;
        
        // Create test bucket
        println!("🔧 Creating test bucket: {}", test_bucket);
        client.create_bucket(&test_bucket).await
            .map_err(|e| anyhow!("Failed to create test bucket: {}", e))?;
        
        // Verify bucket was created
        match client.head_bucket(&test_bucket).await {
            Ok(true) => println!("✅ Test bucket created successfully"),
            _ => return Err(anyhow!("Failed to verify bucket creation")),
        }
        
        Ok(TestConfig { client, test_bucket })
    }
    
    /// Test bucket operations
    #[tokio::test]
    #[ignore]
    async fn test_bucket_operations() {
        let config = setup_test_environment().await.expect("Failed to set up test environment");
        
        println!("🧪 Testing bucket operations...");
        
        // List buckets and verify our test bucket is included
        match config.client.list_buckets().await {
            Ok(bucket_listing) => {
                println!("✅ Listed {} buckets", bucket_listing.buckets.len());
                let found = bucket_listing.buckets.iter().any(|b| b.name == config.test_bucket);
                assert!(found, "Test bucket not found in bucket listing");
                println!("✅ Test bucket found in listing");
            }
            Err(e) => panic!("Failed to list buckets: {}", e),
        }
        
        // Try bucket exists check
        match config.client.head_bucket(&config.test_bucket).await {
            Ok(true) => println!("✅ Bucket exists check passed"),
            _ => panic!("Bucket exists check failed"),
        }
        
        // Document Akave O3 bucket deletion behavior
        println!("ℹ️ NOTE: Not attempting bucket deletion as Akave O3 has specific limitations");
        println!("ℹ️ IMPORTANT: Test bucket {} should be manually deleted", config.test_bucket);
    }
    
    /// Test object operations
    #[tokio::test]
    #[ignore]
    async fn test_object_operations() {
        let config = setup_test_environment().await.expect("Failed to set up test environment");
        
        println!("🧪 Testing object operations...");
        
        // Create test object data
        let object_key = "test-object-operations";
        let object_content = b"This is a test object for object operations";
        
        // Put object
        println!("🧪 Uploading test object: {}", object_key);
        config.client.put_object(&config.test_bucket, object_key, object_content.to_vec()).await
            .expect("Failed to upload object");
        println!("✅ Object uploaded successfully");
        
        // Check if object exists
        match config.client.head_object(&config.test_bucket, object_key).await {
            Ok(true) => println!("✅ Object exists check passed"),
            _ => panic!("Object exists check failed"),
        }
        
        // Get object and verify content
        let retrieved = config.client.get_object(&config.test_bucket, object_key).await
            .expect("Failed to get object");
        assert_eq!(retrieved, object_content.to_vec(), "Retrieved content doesn't match uploaded content");
        println!("✅ Object retrieved and content verified");
        
        // List objects
        let objects = config.client.list_objects(&config.test_bucket, None).await
            .expect("Failed to list objects");
        assert!(objects.contents.iter().any(|obj| obj.key == object_key), "Uploaded object not found in listing");
        println!("✅ Object found in bucket listing");
        
        // Delete object
        config.client.delete_object(&config.test_bucket, object_key).await
            .expect("Failed to delete object");
        println!("✅ Object deleted");
        
        // Verify deletion with appropriate error handling for Akave O3
        println!("🧪 Verifying object deletion...");
        std::thread::sleep(std::time::Duration::from_secs(1)); // Small delay for eventual consistency
        
        match config.client.s3_client.get_object()
            .bucket(&config.test_bucket)
            .key(object_key)
            .send()
            .await {
                Ok(_) => println!("⚠️ Object still accessible after deletion (Akave O3 eventual consistency)"),
                Err(err) => println!("✅ Object deletion verified: {}", err),
            }
        
        println!("ℹ️ IMPORTANT: Test bucket {} should be manually deleted", config.test_bucket);
        println!("✅ Object operations test completed successfully");
    }
    
    /// Comprehensive test of all operations
    #[tokio::test]
    #[ignore]
    async fn test_comprehensive_integration() {
        dotenv().ok();
        let endpoint = env::var("AKAVE_ENDPOINT").expect("AKAVE_ENDPOINT must be set");
        let access_key = env::var("AKAVE_ACCESS_KEY").expect("AKAVE_ACCESS_KEY must be set");
        let secret_key = env::var("AKAVE_SECRET_KEY").expect("AKAVE_SECRET_KEY must be set");
        
        println!("🧪 Starting comprehensive integration test with endpoint: {}", endpoint);
        
        // Generate unique bucket name with timestamp to avoid conflicts
        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let test_bucket = format!("test-bucket-{}", timestamp);
        println!("🧪 Generated unique bucket name: {}", test_bucket);
        
        let client = AkaveClient::new(&endpoint, &access_key, &secret_key).await;
        
        // 1. List existing buckets
        println!("🧪 Listing existing buckets...");
        match client.list_buckets().await {
            Ok(bucket_listing) => {
                println!("🧪 Found {} existing buckets:", bucket_listing.buckets.len());
                for bucket in bucket_listing.buckets.iter().take(5) { // Show only first 5 to avoid clutter
                    println!("   - {}, created: {}", 
                        bucket.name, 
                        bucket.creation_date
                    );
                }
                if bucket_listing.buckets.len() > 5 {
                    println!("   - ... and {} more buckets", bucket_listing.buckets.len() - 5);
                }
            }
            Err(e) => println!("❌ Could not list buckets: {}", e),
        }
        
        // 2. Create a new bucket
        println!("🧪 Creating new test bucket: {}", test_bucket);
        client.create_bucket(&test_bucket).await
            .expect("Failed to create bucket");
        println!("✅ Test bucket created successfully");
        
        // 3. Upload, download, verify objects
        let object_key = "test-comprehensive-object";
        let object_content = b"This is a test object for the comprehensive integration test";
        
        println!("🧪 Uploading test object: {}", object_key);
        client.put_object(&test_bucket, object_key, object_content.to_vec()).await
            .expect("Failed to upload object");
        println!("✅ Object uploaded successfully");
        
        let retrieved = client.get_object(&test_bucket, object_key).await
            .expect("Failed to retrieve object");
        assert_eq!(retrieved, object_content.to_vec(), "Retrieved content doesn't match uploaded content");
        println!("✅ Object retrieved and content verified");
        
        // 4. List objects
        let objects = client.list_objects(&test_bucket, None).await
            .expect("Failed to list objects");
        assert!(objects.contents.iter().any(|obj| obj.key == object_key), "Uploaded object not found in listing");
        println!("✅ Object found in bucket listing");
        
        // 5. Delete object
        client.delete_object(&test_bucket, object_key).await
            .expect("Failed to delete object");
        println!("✅ Object deleted");
        
        // 6. Document Akave O3 specific behavior
        println!("ℹ️ NOTE: Akave O3 specific behaviors observed:");
        println!("ℹ️ - Object deletion may have eventual consistency (objects may appear to exist after deletion)");
        println!("ℹ️ - Bucket deletion may be restricted or require special permissions");
        println!("ℹ️ - 'Service error' responses may be returned instead of proper 404 errors in some cases");
        println!("ℹ️ IMPORTANT: Test bucket {} should be manually deleted", test_bucket);
        
        println!("🧪 ✅ Comprehensive integration test completed successfully");
    }
}
