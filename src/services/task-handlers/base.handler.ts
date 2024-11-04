import { BaseTaskData } from '../../types/scheduler.types';

export abstract class BaseTaskHandler<T extends BaseTaskData> {
	abstract execute(data: T): Promise<void>;

	abstract validate(data: T): Promise<boolean>;

	protected async logExecution(
		taskId: string,
		status: 'success' | 'failure',
		error?: Error,
	): Promise<void> {
		console.log(`Task ${taskId} execution ${status}`, error || '');
	}
}
