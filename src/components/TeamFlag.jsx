import { useState } from "react";
import { getTeamFlagUrl, snapFlagCdnWidth } from "../utils/teamFlags.js";
import "./team-flag.css";

/**
 * Banderas como imagen (flagcdn) — evita que Windows muestre "MX" en lugar de 🇲🇽.
 * @param {{ id?: string, flag_emoji?: string, is_placeholder?: boolean } | null | undefined} team
 */
export default function TeamFlag({ team, size = 20, className = "" }) {
  const [broken, setBroken] = useState(false);
  const cls = ["team-flag", className].filter(Boolean).join(" ");

  if (!team || team.is_placeholder || team.id === "TBD") {
    return <span className={`${cls} team-flag--fallback`} aria-hidden>❓</span>;
  }

  const cdnWidth = snapFlagCdnWidth(Math.round(size * 2));
  const src = getTeamFlagUrl(team.id, cdnWidth);
  const retinaWidth = snapFlagCdnWidth(cdnWidth * 2);
  const src2x = getTeamFlagUrl(team.id, retinaWidth);

  if (!src || broken) {
    return (
      <span className={`${cls} team-flag--fallback`} aria-hidden>
        {team.flag_emoji || "🏳️"}
      </span>
    );
  }

  const height = Math.round(size * 0.72);

  return (
    <img
      src={src}
      srcSet={src2x && src2x !== src ? `${src2x} 2x` : undefined}
      alt=""
      className={`${cls} team-flag--img`}
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
