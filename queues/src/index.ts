// import { Queue } from 'bullmq';
// import Redis from 'ioredis';

// const redisHost = process.env.REDIS_HOST || 'localhost';
// const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

// const connection = new Redis({
//   host: redisHost,
//   port: redisPort,
//   maxRetriesPerRequest: null,
// });

// export const videoQueue = new Queue('video-processing', { connection });
// export const campaignQueue = new Queue('campaign-publishing', { connection });

// export { postQueue } from './postQueue';
// export { connection };
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const videoQueue = new Queue('video-processing', {
  connection,
  defaultJobOptions
});

export const campaignQueue = new Queue('campaign-publishing', {
  connection,
  defaultJobOptions
});

export { postQueue } from './postQueue';
export { connection };