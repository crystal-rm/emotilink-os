const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting EmotiLink OS Phase 1 Deployment...");
  console.log("================================================");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, `(Chain ID: ${Number(network.chainId)})`);
  
  // Check balance using ethers.js v6 syntax
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Check if we have sufficient balance for deployment
  const minBalance = network.chainId === 1337n ? ethers.parseEther("0.1") : ethers.parseEther("0.01");
  if (balance < minBalance) {
    throw new Error(`Insufficient balance for deployment. Required: ${ethers.formatEther(minBalance)} ETH`);
  }
  
  console.log("\n📋 Phase 1 Deployment Plan:");
  console.log("1. EMOTI Token Contract");
  console.log("2. Emotion Oracle Contract");
  console.log("3. Emotion Validation Contract");
  console.log("4. Emotion Data Storage Contract");
  
  // Step 1: Deploy EMOTI Token
  console.log("\n🪙 Step 1: Deploying EMOTI Token...");
  const EMOTIToken = await ethers.getContractFactory("EMOTIToken");
  const emotiToken = await EMOTIToken.deploy();
  await emotiToken.waitForDeployment();
  const emotiTokenAddress = await emotiToken.getAddress();
  console.log("✅ EMOTI Token deployed to:", emotiTokenAddress);
  
  // Step 2: Deploy Emotion Oracle
  console.log("\n🔮 Step 2: Deploying Emotion Oracle...");
  const EmotionOracle = await ethers.getContractFactory("EmotionOracle");
  const emotionOracle = await EmotionOracle.deploy();
  await emotionOracle.waitForDeployment();
  const emotionOracleAddress = await emotionOracle.getAddress();
  console.log("✅ Emotion Oracle deployed to:", emotionOracleAddress);
  
  // Step 3: Deploy Emotion Validation
  console.log("\n✅ Step 3: Deploying Emotion Validation...");
  const EmotionValidation = await ethers.getContractFactory("EmotionValidation");
  const emotionValidation = await EmotionValidation.deploy(emotionOracleAddress);
  await emotionValidation.waitForDeployment();
  const emotionValidationAddress = await emotionValidation.getAddress();
  console.log("✅ Emotion Validation deployed to:", emotionValidationAddress);
  
  // Step 4: Deploy Emotion Data Storage
  console.log("\n💾 Step 4: Deploying Emotion Data Storage...");
  const EmotionDataStorage = await ethers.getContractFactory("EmotionDataStorage");
  const emotionDataStorage = await EmotionDataStorage.deploy(
    emotionOracleAddress,
    emotionValidationAddress
  );
  await emotionDataStorage.waitForDeployment();
  const emotionDataStorageAddress = await emotionDataStorage.getAddress();
  console.log("✅ Emotion Data Storage deployed to:", emotionDataStorageAddress);
  
  // Step 5: Configure contracts
  console.log("\n⚙️ Step 5: Configuring contracts...");
  
  // Set oracle address in EMOTI token
  await emotiToken.setOracle(emotionOracleAddress);
  console.log("✅ Set oracle address in EMOTI token");
  
  // Step 6: Verify contracts on PolygonScan (if not on local network)
  if (network.chainId !== 1337n) {
    console.log("\n🔍 Step 6: Verifying contracts on PolygonScan...");
    console.log("Waiting for block confirmations...");
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const contracts = [
      { name: "EMOTI Token", address: emotiTokenAddress, args: [] },
      { name: "Emotion Oracle", address: emotionOracleAddress, args: [] },
      { name: "Emotion Validation", address: emotionValidationAddress, args: [emotionOracleAddress] },
      { name: "Emotion Data Storage", address: emotionDataStorageAddress, args: [emotionOracleAddress, emotionValidationAddress] }
    ];
    
    for (const contract of contracts) {
      try {
        console.log(`Verifying ${contract.name}...`);
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: contract.args,
        });
        console.log(`✅ ${contract.name} verified`);
      } catch (error) {
        console.log(`❌ ${contract.name} verification failed:`, error.message);
      }
    }
  }
  
  // Step 7: Save deployment info
  console.log("\n💾 Step 7: Saving deployment information...");
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      EMOTIToken: {
        address: emotiTokenAddress,
        transactionHash: emotiToken.deploymentTransaction().hash,
      },
      EmotionOracle: {
        address: emotionOracleAddress,
        transactionHash: emotionOracle.deploymentTransaction().hash,
      },
      EmotionValidation: {
        address: emotionValidationAddress,
        transactionHash: emotionValidation.deploymentTransaction().hash,
      },
      EmotionDataStorage: {
        address: emotionDataStorageAddress,
        transactionHash: emotionDataStorage.deploymentTransaction().hash,
      }
    }
  };
  
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(
    deploymentsDir,
    `phase1-${network.name}-${Number(network.chainId)}.json`
  );
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentFile}`);
  
  // Step 8: Display summary
  console.log("\n🎉 PHASE 1 DEPLOYMENT COMPLETE!");
  console.log("=================================");
  console.log("Network:", network.name, `(Chain ID: ${Number(network.chainId)})`);
  console.log("Deployer:", deployer.address);
  console.log("\n📋 Contract Addresses:");
  console.log("======================");
  console.log("🪙 EMOTI Token:", emotiTokenAddress);
  console.log("🔮 Emotion Oracle:", emotionOracleAddress);
  console.log("✅ Emotion Validation:", emotionValidationAddress);
  console.log("💾 Emotion Data Storage:", emotionDataStorageAddress);
  
  console.log("\n🚀 NEXT STEPS:");
  console.log("==============");
  console.log("1. Update your .env file with the contract addresses");
  console.log("2. Test the contracts using the test scripts");
  console.log("3. Deploy to mainnet when ready");
  console.log("4. Update frontend configuration");
  
  console.log("\n📚 PHASE 1 FEATURES:");
  console.log("====================");
  console.log("• Basic EMOTI Token (ERC20)");
  console.log("• Emotion Data Submission");
  console.log("• Validator Registration & Staking");
  console.log("• Data Validation System");
  console.log("• Secure Data Storage");
  console.log("• Basic Analytics");
  
  console.log("\n✨ EmotiLink OS Phase 1 Complete! ✨");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });