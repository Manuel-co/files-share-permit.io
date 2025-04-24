import { NextRequest, NextResponse } from "next/server";
import permit from "@/lib/permit"; // Import the Permit SDK

const roleHierarchy = ["admin", "editor", "viewer"];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Fetch role assignments for the user on the specific file
    const response = await permit.api.roleAssignments.list({
      user: `user|${userId}`,
    });

    if (!response || !Array.isArray(response)) {
      return NextResponse.json({ error: "Invalid response structure" }, { status: 500 });
    }


   // Extract and format the required data
   const rolesData = response
   .filter((entry) => roleHierarchy.includes(entry.role)) // Only keep valid roles
   .map((entry) => ({
     fileId: entry.resource_instance?.split(":")[1] ?? "unknown", // Extract actual file ID or fallback to "unknown"
     role: entry.role,
   }));

 return NextResponse.json({ roles: rolesData }, { status: 200 });
  } catch (error) {
    console.error(`Permit API Error for file:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}