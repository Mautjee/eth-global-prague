use async_trait::async_trait;
use ethabi::{Event, EventParam, ParamType, RawLog, Token};
use oasis_runtime_sdk::crypto::signature::secp256k1;
use oasis_runtime_sdk::modules::rofl::app::prelude::*;
use oasis_runtime_sdk::types;
use oasis_runtime_sdk::types::address::SignatureAddressSpec;
use serde::{Deserialize, Serialize};
use serde_json::json;

use anyhow::Result;
use std::sync::Arc;

const CONTRACT_ADDRESS: &str = "0xcDC557d454C09141d7bbb1E67c39BF500a348A5a";
const LOG_SERVER_URL: &str = "http://79c8-195-113-187-130.ngrok-free.app";

// A small struct for serializing the JSON POST body.
#[derive(Serialize)]
struct LogPayload<'a> {
    message: &'a str,
}

async fn post_log(msg: &str) -> Result<()> {
    // Build a reqwest client
    let client = reqwest::Client::new();

    // Construct our JSON payload
    let payload = LogPayload { message: msg };

    // Send it off
    let resp = client
        .post(LOG_SERVER_URL)
        .json(&payload)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("HTTP POST failed: {}", e))?;

    // (Optional) check HTTP status
    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!(
            "Logging server returned error {}: {}",
            status,
            text
        ));
    }

    Ok(())
}

struct Engine;

#[async_trait]
impl App for Engine {
    /// Application version.
    const VERSION: Version = sdk::version_from_cargo!();

    /// Identifier of the application (used for registrations).
    /// WARNING: This might need to be changed when deploying to another instance.
    fn id() -> AppId {
        "rofl1qrhjgmyge7vuxl3h0d02jrvnl43jhwdwjyq6c943".into()
    }

    /// Return the consensus layer trust root for this runtime; if `None`, consensus layer integrity
    /// verification will not be performed (e.g. Localnet).
    // #region consensus-trust-root
    fn consensus_trust_root() -> Option<TrustRoot> {
        // The trust root below is for Sapphire Testnet at consensus height 22110615.
        // Some(TrustRoot {
        //    height: 22110615,
        //    hash: "95d1501f9cb88619050a5b422270929164ce739c5d803ed9500285b3b040985e".into(),
        //    runtime_id: "000000000000000000000000000000000000000000000000a6d1e3ebf60dff6c".into(),
        //    chain_context: "0b91b8e4e44b2003a7c5e23ddadb5e14ef5345c0ebcb3ddcae07fa2f244cab76"
        //        .to_string(),
        // })

        // For development we set this to None.
        None
    }
    // #endregion consensus-trust-root

    async fn run(self: Arc<Self>, _env: Environment<Self>) {
        let msg = "Hello, ROFL!";
        println!("{}", msg);

        if let Err(err) = post_log(msg).await {
            println!("Failed to post log: {:?}", err);
        }
    }

    async fn on_runtime_block(self: Arc<Self>, env: Environment<Self>, round: u64) {
        // This gets called for each runtime block. It will not be called again until the previous
        // invocation returns and if invocation takes multiple blocks to run, those blocks will be
        // skipped.
        if let Err(err) = self.scan_task(env, round).await {
            println!("Failed to interpret blockchain state: {:?}", err);
        }
    }
}

// fn get_event_signature() -> H256 {
//    let sig = b"MyEvent(uint256,address,uint256)";
//    H256::from_slice(&ethabi::short_signature(
//        "MyEvent",
//        &[
//            ethabi::ParamType::Uint(256),
//            ethabi::ParamType::Address,
//            ethabi::ParamType::Uint(256),
//        ],
//    ))
// }

fn get_event_abi() -> Event {
    let event = {
        let inputs = vec![
            EventParam {
                name: "id".to_owned(),
                kind: ParamType::Uint(256),
                indexed: true,
            },
            EventParam {
                name: "who".to_owned(),
                kind: ParamType::Address,
                indexed: true,
            },
            EventParam {
                name: "value".to_owned(),
                kind: ParamType::Uint(256),
                indexed: false,
            },
        ];
        Event {
            name: "MyEvent".to_owned(),
            inputs,
            anonymous: false,
        }
    };

    event
}

impl Engine {
    async fn scan_task(self: Arc<Self>, env: Environment<Self>, round: u64) -> Result<()> {
        // Scan the contract for event emissions.
        // self.scan_emits(env, round);
        //
        // self.new_transaction(method, body);
        let fn_name = "getNumber";
        let params = [];
        let function_signature = ethabi::short_signature(fn_name, &params);
        let encoded_message_id = vec![]; // ethabi::encode(values);
        let data: Vec<u8> = [function_signature.to_vec(), encoded_message_id].concat();

        let sdk_pub_key =
            secp256k1::PublicKey::from_bytes(env.signer().public_key().as_bytes()).unwrap();

        let caller = module_evm::derive_caller::from_sigspec(&SignatureAddressSpec::Secp256k1Eth(
            sdk_pub_key,
        ))
        .unwrap();

        let gas_price = module_evm::types::U256::from(100u64);

        let query: Vec<u8> = env
            .client()
            .query(
                round,
                "evm.SimulateCall",
                module_evm::types::SimulateCallQuery {
                    address: Some(CONTRACT_ADDRESS.parse().unwrap()),
                    gas_limit: 1000000,
                    gas_price,
                    value: 0.into(),
                    caller,
                    data,
                },
            )
            .await?;

        let decoded = ethabi::decode(&[ParamType::Uint(256)], &query).unwrap();
        let value = decoded[0].clone().into_uint().unwrap().as_u128();

        let fn_name = "setNumber";
        let params = [ParamType::Uint(256)];
        let function_signature = ethabi::short_signature(fn_name, &params);
        let values = [Token::Uint(ethabi::ethereum_types::U256::from(value + 1))];
        let encoded_message_id = ethabi::encode(&values);
        let data: Vec<u8> = [function_signature.to_vec(), encoded_message_id].concat();

        let mut tx = self.new_transaction(
            "evm.Call",
            module_evm::types::Call {
                address: CONTRACT_ADDRESS.parse().unwrap(),
                value: 0.into(),
                data,
            },
        );

        tx.set_fee_gas(200_000);

        env.client().sign_and_submit_tx(env.signer(), tx).await?;

        Ok(())
    }

    // async fn scan_emits(self: Arc<Self>, env: Environment<Self>, round: u64) -> Result<()> {
    //     let topic_hash = get_event_abi().signature();
    //     let contract_h160: H160 = CONTRACT_ADDRESS
    //         .parse()
    //         .expect("Invalid contract address hex");
    //     let address_hex = format!("0x{}", hex::encode(contract_h160.as_bytes()));
    //     let topic_hex = format!("0x{}", hex::encode(topic_hash.as_bytes()));
    //
    //     let filter_json = json!({
    //         "from_block": { "Height": round },
    //         "to_block":   { "Height": round },
    //         "address":    [ address_hex ],
    //         "topics":     [ [ topic_hex ] ],
    //     });
    //     let get_logs_args = json!({ "filter": filter_json });
    //     let raw_logs: Vec<serde_json::Value> = env
    //         .client()
    //         .query(round, "evm.GetLogs", get_logs_args)
    //         .await?;
    //
    //     for raw in raw_logs {
    //         // Extract block_number
    //         let block_number = raw
    //             .get("block_number")
    //             .and_then(|v| v.as_u64())
    //             .unwrap_or_default();
    //
    //         // Extract the “topics” array (Vec of hex‐strings)
    //         let topic_values = raw
    //             .get("topics")
    //             .and_then(|v| v.as_array())
    //             .unwrap_or(&vec![])
    //             .clone();
    //
    //         // Convert each topic hex string → H256
    //         let mut topics_h256: Vec<H256> = Vec::new();
    //         for hex_val in topic_values {
    //             if let Some(s) = hex_val.as_str() {
    //                 let bytes =
    //                     hex::decode(s.trim_start_matches("0x")).expect("Invalid hex in topic");
    //                 topics_h256.push(H256::from_slice(&bytes));
    //             }
    //         }
    //
    // Extract “data” (hex) into Vec<u8>
    //         let data_bytes: Vec<u8> = raw
    //             .get("data")
    //             .and_then(|v| v.as_str())
    //             .and_then(|s| hex::decode(s.trim_start_matches("0x")).ok())
    //             .unwrap_or_default();
    //
    //         // Build an ethabi::RawLog so parse_log can decode the non-indexed “value”.
    //         let raw_log = RawLog {
    //             topics: topics_h256.clone(),
    //             data: data_bytes.clone(),
    //         };
    //         let parsed = get_event_abi().parse_log(raw_log)?;
    //         let non_indexed: Vec<Token> = parsed.params.into_iter().map(|p| p.value).collect();
    //
    //         // Decode indexed “id” from topics_h256[1]
    //         let id_u256 = U256::from_big_endian(topics_h256[1].as_bytes());
    //         let id: u64 = id_u256.as_u64();
    //
    //         // Decode indexed “who” from topics_h256[2] (last 20 bytes of H256)
    //         let who_addr: H160 = H160::from_slice(&topics_h256[2].as_bytes()[12..]);
    //
    //         // Decode non-indexed “value” from non_indexed[0]
    //         let value: u128 = match &non_indexed[0] {
    //             Token::Uint(v) => v.low_u128(),
    //             _ => panic!("Expected Uint for value"),
    //         };
    //
    //         println!(
    //             "Block {:>6}: MyEvent → id = {}, who = 0x{:x}, value = {}",
    //             block_number, id, who_addr, value
    //         );
    //     }
    //
    //     Ok(())
    // }
}

struct AkaveAdapter;

fn main() {
    Engine.start();
}
