import { s3, bucketName } from "./aws.js";
import { getSignedUrl as cloudfrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import path from 'path';
import fs from 'fs';

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
