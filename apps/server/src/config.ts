const isProduction = process.env.NODE_ENV === "production";

function jwtSecret(): string {
  const value = process.env.JWT_SECRET;
  if (value) return value;
  if (isProduction) throw new Error("JWT_SECRET must be set in production");
  console.warn("JWT_SECRET is not set, using an insecure development default");
  return "dev-secret-change-me";
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtSecret: jwtSecret(),
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "auto",
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicUrl: process.env.S3_PUBLIC_URL,
  },
};
