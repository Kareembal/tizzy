import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  console.log("\n1. Deploying TizzyTreasury...");
  const Treasury = await ethers.getContractFactory("TizzyTreasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury:", await treasury.getAddress());

  console.log("\n2. Deploying TizzyResolver...");
  const Resolver = await ethers.getContractFactory("TizzyResolver");
  const resolver = await Resolver.deploy();
  await resolver.waitForDeployment();
  console.log("Resolver:", await resolver.getAddress());

  console.log("\n3. Deploying TizzyMarketFactory...");
  const Factory = await ethers.getContractFactory("TizzyMarketFactory");
  const factory = await Factory.deploy(await treasury.getAddress(), await resolver.getAddress());
  await factory.waitForDeployment();
  console.log("Factory:", await factory.getAddress());

  console.log("\n========== DEPLOYED ==========");
  console.log("Treasury:", await treasury.getAddress());
  console.log("Resolver:", await resolver.getAddress());  
  console.log("Factory:", await factory.getAddress());
  
  const fs = await import("fs");
  fs.writeFileSync("deployed-addresses.json", JSON.stringify({
    treasury: await treasury.getAddress(),
    resolver: await resolver.getAddress(),
    factory: await factory.getAddress(),
    chainId: 84532,
    network: "baseSepolia"
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
