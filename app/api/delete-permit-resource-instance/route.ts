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

    await permit.api.resourceInstances.delete(fileId);

    return NextResponse.json({ message: "Permit resource instance deleted" });
  } catch (error) {
    console.error("Permit Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete Permit resource instance" },
      { status: 500 }
    );
  }
}
