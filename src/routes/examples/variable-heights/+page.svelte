<script>
	import VirtualTable from '$lib/VirtualTable.svelte';

	let rowHeights = [];

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
	<title>Variable heights | svelte-tiny-virtual-table</title>
</svelte:head>

<div id="variable-heights-example" class="example-page">
	<h3>Variable heights</h3>

	<button class="responsive margin" on:click={randomize}>
		<i aria-hidden="true">shuffle</i>
		<span>Randomize heights</span>
	</button>

	<article>
		<VirtualTable height={500} width="auto" itemCount={10000} itemSize={rowHeights}>
			<tr slot="item" let:index let:style {style} class="virtual-table-row">
				<td>Item #{index}</td>
			</tr>
		</VirtualTable>
	</article>

	<!-- TODO: Show example code -->
</div>
