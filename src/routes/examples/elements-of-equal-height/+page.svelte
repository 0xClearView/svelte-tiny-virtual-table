<script>
	import VirtualTable from '$lib/VirtualTable.svelte';

	let itemSize = 50;
</script>

<svelte:head>
	<title>Elements of equal height | svelte-tiny-virtual-table</title>
</svelte:head>

<div id="elements-of-equal-height-example" class="example-page">
	<h3>Elements of equal height</h3>

	<div class="range-field">
		<label for="item-size">Item size</label>
		<div class="slider">
			<input id="item-size" type="range" step="5" min="50" max="155" bind:value={itemSize} />
			<span></span>
		</div>
	</div>

	<article>
		<VirtualTable height={500} width="auto" itemCount={100000} {itemSize}>
			<tr slot="item" let:index let:style {style} class="virtual-table-row">
				<td>Item #{index}</td>
			</tr>
		</VirtualTable>
	</article>

	<!-- TODO: Show example code -->
</div>
