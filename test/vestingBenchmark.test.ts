import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vesting Contract Test", function () {
    let token: any;
    let vesting: any;
    let owner: string;
    let beneficiary: string;

    const ONE_MONTH = 30 * 24 * 60 * 60;
    let start: number;


    beforeEach(async function () {
        const signers = await ethers.getSigners();
        owner = await signers[0].getAddress();
        beneficiary = await signers[1].getAddress();


        const TokenFactory = await ethers.getContractFactory("MyToken");
        token = (await TokenFactory.deploy());
        await token.waitForDeployment();


        await token.mint(owner, ethers.parseUnits("1200", 18));

        const VestingFactory = await ethers.getContractFactory("Vesting");
        vesting = (await VestingFactory.deploy(token.target));
        await vesting.waitForDeployment();


        await token.transfer(vesting.target, ethers.parseUnits("1200", 18));

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
