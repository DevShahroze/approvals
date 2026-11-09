import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";

export async function GET(request) {
  try {
    const { user, profile } = await getRequestProfile(request);
    return NextResponse.json({ user: { uid: user.uid, email: user.email }, profile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
