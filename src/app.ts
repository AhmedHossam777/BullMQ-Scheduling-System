import express from 'express';
import schedulerRoutes from './routes/scheduler.routes';

const app = express();

app.use(express.json());

app.use('/api/v1/scheduler', schedulerRoutes);

const port = 3000;

app.listen(port, () => {
	console.log(`app running on port ${port}`);
});
