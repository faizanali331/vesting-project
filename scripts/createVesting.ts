import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import tokenArtifact from "../artifacts/contracts/MyToken.sol/MyToken.json";
import vestingArtifact from "../artifacts/contracts/Vesting.sol/Vesting.json";

async function main() {

    const [owner, beneficiary]: Signer[] = await ethers.getSigners();

    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const vestingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const token: Contract = new ethers.Contract(tokenAddress, tokenArtifact.abi, owner);
    const vesting: Contract = new ethers.Contract(vestingAddress, vestingArtifact.abi, owner);

    const amount = ethers.parseUnits("1000", 18);

    console.log("Approving tokens for vesting contract...");
    const approveTx = await token.approve(vestingAddress, amount);
    await approveTx.wait();
    console.log(" Approved");

    console.log("Transferring tokens to vesting contract...");
    const transferTx = await token.transfer(vestingAddress, amount);
    await transferTx.wait();
    console.log(" Transfer successful");

    const now = Math.floor(Date.now() / 1000) + 10;
    const cliff = 60;
    const duration = 600;

    console.log("Creating vesting schedule...");
    const tx = await vesting.createVestingSchedule(
        await beneficiary.getAddress(),
        now,
        cliff,
        duration,
        amount
    );
    await tx.wait();
    console.log(" Vesting schedule created");


    const ownerBalance = await token.balanceOf(await owner.getAddress());
    const beneficiaryBalance = await token.balanceOf(await beneficiary.getAddress());
    console.log("Owner balance:", ethers.formatUnits(ownerBalance, 18));
    console.log("Beneficiary balance:", ethers.formatUnits(beneficiaryBalance, 18));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
