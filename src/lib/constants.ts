export enum ALIGNMENT {
	AUTO = 'auto',
	START = 'start',
	CENTER = 'center',
	END = 'end'
}

export enum DIRECTION {
	HORIZONTAL = 'horizontal',
	VERTICAL = 'vertical'
}

export enum SCROLL_CHANGE_REASON {
	OBSERVED = 0,
	REQUESTED = 1
}

// Use regular const objects for SCROLL_PROP and SCROLL_PROP_LEGACY to allow computed properties
export const SCROLL_PROP = {
	[DIRECTION.VERTICAL]: 'top',
	[DIRECTION.HORIZONTAL]: 'left'
} as const;

export const SCROLL_PROP_LEGACY = {
	[DIRECTION.VERTICAL]: 'scrollTop',
	[DIRECTION.HORIZONTAL]: 'scrollLeft'
} as const;
