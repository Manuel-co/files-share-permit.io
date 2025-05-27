import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { fileType, userId } = await req.json();
    if (!fileType || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing file type or user ID" }),
        { status: 400 }
      );
    }

    const fileKey = `uploads/${userId}/${uuidv4()}.${fileType.split("/")[1]}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      ContentType: fileType,
    };

    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand(params), {
      expiresIn: 60,
    });

    return new Response(JSON.stringify({ uploadUrl, fileKey }), {
      status: 200,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate upload URL" }),
      { status: 500 }
    );
  }
}
