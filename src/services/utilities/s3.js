import { s3, bucketName } from "./aws.js";
import { getSignedUrl as cloudfrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

import {
    
    PutObjectCommand,
    
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


export const generateUploadFileUrl = async (path) => {
	try {
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: path,
			ContentType: "application/octet-stream",
		});
		const url = await getSignedUrl(s3, command, { expiresIn: 60 });
		return url;
	} catch (error) {
		throw new Error(`Failed to generate the upload URL: ${error.message}`);
	}
};



export async function generateSignedCloudfrontUrl(s3Path,expiryTime) {
	try {
		const privateKeyPath = path.join(process.cwd(), 'keys' ,`${process.env.AWS_S3_CLOUDFRONT_PRIVATE_KEY_NAME}`);
		const privateKey = await fs.readFileSync(privateKeyPath, "utf-8");

		const cloudfrontBaseUrl = process.env.AWS_S3_CLOUDFRONT_BASE_URL;
		const passphrase = process.env.AWS_S3_CLOUDFRONT_PASSPHRASE;

		const keyPairId = process.env.AWS_S3_CLOUDFRONT_KEY_ID;

		const url = `${cloudfrontBaseUrl}/${s3Path}`;

		const dateLessThan = expiryTime

		const signedUrl = await cloudfrontSignedUrl({
			url,
			keyPairId,
			dateLessThan,
			privateKey,
			passphrase,
		});

		return signedUrl;
	} catch (error) {
		throw error;
	}
}

export const uploadToS3 = async (file, userId, propertyId) => {
	try {
		const folderPath = `docx/${userId}/${propertyId}`;
		
		// Compress using sharp (decent quality)
		let compressedBuffer = await sharp(file.buffer)
			.jpeg({ quality: 80 })
			.toBuffer();

		let sizeInMB = compressedBuffer.length / (1024 * 1024);
		if (sizeInMB > 2) {
			compressedBuffer = await sharp(compressedBuffer)
				.jpeg({ quality: 60 })
				.toBuffer();
		}

		const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
		const s3Path = `${folderPath}/${fileName}`;

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: s3Path,
			Body: compressedBuffer,
			ContentType: "image/jpeg",
		});

		await s3.send(command);
		return `${process.env.AWS_S3_CLOUDFRONT_BASE_URL}/${s3Path}`;
	} catch (error) {
		throw new Error(`S3 upload failed: ${error.message}`);
	}
};
