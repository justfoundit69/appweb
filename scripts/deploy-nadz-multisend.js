import hre from "hardhat";

async function main() {
  const feeRecipient = process.env.FEE_RECIPIENT || "0x0000000000000000000000000000000000000000";
  const feeAmount = process.env.FEE_AMOUNT || "50000000000000000000";

  if (feeRecipient === "0x0000000000000000000000000000000000000000") {
    throw new Error("Please set FEE_RECIPIENT environment variable");
  }

  console.log("Deploying NadzMultiSend...");
  console.log("Fee Recipient:", feeRecipient);
  console.log("Fee Amount:", feeAmount, "wei");

  const NadzMultiSend = await hre.ethers.getContractFactory("NadzMultiSend");
  const nadzMultiSend = await NadzMultiSend.deploy(feeRecipient, feeAmount);

  await nadzMultiSend.waitForDeployment();

  const address = await nadzMultiSend.getAddress();
  console.log("NadzMultiSend deployed to:", address);
  console.log("\nSet this in your .env file:");
  console.log(`NEXT_PUBLIC_MULTISEND=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

