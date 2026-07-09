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

console.log("Deploying ChestFiTokenLocker...");
console.log("Fee recipient:", feeRecipient);
console.log("Fee amount:", feeAmount, "wei");

const locker = await ethers.deployContract("ChestFiTokenLocker", [
  feeRecipient,
  BigInt(feeAmount),
]);

await locker.waitForDeployment();

const address = await locker.getAddress();
const deploymentTx = locker.deploymentTransaction();
const receipt = deploymentTx ? await deploymentTx.wait() : null;

console.log("ChestFiTokenLocker deployed to:", address);
if (receipt) {
  console.log("Deployment block:", receipt.blockNumber);
}

console.log("\nSet these in Vercel/local env:");
console.log(`NEXT_PUBLIC_TOKEN_LOCKER=${address}`);
if (receipt) {
  console.log(`NEXT_PUBLIC_TOKEN_LOCKER_DEPLOY_BLOCK=${receipt.blockNumber}`);
}
