import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findInReactTree } from "@lib/utils";
import { findByProps } from "@metro";
import { clipboard, FluxDispatcher, React } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { Linking } from "react-native";

import settings from "./settings";
import { settings as pluginSettings } from "./storage";

const patches: (() => boolean)[] = [];
const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;

const VOICE_MESSAGE_FLAG = 8192;

function transformAudio(item: any) {
    if (item?.mimeType?.startsWith("audio")) {
        item.mimeType = "audio/ogg";
        item.waveform = "AEtWPyUaGA4OEAcA";
        item.durationSecs = 60.0;
    }
}

function onLoadMessages(event: any) {
    if (!pluginSettings.allAsVM) return;
    const messages = event.messages;
    if (!messages) return;
    for (const msg of messages) {
        if (msg.flags & VOICE_MESSAGE_FLAG) continue;
        if (!msg.attachments) continue;
        for (const att of msg.attachments) {
            if (att.content_type?.startsWith("audio")) {
                msg.flags |= VOICE_MESSAGE_FLAG;
                att.waveform = "AEtWPyUaGA4OEAcA";
                att.duration_secs = 60;
            }
        }
    }
}

function onMessageCreate(event: any) {
    if (!pluginSettings.allAsVM) return;
    const message = event.message;
    if (!message?.attachments) return;
    if (message.flags & VOICE_MESSAGE_FLAG) return;
    if (message.attachments[0]?.content_type?.startsWith("audio")) {
        message.flags |= VOICE_MESSAGE_FLAG;
        for (const att of message.attachments) {
            att.waveform = "AEtWPyUaGA4OEAcA";
            att.duration_secs = 60;
        }
    }
}

function onMessageUpdate(event: any) {
    if (!pluginSettings.allAsVM) return;
    const message = event.message;
    if (!message?.attachments) return;
    if (message.flags & VOICE_MESSAGE_FLAG) return;
    if (message.attachments[0]?.content_type?.startsWith("audio")) {
        message.flags |= VOICE_MESSAGE_FLAG;
        for (const att of message.attachments) {
            att.waveform = "AEtWPyUaGA4OEAcA";
            att.duration_secs = 60;
        }
    }
}

export default definePlugin({
    name: "CustomVoiceMessages",
    description: "Allows sending any audio as a voice message",
    author: [Developers.kmmiio99o, Contributors.Dziurwa, Contributors.siguma],
    id: "customvoicemessages",
    version: "1.0.0",
    start() {
        const patchMethod = (method: string) => {
            try {
                const mod = findByProps(method);
                if (!mod) return;
                patches.push(
                    before(method, mod, (args: any) => {
                        if (!pluginSettings.sendAsVM) return;
                        const upload = args[0];
                        if (!upload || upload.flags === VOICE_MESSAGE_FLAG) return;

                        const item = upload.items?.[0] ?? upload;
                        transformAudio(item);
                        upload.flags = VOICE_MESSAGE_FLAG;
                    }),
                );
            } catch {}
        };

        patchMethod("uploadLocalFiles");
        patchMethod("CloudUpload");

        FluxDispatcher.subscribe("LOAD_MESSAGES_SUCCESS", onLoadMessages);
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onMessageUpdate);

        if (LazyActionSheet && ActionSheetRow) {
            const unpatchLazy = before("openLazy", LazyActionSheet, ([component, key, ctx]: any[]) => {
                if (key !== "MessageLongPressActionSheet") return;

                const message = ctx?.message;
                if (!message?.attachments?.[0]) return;

                component.then((instance: any) => {
                    const unpatchSheet = after("default", instance, (_: any, res: any) => {
                        const isVoice = message.flags & VOICE_MESSAGE_FLAG ||
                            message.attachments?.[0]?.content_type?.startsWith("audio");
                        if (!isVoice) return;

                        React.useEffect(() => () => { unpatchSheet(); }, []);

                        const buttons = findInReactTree(
                            res,
                            (x: any) => Array.isArray(x) && x.some((c: any) => c?.type?.name === "ActionSheetRow"),
                        );
                        if (!buttons) return;

                        const att = message.attachments[0];

                        buttons.push(
                            <ActionSheetRow
                                label="Download Voice Message"
                                icon={<ActionSheetRow.Icon source={findAssetId("DownloadIcon")} />}
                                onPress={() => {
                                    LazyActionSheet.hideActionSheet();
                                    Linking.openURL(att.url);
                                }}
                            />,
                        );
                        buttons.push(
                            <ActionSheetRow
                                label="Copy Voice Message URL"
                                icon={<ActionSheetRow.Icon source={findAssetId("CopyIcon")} />}
                                onPress={() => {
                                    clipboard.setString(att.url);
                                    showToast("Copied URL!", findAssetId("Check"));
                                    LazyActionSheet.hideActionSheet();
                                }}
                            />,
                        );
                    });
                });
            });

            patches.push(unpatchLazy);
        }
    },
    stop() {
        for (const unpatch of patches) unpatch();
        FluxDispatcher.unsubscribe("LOAD_MESSAGES_SUCCESS", onLoadMessages);
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onMessageUpdate);
    },
    settings,
});
