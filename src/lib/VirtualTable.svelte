<svelte:options accessors />

<script context="module">
	/**
	 * the third argument for event bundler
	 * @see https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
	 */
	const thirdEventArg = (() => {
		let result = { passive: false };

		try {
			const arg = Object.defineProperty({}, 'passive', {
				get() {
					result = { passive: true };
					return true;
				}
			});

			window.addEventListener('testpassive', arg, { passive: true });
			window.remove('testpassive', arg, arg);
		} catch (e) {
			/* */
		}

		return result;
	})();
</script>

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import SizeAndPositionManager, { type ItemSizeGetter } from './SizeAndPositionManager';
	import { DIRECTION, SCROLL_CHANGE_REASON, SCROLL_PROP, SCROLL_PROP_LEGACY } from './constants';

	export let height: number | string = '100%';
	export let width: number | string = '100%';

	export let itemCount: number = 1;
	export let itemSize: number | ItemSizeGetter = 50;
	export let estimatedItemSize: number | null = null;
	export let stickyIndices: number[] = [];
	export let getKey: any | null = null;

	export let scrollDirection = DIRECTION.VERTICAL;
	export let scrollOffset: number | null = null;
	export let scrollToIndex: number | null = null;
	export let scrollToAlignment: string | null = null;
	export let scrollToBehaviour: ScrollBehavior = 'instant';

	export let overscanCount = 3;

	const dispatchEvent = createEventDispatcher();

	const sizeAndPositionManager = new SizeAndPositionManager({
		itemCount,
		itemSize,
		estimatedItemSize: getEstimatedItemSize()
	});

	let mounted = false;
	let wrapper: HTMLTableElement | null = null;
	let items: any[] = [];

	let state: { offset: number; scrollChangeReason: SCROLL_CHANGE_REASON } = {
		offset:
			scrollOffset ||
			(scrollToIndex != null && items.length && getOffsetForIndex(scrollToIndex)) ||
			0,
		scrollChangeReason: SCROLL_CHANGE_REASON.REQUESTED
	};

	let prevState = state;
	let prevProps = {
		scrollToIndex,
		scrollToAlignment,
		scrollOffset,
		itemCount,
		itemSize,
		estimatedItemSize
	};

	let styleCache: { [key: number]: any } = {};
	let wrapperStyle = '';
	let innerStyle = '';

	$: {
		// listen to updates:
		scrollToIndex, scrollToAlignment, scrollOffset, itemCount, itemSize, estimatedItemSize;
		// on update:
		propsUpdated();
	}

	$: {
		// listen to updates:
		state;
		// on update:
		stateUpdated();
	}

	$: {
		// listen to updates:
		height, width, stickyIndices;
		// on update:
		if (mounted) recomputeSizes(0); // call scroll.reset
	}

	refresh(); // Initial Load

	onMount(() => {
		mounted = true;

		wrapper?.addEventListener('scroll', handleScroll, thirdEventArg);

		if (scrollOffset != null) {
			scrollTo(scrollOffset);
		} else if (scrollToIndex != null) {
			scrollTo(getOffsetForIndex(scrollToIndex));
		}
	});

	onDestroy(() => {
		if (mounted) wrapper?.removeEventListener('scroll', handleScroll);
	});

	function propsUpdated() {
		if (!mounted) return;

		const scrollPropsHaveChanged =
			prevProps.scrollToIndex !== scrollToIndex ||
			prevProps.scrollToAlignment !== scrollToAlignment;
		const itemPropsHaveChanged =
			prevProps.itemCount !== itemCount ||
			prevProps.itemSize !== itemSize ||
			prevProps.estimatedItemSize !== estimatedItemSize;

		if (itemPropsHaveChanged) {
			sizeAndPositionManager.updateConfig({
				itemSize,
				itemCount,
				estimatedItemSize: getEstimatedItemSize()
			});

			recomputeSizes();
		}

		if (prevProps.scrollOffset !== scrollOffset) {
			state = {
				offset: scrollOffset || 0,
				scrollChangeReason: SCROLL_CHANGE_REASON.REQUESTED
			};
		} else if (
			typeof scrollToIndex === 'number' &&
			(scrollPropsHaveChanged || itemPropsHaveChanged)
		) {
			state = {
				offset: getOffsetForIndex(scrollToIndex, scrollToAlignment, itemCount),

				scrollChangeReason: SCROLL_CHANGE_REASON.REQUESTED
			};
		}

		prevProps = {
			scrollToIndex,
			scrollToAlignment,
			scrollOffset,
			itemCount,
			itemSize,
			estimatedItemSize
		};
	}

	function stateUpdated() {
		if (!mounted) return;

		const { offset, scrollChangeReason } = state;

		if (prevState.offset !== offset || prevState.scrollChangeReason !== scrollChangeReason) {
			refresh();
		}

		if (prevState.offset !== offset && scrollChangeReason === SCROLL_CHANGE_REASON.REQUESTED) {
			scrollTo(offset);
		}

		prevState = state;
	}

	function getContainerSize(): number {
		const size_raw: string | number = scrollDirection === DIRECTION.VERTICAL ? height : width;
		return typeof size_raw === 'number'
			? size_raw
			: Number.parseInt((size_raw as string).replace('px', '').replace('%', ''));
	}

	function refresh() {
		const { offset } = state;

		const { start, stop } = sizeAndPositionManager.getVisibleRange({
			containerSize: getContainerSize(),
			offset,
			overscanCount
		});

		let updatedItems = [];

		const totalSize = sizeAndPositionManager.getTotalSize();
		const heightUnit = typeof height === 'number' ? 'px' : '';

		// "auto" will result in 0px width for the table element
		if (width === 'auto') {
			width = '100%';
		}

		const widthUnit = typeof width === 'number' ? 'px' : '';
		wrapperStyle = `height:${height}${heightUnit};width:${width}${widthUnit};`;

		if (scrollDirection === DIRECTION.VERTICAL) {
			innerStyle = `flex-direction:column;height:${totalSize}px;`;
		} else {
			innerStyle = `min-height:100%;width:${totalSize}px;`;
		}

		const hasStickyIndices = stickyIndices != null && stickyIndices.length !== 0;
		if (hasStickyIndices) {
			for (let i = 0; i < stickyIndices?.length; i++) {
				const index = stickyIndices[i];
				updatedItems.push({
					index,
					style: getStyle(index, true)
				});
			}
		}

		if (start !== undefined && stop !== undefined) {
			for (let index = start; index <= stop; index++) {
				if (hasStickyIndices && stickyIndices.includes(index)) {
					continue;
				}

				updatedItems.push({
					index,
					style: getStyle(index, false)
				});
			}

			dispatchEvent('itemsUpdated', {
				start,
				end: stop
			});
		}

		items = updatedItems;
	}

	function scrollTo(value: number) {
		if (wrapper && 'scroll' in wrapper) {
			wrapper.scroll({
				[SCROLL_PROP[scrollDirection]]: value,
				behavior: scrollToBehaviour
			});
		} else if (wrapper) {
			wrapper[SCROLL_PROP_LEGACY[scrollDirection]] = value;
		}
	}

	export function recomputeSizes(startIndex = 0) {
		styleCache = {};
		sizeAndPositionManager.resetItem(startIndex);
		refresh();
	}

	function getOffsetForIndex(index: number, align = scrollToAlignment, _itemCount = itemCount) {
		if (index < 0 || index >= _itemCount) {
			index = 0;
		}

		return sizeAndPositionManager.getUpdatedOffsetForIndex({
			align: align ? align : 'auto',
			containerSize: getContainerSize(),
			currentOffset: state.offset || 0,
			targetIndex: index
		});
	}

	function handleScroll(event: Event) {
		const offset = getWrapperOffset();

		if (offset < 0 || state.offset === offset || event.target !== wrapper) return;

		state = {
			offset,
			scrollChangeReason: SCROLL_CHANGE_REASON.OBSERVED
		};

		dispatchEvent('afterScroll', {
			offset,
			event
		});
	}

	function getWrapperOffset() {
		return wrapper[SCROLL_PROP_LEGACY[scrollDirection]];
	}

	function getEstimatedItemSize() {
		return estimatedItemSize || (typeof itemSize === 'number' && itemSize) || 50;
	}

	function getStyle(index: number, sticky: boolean) {
		if (styleCache[index]) return styleCache[index];

		const { size, offset } = sizeAndPositionManager.getSizeAndPositionForIndex(index);

		let style;

		if (scrollDirection === DIRECTION.VERTICAL) {
			style = `left:0;width:100%;height:${size}px;`;

			if (sticky) {
				style += `position:sticky;flex-grow:0;z-index:1;top:0;margin-top:${offset}px;margin-bottom:${-(offset + size)}px;`;
			} else {
				style += `position:absolute;top:${offset}px;`;
			}
		} else {
			style = `top:0;width:${size}px;`;

			if (sticky) {
				style += `position:sticky;z-index:1;left:0;margin-left:${offset}px;margin-right:${-(offset + size)}px;`;
			} else {
				style += `position:absolute;height:100%;left:${offset}px;`;
			}
		}

		return (styleCache[index] = style);
	}
</script>

<table bind:this={wrapper} class="virtual-table-wrapper" style={wrapperStyle}>
	<slot name="header" />

	<tbody class="virtual-table-inner" style={innerStyle}>
		{#each items as item (getKey ? getKey(item.index) : item.index)}
			<slot name="item" style={item.style} index={item.index} />
		{/each}
	</tbody>

	<slot name="footer" />
</table>

<style>
	.virtual-table-wrapper {
		display: block;
		overflow: auto;
		will-change: transform;
		-webkit-overflow-scrolling: touch;
	}

	.virtual-table-inner {
		position: relative;
		display: flex;
		width: 100%;
	}
</style>
