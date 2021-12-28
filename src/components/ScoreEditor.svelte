<script lang="ts">
	import { Splide, SplideSlide } from "@splidejs/svelte-splide";
	import "@splidejs/splide/dist/css/splide.min.css";

	import { createEventDispatcher } from "svelte";
	import type { Player } from '../types'
	
	export let players: Player[];
	
	const dispatch = createEventDispatcher();

	function update() {
		dispatch("updateplayers", {
			players: players,
		});
	}

	const scoreTypes = ["Wonders", "Coins", "Military conflicts", "Blue cards", "Yellow cards", "Green cards", "Violet cards"];
</script>

<div>
	{#if players.length != 0}
		<Splide
			options={{
				type: "loop",
				padding: "4rem",
				gap: "5rem",
				arrows: true,

				dragMinThreshold: 25,

				breakpoints: {
					768: {
						padding: "0",
						gap: "2rem",
						arrows: false,
					},
				},
			}}
		>
			{#each players as player (player.id)}
				<SplideSlide>
					<div class="container-full">
						<article>
							<h3>{player.name}</h3>
							{#each scoreTypes as score}
								<label for="score">{score}</label>
								<input type="number" on:change={update} bind:value={player.scores[score]} />
							{/each}
						</article>
					</div>
				</SplideSlide>
			{/each}
		</Splide>
	{/if}
</div>
