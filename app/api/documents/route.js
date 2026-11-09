import { NextResponse } from "next/server";
import { getRequestProfile } from "@/lib/auth/api";
import { Document } from "@/lib/db/models";
import { paginate } from "@/lib/utils";

export async function GET(request) {
  try {
    const { profile } = await getRequestProfile(request);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const type = searchParams.get("type");

    const filter = { userId: profile._id };
    if (type) filter.type = type;

    const query = Document.find(filter).sort({ version: -1, createdAt: -1 });
    const [documents, total] = await Promise.all([
      paginate(query, { page, limit: 20 }),
      Document.countDocuments(filter),
    ]);

    return NextResponse.json({ documents, total });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
