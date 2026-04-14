import { Router } from 'express';
import { getLargeMediaStatus, getUploadSignature } from './largeFile.controller.js';



const router = Router();

router.get('/signature', getUploadSignature);
router.get('/status/:mediaId', getLargeMediaStatus);

export default router;
