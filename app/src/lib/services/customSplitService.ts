import { api } from "../../convex/_generated/api";
import { convex } from "../convex";
import type { CustomSplitDay } from "../components/CustomSplitPanel.svelte";

export async function saveCustomSplit(userId: string, split: CustomSplitDay[]) {
    // Save the custom split as part of the user's configJson
    // Fetch current config
    const config = await convex.query(api.users.getUserConfig, { userId });
    let configObj: any = {};
    if (config && config.configJson) {
        try {
            configObj = JSON.parse(config.configJson);
        } catch {
            configObj = {};
        }
    }
    configObj.customSplit = split;
    await convex.mutation(api.users.setUserConfig, {
        userId,
        configJson: JSON.stringify(configObj)
    });
    return true;
}

export async function getCustomSplit(userId: string): Promise<CustomSplitDay[] | null> {
    const config = await convex.query(api.users.getUserConfig, { userId });
    if (config && config.configJson) {
        try {
            const obj = JSON.parse(config.configJson);
            return obj.customSplit || null;
        } catch {
            return null;
        }
    }
    return null;
}
