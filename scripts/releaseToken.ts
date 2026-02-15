// import hre from "hardhat";

// async function main() {
//     // 1️ Get signer accounts
//     const [owner, beneficiary] = await hre.ethers.getSigners();

//     // 2️ Vesting contract address
//     const vestingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

//     // 3️ Get contract instance (using `any` to bypass TS typing)
//     const vesting: any = await hre.ethers.getContractAt("Vesting", vestingAddress);

//     // 4️ Connect contract to beneficiary account
//     const vestingAsBeneficiary = vesting.connect(beneficiary);

//     // 5️ Check claimable tokens
//     const claimable = await vestingAsBeneficiary.vestedAmount(beneficiary.address);
//     console.log("💰 Claimable tokens:", claimable.toString());

//     if (claimable > 0n) {
//         // 6️ Release tokens
//         const tx = await vestingAsBeneficiary.release(claimable);
//         await tx.wait();
//         console.log(" Tokens released to beneficiary!");
//     } else {
//         console.log("ℹ No tokens available to release yet.");
//     }
// }

// // Run the script
// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });

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
    console.log("💰 Claimable tokens:", claimable.toString());

    if (claimable > 0n) {
        const tx = await vestingAsBeneficiary.release(claimable);
        await tx.wait();
        console.log("✅ Tokens released to beneficiary:", beneficiaryAddress);
    } else {
        console.log("ℹ No tokens available to release yet for", beneficiaryAddress);
    }
}

main().catch(console.error);
