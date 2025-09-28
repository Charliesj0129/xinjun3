import { listAllResources, listAllActions, clearAllData } from "@/db/db";
import { Share } from "react-native";

export async function exportData(format: 'json'|'csv') {
  const resources = await listAllResources();
  const actions = await listAllActions();
  if (format === 'json') {
    const payload = JSON.stringify({ resources, actions }, null, 2);
    await Share.share({ message: payload });
  } else {
    const header = 'type,date,payload\n';
    const rows = actions.map(a => `action,${a.date},"${JSON.stringify(a.payload)}"`).join('\n');
    await Share.share({ message: header + rows });
  }
}

export async function deleteAllData() {
  await clearAllData();
}
