<script lang="ts">
	import { createEventDispatcher } from "svelte";

	import { slide } from 'svelte/transition';

	import type { Player } from "../types/player.type";

	export let players: Player[];

	let visible = false;
	let scores: number[] = [];

	function topScores(ps: Player[]): number[] {
		let scores: number[] = [];

		players.forEach((p) => {
			scores = [...scores, score(p)];
		});

		return scores
			.sort((a, b) => {
				return b - a;
			})
			.filter((v, i, a) => a.indexOf(v) === i);
	}

	function score(p: Player): number {
		return Object.values(p.scores).reduce((acc, val) => acc + val, 0);
	}

	function sort(ps: Player[]): Player[] {
		function compare(a: Player, b: Player) {
			if (score(a) > score(b)) {
				return -1;
			}

			if (score(a) < score(a)) {
				return 1;
			}

			return 0;
		}

		return [...ps].sort(compare);
	}

	function toggleScoreboard(): void {
		visible = !visible;
	}

	const dispatch = createEventDispatcher();

	function resetGame(): void {
		visible = false;
		dispatch("resetGame");
	}

	$: {
		scores = topScores(players);
	}
</script>

<button class="contrast" on:click={toggleScoreboard}>
	{#if visible}Hide{:else}Show{/if} Leaderboard
</button>

{#if visible}
	<article transition:slide>
		{#each sort(players) as player (player.id)}
			<div class="box">
				{#if score(player) == scores[0]}
					🥇
				{:else if score(player) == scores[1]}
					🥈
				{:else if score(player) == scores[2]}
					🥉
				{/if}
				{player.name} : {score(player)}
			</div>
		{/each}

		<footer>
			<button on:click={resetGame}>New Game</button>
		</footer>
	</article>
{/if}

<style>
	.box {
		padding: calc(var(--spacing) / 2) 0;

		border-radius: var(--border-radius);

		background: var(--code-background-color);
		font-size: 87.5%;

		text-align: center;

		margin-bottom: var(--spacing);
	}
</style>
