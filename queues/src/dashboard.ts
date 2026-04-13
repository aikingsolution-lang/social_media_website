import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { videoQueue, campaignQueue } from "./index";
import { postQueue } from "./postQueue";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [
        new BullMQAdapter(videoQueue),
        new BullMQAdapter(campaignQueue),
        new BullMQAdapter(postQueue)
    ],
    serverAdapter
});

export { serverAdapter };