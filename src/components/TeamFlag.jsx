import { getTeamFlagUrl } from "../utils/teamFlags.js";
import "./team-flag.css";

/**
 * Banderas como imagen (flagcdn) — evita que Windows muestre "MX" en lugar de 🇲🇽.
 * @param {{ id?: string, flag_emoji?: string, is_placeholder?: boolean } | null | undefined} team
 */
export default function TeamFlag({ team, size = 20, className = "" }) {
  const cls = ["team-flag", className].filter(Boolean).join(" ");

  if (!team || team.is_placeholder || team.id === "TBD") {
    return <span className={`${cls} team-flag--fallback`} aria-hidden>❓</span>;
  }

  const src = getTeamFlagUrl(team.id, Math.round(size * 1.5));
  if (!src) {
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
      srcSet={`${getTeamFlagUrl(team.id, Math.round(size * 3))} 2x`}
      alt=""
      className={`${cls} team-flag--img`}
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
