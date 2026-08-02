import { NextResponse } from 'next/server';
import {
  deviceIdFromRequest,
  getDeviceQuotaSnapshot,
} from '@/lib/ai-quota';

export async function GET(req: Request) {
  const deviceId = deviceIdFromRequest(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  }

  const snapshot = await getDeviceQuotaSnapshot(deviceId);
  return NextResponse.json(snapshot);
}
