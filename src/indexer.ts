import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { getDb } from "./db";
// import { VestingEntity } from "../src/entity/VestingEntity";
// import { ReleaseEntity } from "../src/entity/ReleaseEntity";

dotenv.config();

// Connect to Ethereum provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const vestingAddress = process.env.VESTING_ADDRESS!;


const abi = [
    "event VestingScheduleCreated(address indexed beneficiary,uint256 start,uint256 cliff,uint256 duration,uint256 amount)",
    "event TokenReleased(address indexed beneficiary,uint256 amount)"
];

const contract = new ethers.Contract(vestingAddress, abi, provider);

// Handle VestingScheduleCreated event
async function handleVestingCreated(
    beneficiary: string,
    start: ethers.BigNumberish,
    cliff: ethers.BigNumberish,
    duration: ethers.BigNumberish,
    amount: ethers.BigNumberish,
    event: { transactionHash: string | null; blockNumber: number | null }
) {
    const db = await getDb();

    await db.execute(
        `INSERT INTO vesting 
        (beneficiary, start, cliff, duration, amount, claimed, tx_hash, block_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            beneficiary?.toLowerCase() ?? null,
            start?.toString() ?? "0",
            cliff?.toString() ?? "0",
            duration?.toString() ?? "0",
            amount?.toString() ?? "0",
            "0",
            event.transactionHash ?? null,
            event.blockNumber ?? null
        ]
    );

    await db.end();
    console.log(" New vesting stored:", beneficiary);
}

// Handle TokenReleased event
async function handleTokenReleased(
    beneficiary: string,
    amount: ethers.BigNumberish,
    event: { transactionHash: string | null; blockNumber: number | null }
) {
    const db = await getDb();
    await db.execute(
        `UPDATE vesting SET claimed = CAST(claimed AS DECIMAL(65,0)) + ? WHERE beneficiary = ?`,
        [amount?.toString() ?? "0", beneficiary?.toLowerCase() ?? null]
    );

    await db.execute(
        `INSERT INTO \`release\` (beneficiary, amount, tx_hash, block_number) VALUES (?, ?, ?, ?)`,
        [
            beneficiary?.toLowerCase() ?? null,
            amount?.toString() ?? "0",
            event.transactionHash ?? null,
            event.blockNumber ?? null
        ]
    );

    await db.end();
    console.log(" Tokens released:", beneficiary);
}

async function main() {
    console.log(" Syncing past events...");

    const currentBlock = await provider.getBlockNumber();

    const createdEvents = await contract.queryFilter("VestingScheduleCreated", 0, currentBlock);
    for (const e of createdEvents) {
        const ev: any = e; // cast to any
        const args = ev.args ?? [];
        const [beneficiary, start, cliff, duration, amount] = args;
        await handleVestingCreated(
            beneficiary,
            start,
            cliff,
            duration,
            amount,
            { transactionHash: ev.transactionHash ?? null, blockNumber: ev.blockNumber ?? null }
        );
    }

    // Backfill past TokenReleased events
    const releasedEvents = await contract.queryFilter("TokenReleased", 0, currentBlock);
    for (const e of releasedEvents) {
        const ev: any = e;
        const args = ev.args ?? [];
        const [beneficiary, amount] = args;
        await handleTokenReleased(
            beneficiary,
            amount,
            { transactionHash: ev.transactionHash ?? null, blockNumber: ev.blockNumber ?? null }
        );
    }

    console.log(" Backfill complete. Listening for new events...");

    // Listen for new events
    // contract.on("VestingScheduleCreated", async (beneficiary, start, cliff, duration, amount, ev) => {
    //     await handleVestingCreated(
    //         beneficiary,
    //         start,
    //         cliff,
    //         duration,
    //         amount,
    //         { transactionHash: ev?.transactionHash ?? null, blockNumber: ev?.blockNumber ?? null }
    //     );
    // });

    contract.on("VestingScheduleCreated", async (beneficiary, start, cliff, duration, amount, ev) => {
        await handleVestingCreated(
            beneficiary,
            start,
            cliff,
            duration,
            amount,
            {
                transactionHash: ev?.log?.transactionHash ?? null,
                blockNumber: ev?.log?.blockNumber ?? null
            }
        );
    });

    // contract.on("TokenReleased", async (beneficiary, amount, ev) => {
    //     await handleTokenReleased(
    //         beneficiary,
    //         amount,
    //         { transactionHash: ev?.transactionHash ?? null, blockNumber: ev?.blockNumber ?? null }
    //     );
    // });

    contract.on("TokenReleased", async (beneficiary, amount, ev) => {
        await handleTokenReleased(
            beneficiary,
            amount,
            {
                transactionHash: ev?.log?.transactionHash ?? null,
                blockNumber: ev?.log?.blockNumber ?? null
            }
        );
    });
}

main().catch(console.error);
