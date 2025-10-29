import dotenv from 'dotenv';
dotenv.config();

import { S3Client } from '@aws-sdk/client-s3';


console.log("AWS region:", process.env.AWS_S3_REGION);
console.log("AWS cococ region:");

export const s3 = new S3Client({
	region: process.env.AWS_S3_REGION,
	credentials: {
		accessKeyId: process.env.AWS_S3_KEY,
		secretAccessKey: process.env.AWS_S3_SECRET,
	},
});


export const bucketName = process.env.AWS_S3_BUCKET_NAME;


