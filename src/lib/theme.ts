import type { UsersRecord } from './db.types';

export const DEFAULT_PRIMARY_HUE = 295;
export const DEFAULT_ACCENT_HUE = 174;

export function getStyle(user: UsersRecord) {
	return `
    <${''}style>
      :root {
        --hue-primary: ${user?.primaryColor || DEFAULT_PRIMARY_HUE};
        --hue-accent: ${user?.accentColor || DEFAULT_ACCENT_HUE}
      }
    </${''}style>
  `;
}
