// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				userId: string;
				name: string;
				emoji: string;
				avatarUrl?: string | null;
				memberId?: string | null;
				houseId?: string | null;
				houseCode?: string | null;
				houseName?: string | null;
				points?: number;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
