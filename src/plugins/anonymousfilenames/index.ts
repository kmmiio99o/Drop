import { before } from "@api/patcher";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

const patches: (() => boolean)[] = [];
const NAME_LENGTH = 8;

function randomString(length: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomizeFileName(file: any) {
    const fileData = file?.file ?? file;
    if (!fileData) return;

    const originalFilename = fileData.filename ?? fileData.name;
    if (typeof originalFilename !== "string") return;

    if (originalFilename.startsWith("voice_message_")) return;

    const extIdx = originalFilename.lastIndexOf(".");
    const ext = extIdx !== -1 ? originalFilename.slice(extIdx) : "";
    const newFilename = randomString(NAME_LENGTH) + ext;

    if (typeof fileData.filename !== "undefined") fileData.filename = newFilename;
    if (typeof fileData.name !== "undefined") fileData.name = newFilename;
}

export default definePlugin({
    name: "AnonymousFileNames",
    description: "Randomises file names before you upload them.",
    author: [Developers.kmmiio99o, Contributors.maisy, Contributors.siguma],
    id: "anonymousfilenames",
    version: "1.0.0",
    start() {
        const uploadModule = findByProps("uploadLocalFiles");
        if (uploadModule) {
            patches.push(
                before("uploadLocalFiles", uploadModule, (args: any) => {
                    const files = args[0]?.items ?? args[0]?.files ?? args[0]?.uploads;
                    if (!Array.isArray(files)) return;

                    for (const file of files) {
                        randomizeFileName(file);
                    }
                }),
            );
        }

        const cloudUploadModule = findByProps("CloudUpload");
        if (cloudUploadModule) {
            patches.push(
                before("CloudUpload", cloudUploadModule, (args: any) => {
                    const uploadObject = args[0];
                    if (!uploadObject) return;
                    randomizeFileName(uploadObject);
                }),
            );
        }
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
