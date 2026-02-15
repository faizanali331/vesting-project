import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy Token
    const Token = await hre.ethers.getContractFactory("MyToken");
    const token = await Token.deploy({ gasLimit: 5_000_000 });
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed at:", tokenAddress);

    // Deploy Vesting contract
    const Vesting = await hre.ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(tokenAddress, { gasLimit: 5_000_000 });
    await vesting.waitForDeployment();
    const vestingAddress = await vesting.getAddress();
    console.log("Vesting deployed at:", vestingAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
