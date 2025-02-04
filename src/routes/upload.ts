import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import crypto from 'crypto';
import cors from 'cors';

dotenv.config();

const router = express.Router();
router.use(cors({ origin: '*' }));

// ✅ Configure Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ✅ Handle Image Upload API
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { restaurantName, itemName } = req.body;

    if (!restaurantName || !itemName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const sanitizedRestaurantName = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedItemName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const uniqueFileName = `${sanitizedRestaurantName}/${sanitizedItemName}-${crypto.randomUUID()}${req.file.originalname.substring(req.file.originalname.lastIndexOf('.'))}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFileName,
      Body: req.file.buffer, // ✅ Correctly handle file buffer
      ContentType: req.file.mimetype,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(uploadCommand);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    res.json({ success: true, fileUrl });
  } catch (error) {
    console.error('S3 Upload Error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

export default router;
