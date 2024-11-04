export enum TaskType {
	EMAIL = 'email',
	NOTIFICATION = 'notification',
}

export enum TaskStatus {
	SCHEDULED = 'scheduled',
	COMPLETED = 'completed',
	FAILED = 'failed',
	DELAYED = 'delayed',
	ACTIVE = 'active',
	WAITING = 'waiting',
	PAUSED = 'paused',
}

export interface BaseTaskData {
	userId: string;
	metadata?: Record<string, any>;
}

export interface EmailTaskData extends BaseTaskData {
	to: string;
	subject: string;
	content: string;
	attachments?: Array<{
		filename: string;
		content: string;
		contentType: string;
	}>;
}

export interface NotificationTaskData extends BaseTaskData {
	title: string;
	message: string;
	channel: 'push' | 'in-app' | 'web';
	deviceTokens?: string[];
}

export interface TaskConfig {
	attempts?: number;
	backoff?: {
		type: 'fixed' | 'exponential';
		delay: number;
	};
	removeOnComplete?: boolean;
	priority?: number;
	jobId?: string;
	timeout?: number;
}

export interface ScheduledTask {
	id: string;
	type: TaskType;
	data: BaseTaskData | EmailTaskData | NotificationTaskData;
	scheduledFor: Date;
	status: TaskStatus;
	config?: TaskConfig;
}
