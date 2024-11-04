import { Request, Response } from 'express';
import { SchedulerService } from '../services/scheduler.service';
import { TaskType, TaskConfig } from '../types/scheduler.types';

export class SchedulerController {
	private readonly schedulerService: SchedulerService;

	constructor() {
		this.schedulerService = new SchedulerService();
	}

	scheduleTask = async (req: Request, res: Response): Promise<void> => {
		try {
			const { type, data, scheduledFor, config } = req.body;

			const task = await this.schedulerService.scheduleTask(
				type as TaskType,
				data,
				new Date(scheduledFor),
				config as TaskConfig,
			);

			res.status(201).json(task);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	cancelTask = async (req: Request, res: Response): Promise<void> => {
		try {
			const { jobId } = req.params;
			await this.schedulerService.cancelTask(jobId);
			res.status(200).json({ message: 'Task cancelled successfully' });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	getTaskStatus = async (req: Request, res: Response): Promise<void> => {
		try {
			const { jobId } = req.params;
			const status = await this.schedulerService.getTaskStatus(jobId);
			res.status(200).json({ status });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};
}
