import { createPluginStore } from "@api/storage";

interface CustomVoiceMessagesSettings {
    sendAsVM: boolean;
    allAsVM: boolean;
}

export const { useStore, settings } = createPluginStore<CustomVoiceMessagesSettings>("customvoicemessages", {
    sendAsVM: true,
    allAsVM: false,
});
