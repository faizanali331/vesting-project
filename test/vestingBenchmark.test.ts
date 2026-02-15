import { expect } from "chai";
import { ethers } from "hardhat";
//import type { MyToken, Vesting } from "../typechain-types";

describe("Vesting Contract Test", function () {
    let token: any;
    let vesting: any;
    let owner: string;
    let beneficiary: string;

    const ONE_MONTH = 30 * 24 * 60 * 60; // seconds
    let start: number;


    beforeEach(async function () {
        const signers = await ethers.getSigners();
        owner = await signers[0].getAddress();
        beneficiary = await signers[1].getAddress();

        // Deploy MyToken
        const TokenFactory = await ethers.getContractFactory("MyToken");
        token = (await TokenFactory.deploy()); //as unknown as MyToken;
        await token.waitForDeployment();

        // Mint 1200 tokens to owner
        await token.mint(owner, ethers.parseUnits("1200", 18));

        // Deploy Vesting
        const VestingFactory = await ethers.getContractFactory("Vesting");
        vesting = (await VestingFactory.deploy(token.target)); //as unknown as Vesting;
        await vesting.waitForDeployment();

        // Transfer tokens to Vesting contract so it has balance
        await token.transfer(vesting.target, ethers.parseUnits("1200", 18));

        // Create vesting schedule
        const latestBlock = await ethers.provider.getBlock("latest");
        start = latestBlock!.timestamp;


        const cliffDuration = 4 * ONE_MONTH;
        const duration = 12 * ONE_MONTH;
        const amount = ethers.parseUnits("1200", 18);

        await vesting.createVestingSchedule(
            beneficiary,
            start,
            cliffDuration,
            duration,
            amount
        );
    });

    it("Month 3: Claimable = 0", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [start + 3 * ONE_MONTH]);
        await ethers.provider.send("evm_mine", []);

        const vested = await vesting.vestedAmount(beneficiary);
        expect(vested).to.equal(0n);
    });

    it("Month 4: Claimable = 400", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [start + 4 * ONE_MONTH]);
        await ethers.provider.send("evm_mine", []);

        const vested = await vesting.vestedAmount(beneficiary);
        const expected = ethers.parseUnits("400", 18);

        // Use closeTo to avoid tiny rounding errors
        expect(vested).to.equal(expected);

    });

    it("Month 8: Claimable = 800", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [start + 8 * ONE_MONTH]);
        await ethers.provider.send("evm_mine", []);

        const vested = await vesting.vestedAmount(beneficiary);
        const expected = ethers.parseUnits("800", 18);
        expect(vested).to.equal(expected);

    });
});
