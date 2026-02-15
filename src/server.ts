import express from "express";
import { getDb } from "./db";
import * as dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/vesting-status/:address", async (req, res) => {
    const address = req.params.address.toLowerCase();
    const db = await getDb();

    const [rows]: any = await db.execute(`SELECT * FROM vesting WHERE beneficiary = ?`, [address]);

    if (!rows.length) {
        await db.end();
        return res.json({ totalLocked: "0", claimable: "0", nextUnlockIn: 0 });
    }

    const now = Math.floor(Date.now() / 1000);
    let totalAmount = 0n;
    let totalClaimable = 0n;
    let nextUnlockIn = 0;

    for (const v of rows) {
        const start = BigInt(v.start);
        const cliff = BigInt(v.cliff);
        const duration = BigInt(v.duration);
        const amount = BigInt(v.amount);
        const claimed = BigInt(v.claimed);

        totalAmount += amount;

        if (BigInt(now) < cliff) {
            nextUnlockIn = Number(cliff - BigInt(now));
            continue;
        }

        const elapsed = BigInt(Math.min(Number(now - Number(start)), Number(duration)));
        const vested = (amount * elapsed) / duration;
        const claimable = vested - claimed;
        totalClaimable += claimable;

        const remaining = duration - elapsed;
        if (remaining > 0) nextUnlockIn = Number(remaining);
    }

    await db.end();

    res.json({
        totalLocked: totalAmount.toString(),
        claimable: totalClaimable.toString(),
        nextUnlockIn
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
