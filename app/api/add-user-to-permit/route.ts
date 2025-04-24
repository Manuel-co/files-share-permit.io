import permit from "@/lib/permit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, role, fileId } = await req.json();

    if (!email || !role || !fileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = `user|${email}`;

    // Step 1: Ensure the user exists in Permit.io
    try {
      await permit.api.users.get(userId);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User does not exist, so create them
        await permit.api.users.create({
          key: userId,
          email,
          attributes: {},
        });
      } else {
        throw error; // If error is not a 404, rethrow it
      }
    }

    // Step 2: Assign the user to the file resource instance
    await permit.api.roleAssignments.assign({
      user: userId,
      role,
      tenant: "default",
      resource_instance: `file-share:${fileId}`,
    });

    return NextResponse.json(
      { message: "User assigned successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Permit.io Error:", error);
    return NextResponse.json(
      { error: "Failed to assign user" },
      { status: 500 }
    );
  }
}
