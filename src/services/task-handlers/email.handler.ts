import nodemailer from 'nodemailer';
import { EmailTaskData } from '../../types/scheduler.types';
import { BaseTaskHandler } from './base.handler';

export class EmailTaskHandler extends BaseTaskHandler<EmailTaskData> {
	private readonly transporter: nodemailer.Transporter;

	constructor() {
		super();
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}

	async validate(data: EmailTaskData): Promise<boolean> {
		return !(!data.to || !data.subject || !data.content);
	}

	async execute(data: EmailTaskData): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: process.env.EMAIL_FROM,
				to: data.to,
				subject: data.subject,
				html: data.content,
				attachments: data.attachments,
			});
		} catch (error: any) {
			throw new Error(`Failed to send email: ${error?.message}`);
		}
	}
}
