import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method Not Allowed",

        });
    }



    try {
        const response = await
            handleUpload({
                body: req.body,
                request: req,

                onBeforeGenerateToken: async () => {
                    return {
                        allowedContentTypes: [
                            "image/jpeg",
                            "image/png",
                            "image/webp",
                            "application/pdf"
                        ],
                        addRandomSuffix: true,
                    };
                },
                onUploadCompleted: async ({ blob }) => {
                    console.log("uploaded:", blob.url);
                }
            });

        return res.status(200).json(response);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: err.message,
        });
    }

}