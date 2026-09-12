// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				userId: string;
				username: string;
				name: string;
				displayName?: string | null;
				emoji: string;
				avatarUrl?: string | null;
				memberId?: string | null;
				houseId?: string | null;
				houseCode?: string | null;
				houseName?: string | null;
				points?: number;
				role?: 'admin' | 'member';
				isAdmin?: boolean;
				settings?: {
					enableStore: boolean;
					enableFeed: boolean;
					enablePoints: boolean;
					enableQuarantine: boolean;
					enableDueDates: boolean;
				};
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
