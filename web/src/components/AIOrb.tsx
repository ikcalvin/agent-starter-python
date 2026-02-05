"use client";
import { motion, Variants } from "framer-motion";
import styles from "./AIOrb.module.css";

export type OrbState = "connecting" | "idle" | "listening" | "speaking";

interface AIorbProps {
  state: OrbState;
}

export default function AIOrb({ state }: AIorbProps) {
  // Core orb animation variants
  const coreVariants: Variants = {
    connecting: {
      scale: [0.8, 1, 0.8],
      opacity: [0.4, 0.7, 0.4],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    idle: {
      scale: [1, 1.02, 1],
      opacity: 0.9,
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    listening: {
      scale: [1, 1.08, 1],
      opacity: 1,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    speaking: {
      scale: [1, 1.15, 1, 1.1, 1],
      opacity: 1,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Outer glow ring variants
  const ringVariants: Variants = {
    connecting: {
      scale: [1, 1.1, 1],
      opacity: [0.2, 0.4, 0.2],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    idle: {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    listening: {
      scale: [1, 1.2, 1],
      opacity: [0.4, 0.7, 0.4],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    speaking: {
      scale: [1, 1.4, 1.2, 1.35, 1],
      opacity: [0.5, 0.9, 0.6, 0.85, 0.5],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeOut",
      },
    },
  };

  // Secondary ring (offset timing)
  const ring2Variants: Variants = {
    connecting: {
      scale: [1.1, 1.2, 1.1],
      opacity: [0.1, 0.3, 0.1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    idle: {
      scale: [1.05, 1.12, 1.05],
      opacity: [0.2, 0.35, 0.2],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    listening: {
      scale: [1.1, 1.35, 1.1],
      opacity: [0.25, 0.5, 0.25],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.2,
      },
    },
    speaking: {
      scale: [1.15, 1.55, 1.3, 1.5, 1.15],
      opacity: [0.3, 0.7, 0.4, 0.65, 0.3],
      transition: {
        duration: 0.55,
        repeat: Infinity,
        ease: "easeOut",
        delay: 0.1,
      },
    },
  };

  // Particle animation variants
  const particleVariants: Variants = {
    connecting: {
      opacity: [0, 0.5, 0],
      y: [0, -20, -40],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeOut",
      },
    },
    idle: {
      opacity: [0.3, 0.6, 0.3],
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    listening: {
      opacity: [0.4, 0.8, 0.4],
      y: [0, -25, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    speaking: {
      opacity: [0.5, 1, 0.5],
      y: [0, -35, 0],
      scale: [1, 1.3, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className={styles.orbContainer}>
      {/* Outer glow rings */}
      <motion.div
        className={styles.ring2}
        variants={ring2Variants}
        animate={state}
      />
      <motion.div
        className={styles.ring1}
        variants={ringVariants}
        animate={state}
      />

      {/* Main orb core */}
      <motion.div
        className={styles.orbCore}
        variants={coreVariants}
        animate={state}
      >
        {/* Inner highlight */}
        <div className={styles.innerHighlight} />
      </motion.div>

      {/* Floating particles */}
      <motion.div
        className={`${styles.particle} ${styles.particle1}`}
        variants={particleVariants}
        animate={state}
      />
      <motion.div
        className={`${styles.particle} ${styles.particle2}`}
        variants={particleVariants}
        animate={state}
        transition={{ delay: 0.5 }}
      />
      <motion.div
        className={`${styles.particle} ${styles.particle3}`}
        variants={particleVariants}
        animate={state}
        transition={{ delay: 1 }}
      />
      <motion.div
        className={`${styles.particle} ${styles.particle4}`}
        variants={particleVariants}
        animate={state}
        transition={{ delay: 0.75 }}
      />
    </div>
  );
}
