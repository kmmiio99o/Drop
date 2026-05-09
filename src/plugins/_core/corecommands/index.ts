import { patchCommands, registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

let unregisters: (() => void)[] = [];

export default definePlugin({
    name: Strings.PLUGIN__CORE_COMMANDS,
    description: Strings.PLUGIN__CORE_COMMANDS_DESC,
    author: [Developers.cocobo1],
    id: "commands",
    version: "1.0.0",
    start() {
        unregisters = [];
        unregisters.push(patchCommands());
        unregisters.push(registerCommand(require("./builtins/debug").default()));
        unregisters.push(registerCommand(require("./builtins/plugins").default()));
        unregisters.push(registerCommand(require("./builtins/themes").default()));
        unregisters.push(registerCommand(require("./builtins/eval").default()));
    },
    stop() {
        unregisters.forEach(fn => fn());
        unregisters = [];
    }
});
