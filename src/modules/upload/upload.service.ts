// upload.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { Multer } from 'multer'
@Injectable()
export class UploadService {
    private s3: S3Client;
    private bucket = 'ans';

    constructor() {
        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_USER_ACCESS_KEY!,
                secretAccessKey: process.env.CLOUDFLARE_USER_SECRET_ACCESS_KEY!,
            },
        });
    }

    /**
     * Upload file to R2
     * @param file Multer.File
     * @param category stories|news|reels|profiles
     * @param customName optional custom file name
     */
    async uploadFile(file: Multer.File, category: string, customName?: string) {
        const safeName = customName || `${Date.now()}-${file.originalname}`;
        const key = `${category}/${safeName}`;
        const publicUrl = `https://pub-a258ba4c9bd54cb1b6b94b53d2d61324.r2.dev/${key}`;
        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );

        return {
            key,
            url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`,
            publicUrl,
            size: file.size,
            contentType: file.mimetype,
        };
    }

    /**
     * Generate a presigned URL (default 1 hour)
     */
    async getFileUrl(key: string, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return await getSignedUrl(this.s3, command, { expiresIn });
    }

    /**
     * Download file as stream (chunks)
     */
    async downloadFile(key: string): Promise<Readable> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        const response: any = await this.s3.send(command);
        return response.Body as Readable;
    }

    async deleteFile(key: string) {
        if (!key) throw new Error('R2 deleteFile: Key is missing');
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }


}
