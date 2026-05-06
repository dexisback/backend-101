import {prisma} from "../../config/prisma.js"

export interface createSplitInput {
    payeeName: string;
    amount: number ;    //we gonna use "paise" as the amount input unit
}

export const quoteEqualSplits = (totalAmount: number, participants: string[]) => {
    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
        throw new Error("totalAmount must be a positive integer (paise)");
    }
    if (!Array.isArray(participants) || participants.length === 0) {
        throw new Error("participants must be a non-empty array");
    }

    const cleanedParticipants = participants.map((p) => p.trim()).filter(Boolean);
    if (cleanedParticipants.length === 0) {
        throw new Error("participants must contain at least one non-empty name");
    }

    const n = cleanedParticipants.length;
    const base = Math.floor(totalAmount / n);
    const remainder = totalAmount % n;

    const splits: createSplitInput[] = cleanedParticipants.map((payeeName, idx) => ({
        payeeName,
        amount: base + (idx < remainder ? 1 : 0),
    }));

    return {
        totalAmount,
        participantCount: n,
        strategy: "EQUAL" as const,
        splits,
    };
};



export const createTabWithSplits = async (leaderId: string, totalAmount: number, splits: createSplitInput[])=>{
    // Prefer a single nested write (avoids interactive transaction acquisition issues)
    return prisma.tab.create({
        data: {
            leaderId,
            totalAmount,
            status: "PENDING",
            splits: {
                create: splits.map((split) => ({
                    payeeName: split.payeeName,
                    amount: split.amount,
                    // version defaults to 1
                })),
            },
        },
        include: { splits: true },
    });


}