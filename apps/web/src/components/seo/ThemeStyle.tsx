import { Helmet } from 'react-helmet-async';
import type { PublicSettingsDTO } from '@app/shared';

/** "#0B1B3A" → "11 27 58" (the channel format globals.css and tailwind.config.ts expect). */
const channels = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** Applies the admin-edited theme colours as CSS variables, server-rendered so there is no flash. */
export function ThemeStyle({ theme }: { theme: PublicSettingsDTO['theme'] }) {
  const css = `:root{--navy:${channels(theme.navy)};--yellow:${channels(theme.yellow)};--blue:${channels(theme.blue)};--offwhite:${channels(theme.offwhite)};--ink:${channels(theme.ink)}}`;
  return (
    <Helmet>
      <style data-theme="">{css}</style>
      <meta name="theme-color" content={theme.navy} />
    </Helmet>
  );
}
