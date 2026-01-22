import { ethers } from "hardhat";

async function main() {
  const treasuryAddress = "0x7519b35B01928Ad077978B9096Cc7006D25f5d01";
  const resolverAddress = "0x1c110F7298a4F48613371659f4c566761c42544C";
  
  console.log("Deploying TizzyMarketFactory...");
  const Factory = await ethers.getContractFactory("TizzyMarketFactory");
  const factory = await Factory.deploy(treasuryAddress, resolverAddress);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  
  console.log("\n========== ALL DEPLOYED ==========");
  console.log("Treasury:", treasuryAddress);
  console.log("Resolver:", resolverAddress);
  console.log("Factory:", factoryAddr);
  
  const fs = await import("fs");
  fs.writeFileSync("deployed-addresses.json", JSON.stringify({
    treasury: treasuryAddress,
    resolver: resolverAddress,
    factory: factoryAddr,
    chainId: 84532,
    network: "baseSepolia"
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
