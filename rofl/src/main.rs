use async_trait::async_trait;
use oasis_runtime_sdk::modules::rofl::app::prelude::*;

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
        println!("Booting Engine!");
    }

    async fn on_runtime_block(self: Arc<Self>, env: Environment<Self>, _round: u64) {
        // This gets called for each runtime block. It will not be called again until the previous
        // invocation returns and if invocation takes multiple blocks to run, those blocks will be
        // skipped.
        if let Err(err) = self.scan_task(env).await {
            println!("Failed to interpret blockchain state: {:?}", err);
        }
    }
}

impl Engine {
    async fn scan_task(self: Arc<Self>, env: Environment<Self>) -> Result<()> {
        // Scan the contract for event emissions.
        Ok(())
    }
}

struct AkaveAdapter;

fn main() {
    Engine.start();
}
