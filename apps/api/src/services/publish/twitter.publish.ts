import axios from "axios";

type PublishTwitterPostInput = {
    accessToken: string;
    caption: string;
};

export const publishTwitterPost = async ({
    accessToken,
    caption,
}: PublishTwitterPostInput) => {
    const response = await axios.post(
        "https://api.twitter.com/2/tweets",
        { text: caption },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};