"use client";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { motion, Variants } from "framer-motion";
import { Mic, MicOff, PhoneOff, X } from "lucide-react";
import styles from "./AgentModal.module.css";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  const [token, setToken] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const roomName = `consultation-${Math.floor(Math.random() * 10000)}`;
          const resp = await fetch(
            `/api/token?room=${roomName}&username=user-${Math.floor(Math.random() * 10000)}`,
          );
          const data = await resp.json();
          setToken(data.token);
          setUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || "");
        } catch (e) {
          console.error("Failed to fetch token", e);
        }
      })();

      return () => {
        setToken("");
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.modal}
      >
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {token === "" ? (
          <div className={styles.status}>Connecting to Global Solar Net...</div>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {
              console.log("LiveKit Room disconnected");
              // Do not close immediately, let user see the state or reconnect
            }}
            onError={(e) => {
              console.error("LiveKit Room error:", e);
            }}
            // Use a simple data attribute to style if needed
            data-lk-theme="default"
          >
            <AgentInterface onClose={onClose} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </motion.div>
    </div>
  );
}

function AgentInterface({ onClose }: { onClose: () => void }) {
  // Fallback if useVoiceAssistant isn't perfect: use manual state or just visualize audio
  const { state } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (localParticipant) {
      // Toggle logic
      const target = !isMuted;
      localParticipant.setMicrophoneEnabled(!target);
      setIsMuted(target);
    }
  };

  // Visualizer animation variants
  const orbVariants: Variants = {
    idle: { scale: 1, opacity: 0.5 },
    listening: {
      scale: [1, 1.1, 1],
      opacity: 0.8,
      transition: { repeat: Infinity, duration: 1.5 },
    },
    speaking: {
      scale: [1, 1.3, 1],
      opacity: 1,
      transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
    },
  };

  return (
    <>
      <div className={styles.visualizer}>
        <motion.div
          className={styles.orb}
          variants={orbVariants}
          animate={state === "speaking" ? "speaking" : "listening"}
        />
      </div>

      <div className={styles.status}>
        {state === "speaking" ? "Solar Agent is speaking..." : "Listening..."}
      </div>

      <div className={styles.controls}>
        <button
          onClick={toggleMute}
          className={styles.controlBtn}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button
          onClick={() => {
            // Disconnect happens by unmounting or onClose, usually simpler to just close modal
            onClose();
          }}
          className={`${styles.controlBtn} ${styles.destructive}`}
          aria-label="End Call"
        >
          <PhoneOff />
        </button>
      </div>
    </>
  );
}
