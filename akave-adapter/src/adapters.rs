use anyhow::{anyhow, Result};
use aws_sdk_s3::{self, primitives::ByteStream, Client as S3Client};
use aws_credential_types::{Credentials, provider::SharedCredentialsProvider};
use aws_config::SdkConfig;
use aws_smithy_types::date_time::Format;
use serde::{Deserialize, Serialize};

#[cfg(test)]
use tokio;

#[derive(Debug, Clone)]
pub struct AkaveClient {
    s3_client: S3Client,
    endpoint: String,
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
        let create_bucket_request = self.s3_client
            .create_bucket()
            .bucket(bucket_name)
            .send()
            .await;
            
        match create_bucket_request {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!("Failed to create bucket: {}", err)),
        }
    }

    pub async fn delete_bucket(&self, bucket_name: &str) -> Result<()> {
        let delete_bucket_request = self.s3_client
            .delete_bucket()
            .bucket(bucket_name)
            .send()
            .await;
            
        match delete_bucket_request {
            Ok(_) => Ok(()),
            Err(err) => Err(anyhow!("Failed to delete bucket: {}", err)),
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
        self.s3_client
            .delete_object()
            .bucket(bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|err| anyhow!("Failed to delete object: {}", err))?;
            
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
                if err.to_string().contains("404") {
                    // Object doesn't exist
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

#[cfg(test)]
mod integration_tests {
    use super::*;
    use std::env;
    use dotenv::dotenv;

    #[tokio::test]
    #[ignore] // Run with `cargo test -- integration_tests::test_put_get_object_integration --ignored`
    async fn test_put_get_object_integration() {
        // Load .env file if present
        dotenv().ok();
        
        // 1. Read credentials from environment variables
        let endpoint = env::var("AKAVE_ENDPOINT")
            .expect("AKAVE_ENDPOINT must be set for integration tests");
        let access_key = env::var("AKAVE_ACCESS_KEY")
            .expect("AKAVE_ACCESS_KEY must be set for integration tests");
        let secret_key = env::var("AKAVE_SECRET_KEY")
            .expect("AKAVE_SECRET_KEY must be set for integration tests");
        let bucket_name = env::var("AKAVE_TEST_BUCKET")
            .unwrap_or_else(|_| "test-integration-bucket".to_string());
        
        println!("🧪 Starting integration test with endpoint: {}", endpoint);
        
        // 2. Create the AkaveClient with real credentials
        let client = AkaveClient::new(&endpoint, &access_key, &secret_key).await;
        
        // 3. Generate a unique object key to avoid conflicts
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let object_key = format!("test-object-{}", timestamp);
        println!("🧪 Generated unique object key: {}", object_key);
        
        // 4. Create test data - something we can verify after retrieval
        let test_data = format!("Hello, Akave! This is a test at {}", timestamp)
            .into_bytes();
        println!("🧪 Test data size: {} bytes", test_data.len());

        // 5. Create the bucket
        println!("🧪 Creating bucket: {}", bucket_name);
        let create_result = client.create_bucket(&bucket_name).await;
        match create_result {
            Ok(_) => println!("🧪 Bucket created or already exists"),
            Err(e) => {
                println!("🧪 Warning: Couldn't create bucket: {}", e);
                println!("🧪 This is okay if the bucket already exists");
            }
        }
        
        // 6. Upload the object
        println!("🧪 Uploading object: {}", object_key);
        client.put_object(&bucket_name, &object_key, test_data.clone()).await
            .expect("Failed to upload test object");
            
        // 7. Verify we can retrieve it
        println!("🧪 Retrieving object: {}", object_key);
        let retrieved_data = client.get_object(&bucket_name, &object_key).await
            .expect("Failed to retrieve test object");
            
        // 8. Verify the content matches
        assert_eq!(test_data, retrieved_data, "Retrieved data does not match original data");
        println!("🧪 ✅ Retrieved data matches original data");
        
        // 9. Optional: List objects to verify the object appears in listings
        println!("🧪 Listing objects in bucket...");
        let list_result = client.list_objects(&bucket_name, Some("test-object")).await;
        if let Ok(listing) = list_result {
            let found = listing.contents.iter().any(|obj| obj.key == object_key);
            assert!(found, "Uploaded object not found in listing");
            println!("🔍 Object found in bucket listing");
            
            // Print some details about the object from the listing
            if let Some(obj) = listing.contents.iter().find(|o| o.key == object_key) {
                println!("🔍 Object details from listing:");
                println!("   Key: {}", obj.key);
                println!("   Size: {} bytes", obj.size);
                println!("   ETag: {}", obj.etag);
                println!("   Last Modified: {}", obj.last_modified);
            }
        } else {
            println!("⚠️ Could not list objects: {:?}", list_result.err().unwrap());
            // Continue anyway, we might not have LIST permission
        }
        
        // 10. Clean up - delete the test object
        println!("🧹 Cleaning up - deleting test object...");
        let delete_result = client.delete_object(&bucket_name, &object_key).await;
        if let Err(e) = delete_result {
            println!("⚠️ Could not delete object: {:?}", e);
            // Don't fail the test on cleanup errors
        } else {
            println!("✅ Object deleted successfully");
        }
        
        println!("🧪 ✅ Test completed successfully");
    }
}
