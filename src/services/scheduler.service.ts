import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { redisConfig } from '../config/redis.config';
import {
	TaskType,
	TaskStatus,
	BaseTaskData,
	TaskConfig,
	ScheduledTask,
} from '../types/scheduler.types';
import { EmailTaskHandler } from './task-handlers/email.handler';
import { EventEmitter } from 'events';
import { BaseTaskHandler } from './task-handlers/base.handler';

export class SchedulerService {
	private readonly queue: Queue;
	private worker!: Worker;
	private readonly queueEvents: QueueEvents;
	private readonly events: EventEmitter;
	private taskHandlers!: Map<TaskType, BaseTaskHandler<any>>;

	constructor() {
		this.queue = new Queue('scheduledTasks', {
			connection: redisConfig,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 1000,
				},
			},
		});

		this.queueEvents = new QueueEvents('scheduledTasks', {
			connection: redisConfig,
		});

		this.events = new EventEmitter();
		this.initializeTaskHandlers();
		this.initializeWorker();
		this.setupQueueEvents();
	}

	async cancelTask(jobId: string): Promise<boolean> {
		const job = await this.queue.getJob(jobId);
		if (!job) {
			throw new Error('Job not found');
		}

		await job.remove();
		return true;
	}

	async getTaskStatus(jobId: string): Promise<TaskStatus> {
		const job = await this.queue.getJob(jobId);
		if (!job) {
			throw new Error('Job not found');
		}

		const state = await job.getState();
		return state as TaskStatus;
	}

	async updateTaskStatus(jobId: string, status: TaskStatus): Promise<void> {
		const job = await this.queue.getJob(jobId);
		if (!job) {
			throw new Error('Job not found');
		}

		await job.updateProgress(Number(status));
	}

	onTaskCompleted(callback: (jobId: string) => void): void {
		this.events.on('taskCompleted', callback);
	}

	async cleanup(): Promise<void> {
		await this.worker.close();
		await this.queue.close();
		await this.queueEvents.close();
	}

	async scheduleTask<T extends BaseTaskData>(
		type: TaskType,
		data: T,
		scheduledFor: Date,
		config?: TaskConfig
	): Promise<ScheduledTask> {
		const handler = this.taskHandlers.get(type);
		if (!handler) {
			throw new Error(`No handler found for task type: ${type}`);
		}

		if (!(await handler.validate(data))) {
			throw new Error('Task data validation failed');
		}

		const delay = scheduledFor.getTime() - Date.now();
		if (delay < 0) {
			throw new Error('Cannot schedule tasks in the past');
		}

		const job = await this.queue.add(
			'scheduled-task',
			{ type, data },
			{
				delay,
				jobId: config?.jobId,
				attempts: config?.attempts,
				backoff: config?.backoff,
				removeOnComplete: config?.removeOnComplete ?? false,
				priority: config?.priority,
			}
		);

		return {
			id: job.id as string,
			type,
			data,
			scheduledFor,
			status: TaskStatus.SCHEDULED,
			config,
		};
	}

	private setupQueueEvents(): void {
		this.queueEvents.on('completed', ({ jobId }) => {
			console.log(`Job ${jobId} completed`);
			this.events.emit('taskCompleted', jobId);
		});

		this.queueEvents.on('failed', ({ jobId, failedReason }) => {
			console.error(`Job ${jobId} failed: ${failedReason}`);
		});

		this.queueEvents.on('progress', ({ jobId, data }) => {
			console.log(`Job ${jobId} progress: ${data}%`);
		});
	}

	private initializeTaskHandlers(): void {
		this.taskHandlers = new Map();
		this.taskHandlers.set(TaskType.EMAIL, new EmailTaskHandler());
	}

	private initializeWorker(): void {
		this.worker = new Worker(
			'scheduledTasks',
			async (job) => {
				const { type, data } = job.data;
				console.log(new Date());
				// return;
				// const handler = this.taskHandlers.get(type);

				// if (!handler) {
				// 	throw new Error(`No handler found for task type: ${type}`);
				// }

				// if (!(await handler.validate(data))) {
				// 	throw new Error('Task data validation failed');
				// }

				// await handler.execute(data);
				// this.events.emit('taskCompleted', job.id);
			},
			{
				connection: redisConfig,
				concurrency: 5,
			}
		);

		this.setupWorkerEvents();
	}

	private setupWorkerEvents(): void {
		this.worker.on('completed', async (job: Job) => {
			// await this.updateTaskStatus(job.id as string, TaskStatus.COMPLETED);
			console.log(`Job ${job.id} completed successfully`);
		});

		this.worker.on(
			'failed',
			async (
				job: Job<any, any, string> | undefined,
				error: Error,
				prev: string
			) => {
				if (job) {
					// await this.updateTaskStatus(job.id as string, TaskStatus.FAILED);
					console.error(`Job ${job.id} failed:`, error);
				}
			}
		);

		this.worker.on(
			'progress',
			(job: Job<any, any, string>, progress: number | object) => {
				console.log(
					`Job ${job.id} progress: ${
						typeof progress === 'number' ? progress : JSON.stringify(progress)
					}%`
				);
			}
		);
	}
}
