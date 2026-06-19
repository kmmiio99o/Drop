import { findByProps } from "@metro";
import { ScrollView } from "react-native";

import { useStore } from "./storage";

const { TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default function CustomVoiceMessagesSettings() {
    const settings = useStore();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Voice Messages">
                    <TableSwitchRow
                        label="Send audio files as voice messages"
                        onValueChange={(value: boolean) => {
                            settings.updateSettings({ sendAsVM: value });
                        }}
                        value={settings.sendAsVM}
                    />
                    <TableSwitchRow
                        label="Show all audio as voice messages"
                        onValueChange={(value: boolean) => {
                            settings.updateSettings({ allAsVM: value });
                        }}
                        value={settings.allAsVM}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
