import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { credits } from '@/models/Schema';

export async function GET() {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const result = await db
    .select({
      balance: credits.balance,
      reserved: credits.reserved,
    })
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // User doesn't have credits record yet (webhook may not have fired)
    return NextResponse.json({
      balance: '0.00',
      reserved: '0.00',
      available: '0.00',
    });
  }

  const { balance, reserved } = result[0]!;
  const balanceNum = Number.parseFloat(balance);
  const reservedNum = Number.parseFloat(reserved);
  const available = (balanceNum - reservedNum).toFixed(2);

  return NextResponse.json({
    balance,
    reserved,
    available,
  });
}
