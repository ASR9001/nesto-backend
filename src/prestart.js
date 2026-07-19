import dotenv from 'dotenv';
import { DopplerSDK } from '@dopplerhq/node-sdk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';

// Load root .env file containing Doppler access token
dotenv.config();

const currDir = process.cwd();
const ENV = process.env.BACKEND_ENV || 'dev';
global.ENV = ENV;

const envPath = path.join(currDir, `.env.${ENV}`);

const DOPPLER_PROJECT = process.env.DOPPLER_PROJECT || 'nesto-backend';
const DOPPLER_CONFIG = `${ENV}_backend`;

const doppler = new DopplerSDK({
	accessToken: process.env.DOPPLERSDK_ACCESS_TOKEN,
});

export async function updateEnvFile() {
	try {
		console.log(`[Prestart] Fetching secrets from Doppler for project: ${DOPPLER_PROJECT}, config: ${DOPPLER_CONFIG}`);
		
		// Download secrets as JSON
		const envAsJson = await doppler.secrets.download(
			DOPPLER_PROJECT,
			DOPPLER_CONFIG,
			{ format: "json" },
		);

		// Apply to current process.env so S3Client can use it immediately
		for (const [key, value] of Object.entries(envAsJson)) {
			process.env[key] = value;
		}

		const envEntries = Object.entries(envAsJson)
			.map(([key, value]) => `${key.toUpperCase().replace(/\s+/g, "_")}=${value}`)
			.join("\n");

		// Overwrite the file with fresh Doppler secrets
		fs.writeFileSync(envPath, envEntries, "utf8");
		console.log(`[Prestart] Freshly wrote all secrets from Doppler to ${envPath}`);
	} catch (error) {
		console.error(`[Prestart] Error updating the env file:`, error);
		throw error;
	}
}

export async function downloadS3Keys() {
	try {
		const keysDir = path.join(currDir, "keys");
		if (fs.existsSync(keysDir)) {
			console.log("[Prestart] Deleting existing keys directory to ensure fresh fetch...");
			fs.rmSync(keysDir, { recursive: true, force: true });
		}
		fs.mkdirSync(keysDir, { recursive: true });

		// List of keys to download
		const cloudfrontPrivateKeyName = process.env.AWS_S3_CLOUDFRONT_PRIVATE_KEY_NAME || 'cloudfront-private-key.pem';
		const firebaseServiceAccountName = process.env.FIREBASE_SERVICE_ACCOUNT || 'nexofirebase.json';

		const keys = {};
		if (cloudfrontPrivateKeyName) {
			keys.cloudfrontPrivateKey = `${ENV}/private/config/${cloudfrontPrivateKeyName}`;
		}
		if (firebaseServiceAccountName) {
			keys.firebaseServiceAccount = `${ENV}/private/config/${firebaseServiceAccountName}`;
		}

		const s3 = new S3Client({
			region: process.env.AWS_S3_REGION,
			credentials: {
				accessKeyId: process.env.AWS_S3_KEY,
				secretAccessKey: process.env.AWS_S3_SECRET,
			},
		});

		console.log("[Prestart] Downloading keys from AWS S3...");

		for (const [key, s3Path] of Object.entries(keys)) {
			const fileName = s3Path.split("/").pop();
			const localFilePath = path.join(keysDir, fileName);

			console.log(`[Prestart] Downloading S3 key: ${s3Path} -> ${localFilePath}`);
			
			const command = new GetObjectCommand({
				Bucket: process.env.AWS_S3_BUCKET_NAME,
				Key: s3Path,
			});

			const response = await s3.send(command);
			const writeStream = fs.createWriteStream(localFilePath);
			
			await new Promise((resolve, reject) => {
				response.Body.pipe(writeStream);
				writeStream.on("finish", resolve);
				writeStream.on("error", reject);
			});
			
			console.log(`[Prestart] Successfully downloaded ${fileName}`);
		}
	} catch (error) {
		console.error("[Prestart] Error downloading keys from AWS S3:", error);
		throw error;
	}
}

if (process.env.DOPPLERSDK_ACCESS_TOKEN) {
	(async () => {
		try {
			await updateEnvFile();
			await downloadS3Keys();
			console.log("[Prestart] Setup completed successfully!");
		} catch (err) {
			console.error("[Prestart] Setup failed:", err);
			process.exit(1);
		}
	})();
} else {
	console.warn("[Prestart] DOPPLERSDK_ACCESS_TOKEN not found in root .env. Skipping Doppler & AWS key fetch.");
}
