import permit from "@/lib/permit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    console.log("this is fileId", fileId);

    const result = await permit.api.resourceInstances.create({
      key: fileId,
      resource: "file-share",
      tenant: "default",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
