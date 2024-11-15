<script>
	import VirtualTable from '$lib/VirtualTable.svelte';

	let width = 1;
</script>

<svelte:head>
	<title>Horizontal list | svelte-tiny-virtual-table</title>
</svelte:head>

<div id="horizontal-list-example" class="example-page">
	<h3>Horizontal list</h3>

	<article>
		<div bind:clientWidth={width} class="row scroll">
			<VirtualTable
				height="200px"
				{width}
				scrollDirection="horizontal"
				itemCount={100000}
				itemSize={150}
			>
				<div slot="item" let:index let:style {style} class="virtual-table-col">
					Item #{index}
				</div>
			</VirtualTable>
		</div>
	</article>

	<!-- TODO: Show example code -->
</div>
