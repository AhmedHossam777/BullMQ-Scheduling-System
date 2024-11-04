import { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConfig: RedisOptions = {
	host: process.env.REDIS_HOST,
	port: Number(process.env.REDIS_PORT),
};
