import { Router } from 'express';
import { SchedulerController } from '../controllers/schedular.controller';

const router = Router();
const schedulerController = new SchedulerController();

router.post('/tasks', schedulerController.scheduleTask);
router.delete('/tasks/:jobId', schedulerController.cancelTask);
router.get('/tasks/:jobId', schedulerController.getTaskStatus);

export default router;
