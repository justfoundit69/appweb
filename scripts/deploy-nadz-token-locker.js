import hre from "hardhat";

async function main() {
  const feeRecipient = process.env.FEE_RECIPIENT || "0x0000000000000000000000000000000000000000";
  const feeAmount = process.env.FEE_AMOUNT || "50000000000000000000";

  if (feeRecipient === "0x0000000000000000000000000000000000000000") {
    throw new Error("Please set FEE_RECIPIENT environment variable");
  }

  console.log("Deploying NadzTokenLocker...");
  console.log("Fee Recipient:", feeRecipient);
  console.log("Fee Amount:", feeAmount, "wei");

  const NadzTokenLocker = await hre.ethers.getContractFactory("NadzTokenLocker");
  const nadzTokenLocker = await NadzTokenLocker.deploy(feeRecipient, feeAmount);

  await nadzTokenLocker.waitForDeployment();

  const address = await nadzTokenLocker.getAddress();
  console.log("NadzTokenLocker deployed to:", address);
  console.log("\nSet this in your .env file:");
  console.log(`NEXT_PUBLIC_TOKEN_LOCKER=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


