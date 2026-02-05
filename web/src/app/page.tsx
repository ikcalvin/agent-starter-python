"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Zap, Battery } from "lucide-react";
import styles from "./page.module.css";
import AgentModal from "../components/AgentModal";

export default function Home() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlow} />

      <section className={styles.hero}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Power Your Future with
          <br />
          Intelligent Solar
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Get a personalized solar savings estimate in minutes. Talk to our AI
          specialist to see if your home qualifies.
        </motion.p>

        <motion.button
          onClick={() => setIsAgentOpen(true)}
          className={styles.ctaButton}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap size={20} fill="currentColor" />
          Talk to AI Specialist
        </motion.button>
      </section>

      <div className={styles.grid}>
        <FeatureCard
          icon={<Sun size={32} />}
          title="Maximum Efficiency"
          description="Our advanced panels capture more sunlight to power your home day and night."
          delay={0.6}
        />
        <FeatureCard
          icon={<Battery size={32} />}
          title="Energy Independence"
          description="Store excess energy and protect your home from grid outages with smart battery storage."
          delay={0.7}
        />
        <FeatureCard
          icon={<Zap size={32} />}
          title="Instant Savings"
          description="Significantly reduce your monthly electricity bill starting from day one."
          delay={0.8}
        />
      </div>

      <AgentModal isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div style={{ marginBottom: "1rem", color: "#f59e0b" }}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
}
