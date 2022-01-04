<script lang="ts">
	import ScoreEditor from "./components/ScoreEditor.svelte";
	import PlayerManager from "./components/PlayerManager.svelte";
	import ScoreCalculator from "./components/ScoreCalculator.svelte";

	import { slide } from 'svelte/transition';

	import type { Player } from "./types/player.type";

	let players: Player[] = [];

	function resetGame(): void {
		players = []
	}
</script>

<main class="container">
	<PlayerManager bind:players />

	<hr />

	{#if players.length >= 3}
		<div transition:slide>
			<ScoreEditor bind:players />
	
			<hr />
	
			<ScoreCalculator bind:players on:resetGame={resetGame} />
		</div>
	{:else}
		<small>You need at least 3 players to play!</small>
	{/if}
</main>

<main class="container" />
