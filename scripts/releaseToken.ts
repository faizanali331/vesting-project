
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const signers = await hre.ethers.getSigners();

    const vestingAddress = process.env.VESTING_ADDRESS!;
    const beneficiaryIndex = parseInt(process.env.BENEFICIARY_INDEX || "1", 10);

    if (beneficiaryIndex >= signers.length) {
        throw new Error(`BENEFICIARY_INDEX ${beneficiaryIndex} is out of range of available signers.`);
    }

    const beneficiary = signers[beneficiaryIndex];
    const vesting: any = await hre.ethers.getContractAt("Vesting", vestingAddress);

    // Connect contract to the chosen beneficiary
    const vestingAsBeneficiary = vesting.connect(beneficiary);

    const beneficiaryAddress = await beneficiary.getAddress();
    const claimable = await vesting.vestedAmount(beneficiaryAddress);
    console.log(" Claimable tokens:", claimable.toString());

    if (claimable > 0n) {
        const tx = await vestingAsBeneficiary.release(claimable);
        await tx.wait();
        console.log(" Tokens released to beneficiary:", beneficiaryAddress);
    } else {
        console.log("ℹ No tokens available to release yet for", beneficiaryAddress);
    }
}

main().catch(console.error);
