export type ScheduledPostStatus =
    | "PENDING"
    | "QUEUED"
    | "PUBLISHING"
    | "PUBLISHED"
    | "FAILED";

export interface ScheduledLinkedInPost {
    id: string;
    caption: string;
    scheduledTime: string;
    status: ScheduledPostStatus;
    mediaUrls?: string[];
    platformPostId?: string | null;
    failedReason?: string | null;
    publishedAt?: string | null;
    account?: {
        id: string;
        profileName?: string;
        username?: string;
        email?: string;
        platform?: string;
    };
}