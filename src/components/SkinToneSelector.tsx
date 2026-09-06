import { useCallback, useEffect, useState } from "react";
import { SKIN_TONE_OPTIONS, type SkinTone } from "../data/types";
import { getStoredSkinTone, resolveVariantUrl, setStoredSkinTone } from "../theme/skin-tone";

const arrowSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

interface SkinToneSelectorProps {
  labels: Record<SkinTone, string>;
  label: string;
  onlyDefaultLabel: string;
  defaultSrc: string;
  slug: string;
  hasVariants: boolean;
  imgId: string;
  variantMap?: Partial<Record<SkinTone, string>>;
}

export function SkinToneSelector({
  labels,
  label,
  onlyDefaultLabel,
  defaultSrc,
  slug,
  hasVariants,
  imgId,
}: SkinToneSelectorProps) {
  const [skinTone, setSkinTone] = useState<SkinTone>("default");

  useEffect(() => {
    const stored = getStoredSkinTone();
    setSkinTone(stored);
    if (hasVariants) {
      const image = document.getElementById(imgId) as HTMLImageElement | null;
      if (image) {
        image.src = resolveVariantUrl(hasVariants, slug, defaultSrc, stored);
      }
    }
  }, [defaultSrc, hasVariants, imgId, slug]);

  const handleChange = useCallback(
    (next: SkinTone) => {
      setSkinTone(next);
      setStoredSkinTone(next);
      const image = document.getElementById(imgId) as HTMLImageElement | null;
      if (image) {
        image.src = resolveVariantUrl(hasVariants, slug, defaultSrc, next);
      }
    },
    [defaultSrc, hasVariants, imgId, slug],
  );

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    backgroundColor: "var(--surface)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    padding: "9px 34px 9px 14px",
    font: "500 14px var(--font-display)",
    backgroundImage: `url("${arrowSvg}")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px 16px",
    outline: "none",
    cursor: "pointer",
  };

  if (!hasVariants) {
    return (
      <p id="skin-tone-note" style={{ fontSize: "13px", color: "var(--muted)" }}>
        {onlyDefaultLabel}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label
        htmlFor="skin-tone-select"
        style={{
          fontSize: "14px",
          fontWeight: 500,
          opacity: 0.8,
          color: "var(--fg)",
        }}
      >
        {label}
      </label>
      <select
        id="skin-tone-select"
        value={skinTone}
        onChange={(event) => handleChange(event.target.value as SkinTone)}
        style={selectStyle}
      >
        {SKIN_TONE_OPTIONS.map((option) => (
          <option key={option.tone} value={option.tone}>
            {labels[option.tone]}
          </option>
        ))}
      </select>
    </div>
  );
}
