import { CommandCenter } from "@/components/command-center/command-center";

// The operator shell (threads drawer + CopilotSidebar AI panel + route context)
// is provided by the root layout via <OperatorPanel> (IPI2-82). This page just
// renders the Command Center workspace into the shell's center column.
export default function CommandCenterPage() {
  return <CommandCenter />;
}
