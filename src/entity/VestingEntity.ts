export interface VestingEntity {
    beneficiary: string;
    start: string;
    cliff: string;
    duration: string;
    amount: string;
    claimed: string;
    tx_hash: string;
    block_number: number;
}
