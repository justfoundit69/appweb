import { network } from "hardhat";

const feeRecipient = process.env.FEE_RECIPIENT;
const feeAmount = process.env.FEE_AMOUNT ?? "2350000000000000";

if (!feeRecipient || !/^0x[a-fA-F0-9]{40}$/.test(feeRecipient)) {
  throw new Error("Set FEE_RECIPIENT to a valid 0x address");
}

const { ethers } = await network.create({
  network: "robinhood",
  chainType: "l1",
});

console.log("Deploying ChestFiTokenFactory...");
console.log("Fee recipient:", feeRecipient);
console.log("Fee amount:", feeAmount, "wei");

const factory = await ethers.deployContract("ChestFiTokenFactory", [
  feeRecipient,
  BigInt(feeAmount),
]);

await factory.waitForDeployment();

const address = await factory.getAddress();
const deploymentTx = factory.deploymentTransaction();
const receipt = deploymentTx ? await deploymentTx.wait() : null;

console.log("ChestFiTokenFactory deployed to:", address);
if (receipt) {
  console.log("Deployment block:", receipt.blockNumber);
}

console.log("\nSet this in Vercel/local env:");
console.log(`NEXT_PUBLIC_TOKEN_FACTORY=${address}`);
