"use client";

import { Sparkles } from "lucide-react";
import { CopilotChat } from "@copilotkit/react-core/v2";

import { hiddenInternalToolsMessageView } from "@/components/copilot/copilot-tool-presentation";

import styles from "./operator-shell.module.css";

type Props = {
  welcomeText: string;
  agentLabel?: string;
};

/** Center-column bottom chat dock (DC Shoots List L191–250) — not the right IntelligencePanel. */
export function OperatorChatDock({ welcomeText, agentLabel = "Production Planner" }: Props) {
  return (
    <div className={styles.chatDock} data-testid="operator-chat-dock">
      <div className={styles.chatDockInner}>
        <div className={styles.chatDockHeader}>
          <span className={styles.chatDockIcon} aria-hidden>
            <Sparkles size={13} strokeWidth={1.7} />
          </span>
          <span className={styles.chatDockLabel}>{agentLabel}</span>
          <span className={styles.chatDockLiveDot} aria-hidden />
        </div>

        {welcomeText ? (
          <p className={styles.chatDockSummary} data-testid="chat-dock-summary">
            {welcomeText}
          </p>
        ) : null}

        <CopilotChat
          labels={{ welcomeMessageText: "" }}
          messageView={hiddenInternalToolsMessageView}
        />
      </div>
    </div>
  );
}
