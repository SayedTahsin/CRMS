import { S3Client } from "@aws-sdk/client-s3"

export const supabase = new S3Client({
  forcePathStyle: true,
  region: process.env.region || "",
  endpoint: process.env.endpoint_url || "",
  credentials: {
    accessKeyId: process.env.aws_access_key_id || "",
    secretAccessKey: process.env.aws_secret_access_key || "",
  },
})
