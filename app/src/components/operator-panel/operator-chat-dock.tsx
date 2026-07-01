"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { hiddenInternalToolsMessageView } from "@/components/copilot/copilot-tool-presentation";

import styles from "./operator-shell.module.css";

type Props = {
  welcomeText: string;
};

/** Center-column bottom chat dock (DC L306–317) — not the right IntelligencePanel. */
export function OperatorChatDock({ welcomeText }: Props) {
  return (
    <div className={styles.chatDock} data-testid="operator-chat-dock">
      <div className={styles.chatDockInner}>
        <CopilotChat
          labels={{ welcomeMessageText: welcomeText }}
          messageView={hiddenInternalToolsMessageView}
        />
      </div>
    </div>
  );
}
