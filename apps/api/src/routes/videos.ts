// import { Router } from 'express';
// import multer from 'multer';
// import { uploadVideo } from '../controllers/videos';
// import { authenticate } from '../middleware/auth';
// import { UPLOADS_DIR } from '../config/upload';
// import path from 'path';
// import crypto from 'crypto';

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOADS_DIR);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const uniqueName = crypto.randomUUID() + ext;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'video/mp4') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only mp4 files are allowed'));
//     }
//   },
// });

// const router = Router();

// // /api/videos/upload
// router.post('/upload', authenticate, upload.single('video'), uploadVideo);

// export default router;


import { Router } from 'express';
import multer from 'multer';
import { getVideos, uploadVideo } from '../controllers/videos';
import { authenticate } from '../middleware/auth';
import { UPLOADS_DIR } from '../config/upload';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = crypto.randomUUID() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only mp4 files are allowed'));
    }
  },
});

const router = Router();

router.get('/', authenticate, getVideos);
router.post('/upload', authenticate, upload.single('video'), uploadVideo);

export default router;