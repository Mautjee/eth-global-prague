import { Result, err, ok } from 'neverthrow';
import type { Vault } from './types/contracts';
import { provider, bucketName } from './config';
import { getProposalsByStatus, consumeProposal, ProposalState } from './vault';
import duckdb from 'duckdb';
import { AkaveClient } from './adapters';
import fs from 'fs';

const scanForProposals = async (): Promise<Result<Vault.QueryProposalStruct | undefined, Error>> => {
    const status = ProposalState.Approved;
    const result = await getProposalsByStatus(status);

    if (result.isErr()) {
        return err(result.error);
    }
    if (result.value.length === 0) {
        return ok(undefined);
    }

    return ok(result.value[0]!);
}

export const executeQueryProposal = async (proposal: Vault.QueryProposalStruct): Promise<Result<string, Error>> => {
    const db = new duckdb.Database(':memory:');
    
    try {
        console.log('Starting query proposal execution...');
        
        const client = new AkaveClient(
            process.env.AKAVE_ENDPOINT || '',
            process.env.AKAVE_ACCESS_KEY || '',
            process.env.AKAVE_SECRET_KEY || '',
            process.env.AKAVE_REGION || ''
        );

        // Check if bucket exists, create if it doesn't
        console.log(`Checking if bucket ${bucketName} exists...`);
        const bucketExists = await client.headBucket(bucketName);
        if (!bucketExists) {
            console.log(`Bucket ${bucketName} does not exist, creating it...`);
            await client.createBucket(bucketName);
            console.log(`Bucket ${bucketName} created successfully.`);
        } else {
            console.log(`Bucket ${bucketName} already exists.`);
        }

        // Get all objects in this bucket (.parquet files)
        console.log(`Listing objects in bucket ${bucketName}...`);
        const objects = await client.listObjects(bucketName);

        // Check if objects are empty
        if (objects.contents.length === 0) {
            return err(new Error(`No objects found in bucket ${bucketName}`));
        }

        console.log(`Found ${objects.contents.length} objects in bucket:`);
        for (const obj of objects.contents) {
            console.log(`- ${obj.key} (${obj.size} bytes)`);
        }
        
        // Loop through objects and load them into duckdb
        console.log('Loading parquet files into DuckDB...');
        
        for (const object of objects.contents) {
            // Skip non-parquet files
            if (!object.key.toLowerCase().endsWith('.parquet')) {
                console.log(`Skipping non-parquet file: ${object.key}`);
                continue;
            }
            
            console.log(`Downloading object: ${object.key}`);
            // Get the object
            const objectContent = await client.getObject(bucketName, object.key);
            
            // Create a temporary file to store the parquet data
            const tempFilePath = `./${object.key}`;
            console.log(`Writing object to temporary file: ${tempFilePath}`);
            fs.writeFileSync(tempFilePath, Buffer.from(objectContent));
            
            // Create a table name from the object key (remove extension and sanitize)
            const tableName = object.key.replace('.parquet', '').replace(/[^a-zA-Z0-9_]/g, '_');
            
            // Load the parquet file into DuckDB
            console.log(`Creating table ${tableName} from parquet file`);
            await new Promise<void>((resolve, reject) => {
                db.run(`CREATE TABLE ${tableName} AS SELECT * FROM read_parquet('${tempFilePath}')`, (err) => {
                    if (err) {
                        console.error(`Error creating table from parquet: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`Table ${tableName} created successfully.`);
                        resolve();
                    }
                });
            });
            
            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);
        }

        // Run the SQL query from the proposal
        console.log(`Executing SQL query: ${proposal.sqlQuery}`);
        const rows = await new Promise<any[]>((resolve, reject) => {
            db.all(proposal.sqlQuery, (err, rows) => {
                if (err) {
                    console.error(`Error executing query: ${err.message}`);
                    reject(err);
                } else {
                    console.log(`Query executed successfully, got ${rows.length} rows.`);
                    resolve(rows);
                }
            });
        });
        
        // Format the result
        const result = rows.join('\n');
        console.log('Query execution completed successfully.');
        return ok(result);
    } catch (error) {
        console.error(`Error in executeQueryProposal: ${error instanceof Error ? error.message : String(error)}`);
        return err(error instanceof Error ? error : new Error(String(error)));
    } finally {
        // Always close the database
        console.log('Closing DuckDB connection...');
        db.close();
    }
}

const proposalFlow = async () => {
    const result = await scanForProposals();

    if (result.isErr()) {
        console.error(`Error scanning for proposals:`, result.error);
        return;
    }
    if (result.value == undefined) {
        console.log(`No proposals found at status ${ProposalState.Approved}`);
        return;
    }
    console.log(`Proposal ID at status ${ProposalState.Approved}: ${result.value.id}`);
    const executeResult = await executeQueryProposal(result.value);

    if (executeResult.isErr()) {
        console.error(`Error executing proposal:`, executeResult.error);
        return;
    }
    console.log(`Proposal executed: ${executeResult.value}`);

    // const consumeResult = await consumeProposal(result.value.id, executeResult.value);

    // if (consumeResult.isErr()) {
    //     console.error(`Error consuming proposal:`, consumeResult.error);
    // }
};

const uploadFlow = async () => {
    //call maken naar dao

    //
};

provider.on("block", async (blockNumber) => {
    console.log(`📬 New block received: ${blockNumber}`);

    proposalFlow();
    uploadFlow();
});

// Set up initial error handling
provider.on("error", (error) => {
    console.error("Provider error:", error);
});

// Prevent the Node.js process from exiting
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    provider.destroy();
    process.exit(0);
});
