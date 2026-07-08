import hre from "hardhat";

async function main() {
  const feeRecipient = process.env.FEE_RECIPIENT || "0x0000000000000000000000000000000000000000";
  const feeAmount = process.env.FEE_AMOUNT || "50000000000000000000";

  if (feeRecipient === "0x0000000000000000000000000000000000000000") {
    throw new Error("Please set FEE_RECIPIENT environment variable");
  }

  console.log("Deploying NadzTokenFactory...");
  console.log("Fee Recipient:", feeRecipient);
  console.log("Fee Amount:", feeAmount, "wei");

  const NadzTokenFactory = await hre.ethers.getContractFactory("NadzTokenFactory");
  const nadzTokenFactory = await NadzTokenFactory.deploy(feeRecipient, feeAmount);

  await nadzTokenFactory.waitForDeployment();

  const address = await nadzTokenFactory.getAddress();
  console.log("NadzTokenFactory deployed to:", address);
  console.log("\nSet this in your .env file:");
  console.log(`NEXT_PUBLIC_TOKEN_FACTORY=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

