"use client";

import { useState } from "react";
import styles from "./Hero.module.css";
import type { CapraSeedRequestV1 } from "@/types/capra-seed";

const EXAMPLES = [
  "An AI-powered meal planning app for busy families",
  "A marketplace for freelance architects and homeowners",
  "B2B SaaS for construction project management",
  "On-demand pet grooming booked via mobile",
];

interface HeroProps {
  onAnalyze: (params: Omit<CapraSeedRequestV1, "section">) => void;
  onViewSaved?: () => void;
}

export default function Hero({ onAnalyze, onViewSaved }: HeroProps) {
  const [idea, setIdea] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [region, setRegion] = useState("");
  const [tone, setTone] = useState("");
  const [pricingPreference, setPricingPreference] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canSubmit = idea.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAnalyze({
      idea: idea.trim(),
      targetAudience: targetAudience.trim() || undefined,
      region: region.trim() || undefined,
      tone: tone.trim() || undefined,
      pricingPreference: pricingPreference.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <span className={styles.badge}>Venture Lab</span>

        <h1 className={styles.headline}>
          Turn your venture seed into a <em>complete</em> launch blueprint
        </h1>

        <p className={styles.sub}>
          Enter your venture concept and get instant market analysis, revenue
          projections, competitive intelligence, and a go-to-market plan.
        </p>

        <div className={styles.form}>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Describe your venture seed... (e.g. An AI-powered tool that helps small restaurants reduce food waste by predicting inventory needs)"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              maxLength={600}
              aria-label="Venture seed"
            />
            <span className={styles.charCount}>{idea.length}/600</span>
          </div>

          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Hide" : "Show"} optional context{" "}
            <span className={styles.chevron}>{showAdvanced ? "▲" : "▼"}</span>
          </button>

          {showAdvanced && (
            <div className={styles.advanced}>
              <label className={styles.fieldLabel}>
                Target Audience
                <input
                  className={styles.input}
                  placeholder="e.g. Small restaurant owners aged 30-50"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </label>
              <label className={styles.fieldLabel}>
                Region / Market
                <input
                  className={styles.input}
                  placeholder="e.g. North America, UK, Southeast Asia"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </label>
              <label className={styles.fieldLabel}>
                Tone
                <input
                  className={styles.input}
                  placeholder="e.g. Optimistic, Conservative, Realistic"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </label>
              <label className={styles.fieldLabel}>
                Pricing Preference
                <input
                  className={styles.input}
                  placeholder="e.g. Freemium, Enterprise, Usage-Based"
                  value={pricingPreference}
                  onChange={(e) => setPricingPreference(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className={styles.actions}>
            <span className={styles.hint}>⌘↵ to submit</span>
            {onViewSaved && (
              <button type="button" className={styles.savedLink} onClick={onViewSaved}>
                Saved Reports
              </button>
            )}
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Seed Blueprint →
            </button>
          </div>
        </div>

        <div className={styles.examples}>
          <span className={styles.exampleLabel}>Quick start</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className={styles.pill}
              onClick={() => setIdea(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
