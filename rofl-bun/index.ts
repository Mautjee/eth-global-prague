// Install ethers via: bun add ether
import { ethers } from "ethers";

// // Replace with your own WebSocket endpoint (e.g. Infura, Alchemy, QuickNode, etc.)
// const WEBSOCKET_RPC = "wss://mainnet.infura.io/ws/v3/YOUR_INFURA_PROJECT_ID";

// // Create a WebSocket provider
// const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_RPC);

// provider.on("block", async (blockNumber) => {
//   try {
//     console.log(`📬 New block received: ${blockNumber}`);

//     // (Optional) Fetch full block data if you need more than just the number
//     const block = await provider.getBlock(blockNumber);
//     console.log({
//       hash: block.hash,
//       timestamp: new Date(block.timestamp * 1000).toISOString(),
//       miner: block.miner,
//       transactionCount: block.transactions.length,
//     });
//     console.log("––––––––––––––––––––––––––––––––––––––");
//   } catch (err) {
//     console.error("Error fetching block data:", err);
//   }
// });

// provider._websocket.on("error", (err) => {
//   console.error("WebSocket Error:", err);
// });

// provider._websocket.on("close", (code) => {
//   console.warn(`WebSocket closed (code: ${code}), attempting to reconnect in 3s…`);
//   setTimeout(() => provider._websocket.connect(), 3000);
// });

// Keep the process alive
console.log("⛓️  Listening for new Ethereum blocks…");