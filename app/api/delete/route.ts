import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "File URL is required" }), {
        status: 400,
      });
    }

    const fileKey = fileUrl.split(".amazonaws.com/")[1];
    if (!fileKey) {
      return new Response(JSON.stringify({ error: "Invalid file URL" }), {
        status: 400,
      });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: fileKey,
      })
    );

    return new Response(
      JSON.stringify({ message: "File deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("S3 Delete Error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete file" }), {
      status: 500,
    });
  }
}
