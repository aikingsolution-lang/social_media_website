import axios from "axios";

type PublishLinkedInPostInput = {
    accessToken: string;
    authorUrn: string;
    caption: string;
    mediaUrl?: string | null;
};

export const publishLinkedInPost = async ({
    accessToken,
    authorUrn,
    caption,
}: PublishLinkedInPostInput) => {
    const payload = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: caption,
                },
                shareMediaCategory: "NONE",
            },
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
    };

    const response = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        payload,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        }
    );

    return response.data;
};