<script lang="ts">
	import VirtualTable from '$lib/VirtualTable.svelte';

	let rowHeights: number[] = [];

	let scrollOffset: number = 0;

	randomize();

	function randomize() {
		let newRowHeights = [];

		for (let i = 0; i < 10000; i++) {
			newRowHeights.push(Math.random() * (155 - 50) + 50);
		}

		rowHeights = newRowHeights;
	}
</script>

<svelte:head>
	<title>Controlled scroll offset | svelte-tiny-virtual-table</title>
</svelte:head>

<div id="controlled-scroll-offset-example" class="example-page">
	<h3>Controlled scroll offset</h3>

	<div class="field label border">
		<input id="scroll-offset" type="number" bind:value={scrollOffset} />
		<label for="scroll-offset">Scroll to offset...</label>
	</div>

	<article>
		<VirtualTable
			height={500}
			width="auto"
			itemCount={10000}
			itemSize={(index) => rowHeights[index]}
			{scrollOffset}
		>
			<tr slot="item" let:index let:style {style} class="virtual-table-row">
				<td>Item #{index}</td>
			</tr>
		</VirtualTable>
	</article>

	<!-- TODO: Show example code -->
</div>
