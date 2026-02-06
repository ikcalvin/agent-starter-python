"use client";
import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useVoiceAssistant,
  useChat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  PhoneOff,
  X,
  Send,
} from "lucide-react";
import styles from "./AgentModal.module.css";
import { AgentAudioVisualizerAura } from "@/components/agent-audio-visualizer-aura";

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={styles.modal}
      >
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {token === "" ? (
          <div className={styles.content}>
            <div className={styles.visualizer}>
              <AgentAudioVisualizerAura
                state="connecting"
                size="lg"
                themeMode="dark"
              />
            </div>
            <div className={styles.status}>
              Connecting to Global Solar Net...
            </div>
          </div>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {
              console.log("LiveKit Room disconnected");
            }}
            onError={(e) => {
              console.error("LiveKit Room error:", e);
            }}
            data-lk-theme="default"
            style={{ display: "contents" }}
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
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send: sendChat } = useChat();
  const [isMuted, setIsMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => {
    if (localParticipant) {
      const target = !isMuted;
      localParticipant.setMicrophoneEnabled(!target);
      setIsMuted(target);
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim() && sendChat) {
      sendChat(chatInput.trim());
      setChatInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className={styles.content}>
      {/* Main visualizer area */}
      <div className={styles.visualizer}>
        <AgentAudioVisualizerAura
          state={state}
          audioTrack={audioTrack}
          size="lg"
          themeMode="dark"
        />
      </div>

      {/* Chat panel - slides in from bottom when open */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={styles.chatPanel}
          >
            <div className={styles.chatMessages}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.chatMessage} ${
                    msg.from?.isLocal
                      ? styles.chatMessageUser
                      : styles.chatMessageAgent
                  }`}
                >
                  <span className={styles.chatSender}>
                    {msg.from?.isLocal ? "You" : "Solar Agent"}
                  </span>
                  <span className={styles.chatText}>{msg.message}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className={styles.chatInputWrapper}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className={styles.chatInput}
              />
              <button
                onClick={handleSendChat}
                className={styles.chatSendBtn}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      <div className={styles.controlBar}>
        {/* Left group - Mic with indicator */}
        <div
          className={`${styles.controlGroup} ${isMuted ? styles.controlGroupMuted : ""}`}
        >
          <button
            onClick={toggleMute}
            className={styles.controlBtn}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          {/* Animated indicator dots */}
          <div className={styles.indicator}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        </div>

        {/* Middle buttons */}
        <button
          className={`${styles.controlBtn} ${styles.controlBtnSecondary}`}
          aria-label="Toggle camera"
          disabled
        >
          <VideoOff size={20} />
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`${styles.controlBtn} ${styles.controlBtnSecondary} ${isChatOpen ? styles.controlBtnActive : ""}`}
          aria-label="Toggle chat"
        >
          <MessageSquare size={20} />
        </button>

        {/* End call button */}
        <button
          onClick={onClose}
          className={styles.endCallBtn}
          aria-label="End Call"
        >
          <PhoneOff size={18} />
          <span>END CALL</span>
        </button>
      </div>
    </div>
  );
}
