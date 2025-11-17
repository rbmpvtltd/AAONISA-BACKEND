// // upload.service.ts
// import { Injectable } from '@nestjs/common';
// import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { Readable } from 'stream';
// import { Multer } from 'multer'
// import * as fs from 'fs';
// import * as path from 'path';
// import * as mime from 'mime-types';
// @Injectable()
// export class UploadService {
//     private s3: S3Client;
//     private bucket = 'ans';

//     constructor() {
//         this.s3 = new S3Client({
//             region: 'auto',
//             endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//             credentials: {
//                 accessKeyId: process.env.CLOUDFLARE_USER_ACCESS_KEY!,
//                 secretAccessKey: process.env.CLOUDFLARE_USER_SECRET_ACCESS_KEY!,
//             },
//         });
//     }

//     /**
//      * Upload file to R2
//      * @param file Multer.File
//      * @param category stories|news|reels|profiles
//      * @param customName optional custom file name
//      */
//     async uploadFile(
//         fileOrPath: Multer.File | string,
//         category: string,
//         customName?: string,
//     ) {
//         let body: any;
//         let mimeType: string;
//         let safeName: string;

//         if (typeof fileOrPath === 'string') {
//             // Local file path -> stream
//             const filePath = fileOrPath;
//             body = fs.createReadStream(filePath);
//             mimeType = mime.lookup(filePath) || 'application/octet-stream';
//             safeName = customName || `${Date.now()}-${path.basename(filePath)}`;
//         } else {
//             // Multer file -> buffer (already in memory)
//             body = fileOrPath.buffer;
//             mimeType = fileOrPath.mimetype;
//             safeName = customName || `${Date.now()}-${fileOrPath.originalname}`;
//         }

//         const key = `${category}/${safeName}`;
//         const publicUrl = `https://pub-a258ba4c9bd54cb1b6b94b53d2d61324.r2.dev/${key}`;

//         await this.s3.send(
//             new PutObjectCommand({
//                 Bucket: this.bucket,
//                 Key: key,
//                 Body: body, // <- works with both stream and buffer
//                 ContentType: mimeType,
//             }),
//         );

//         return {
//             key,
//             url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`,
//             publicUrl,
//             contentType: mimeType,
//         };
//     }
//     /**
//      * Generate a presigned URL (default 1 hour)
//      */
//     async getFileUrl(key: string, expiresIn = 3600) {
//         const command = new GetObjectCommand({
//             Bucket: this.bucket,
//             Key: key,
//         });

//         return await getSignedUrl(this.s3, command, { expiresIn });
//     }

//     /**
//      * Download file as stream (chunks)
//      */
//     async downloadFile(key: string): Promise<Readable> {
//         const command = new GetObjectCommand({
//             Bucket: this.bucket,
//             Key: key,
//         });

//         const response: any = await this.s3.send(command);
//         return response.Body as Readable;
//     }

//     async deleteFile(key: string) {
//         if (!key) throw new Error('R2 deleteFile: Key is missing');
//         await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
//     }


// }
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { Multer } from 'multer'
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

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
     * @param fileOrPath Multer.File | string
     * @param category stories|news|reels|profiles
     * @param customName optional file name
     * @param cacheControlOverride optional override header (for profile update)
     */
    async uploadFile(
        fileOrPath: Multer.File | string,
        category: string,
        customName?: string,
        cacheControlOverride?: string
    ) {
        let body: any;
        let mimeType: string;
        let safeName: string;

        if (typeof fileOrPath === 'string') {
            const filePath = fileOrPath;
            body = fs.createReadStream(filePath);
            mimeType = mime.lookup(filePath) || 'application/octet-stream';
            safeName = customName || `${Date.now()}-${path.basename(filePath)}`;
        } else {
            body = fileOrPath.buffer;
            mimeType = fileOrPath.mimetype;
            safeName = customName || `${Date.now()}-${fileOrPath.originalname}`;
        }

        const key = `${category}/${safeName}`;

        // 🔥 Smart Cache-Control
        let cacheControl = "public, max-age=2592000"; // default 30 days

        if (category === "profiles") {
            cacheControl = "public, max-age=31536000, immutable"; // 1 year
        } else if (mimeType.includes("mp4")) {
            cacheControl = "public, max-age=2592000"; // 30 days
        } else if (mimeType.includes("image")) {
            cacheControl = "public, max-age=2592000, immutable"; // 30 days
        }

        // Override if provided (for profile update)
        if (cacheControlOverride) cacheControl = cacheControlOverride;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: mimeType,
                CacheControl: cacheControl, // ✅ caching header
            }),
        );

        return {
            key,
            url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`,
            publicUrl: `https://pub-${process.env.CF_PUBLIC_ID}.r2.dev/${key}`,
            contentType: mimeType,
            cacheControl,
        };
    }

    async getFileUrl(key: string, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return await getSignedUrl(this.s3, command, { expiresIn });
    }

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
