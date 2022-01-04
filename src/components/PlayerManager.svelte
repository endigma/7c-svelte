<script lang="ts">
	import type { Player } from "../types/player.type";

	export let players: Player[];

	let textInput: string;

	function removePlayer(): void {
		players = players.slice(0, -1);
	}

	function addPlayer(): void {
		let name = textInput == undefined ? `Player ${players.length + 1}` : textInput;

		let newplayer: Player = {
			id: players.length + 1,
			name: name,
			scores: new Map<string, number>([]),
		};

		players = [...players, newplayer];

		textInput = undefined;
	}

	function removePlayerSpecific(value: Player): void {
		console.log("attempted to remove item");
		const index = players.indexOf(value);
		if (index > -1) {
			players.splice(index, 1);
		}
		players = players;
	}

	function handleInputEvent(e): void {
		console.log(e.key);
		e.key === "Delete" && e.target.value == "" && removePlayer();
	}
</script>

<h1 style="margin-bottom: 1rem">Players</h1>

{#if players.length != 0}
	<div class="grid">
		{#each players as player (player.id)}
			<input type="text" class="secondary" on:keydown={(e) => e.key === "Delete" && removePlayerSpecific(player)} bind:value={player.name} />
		{/each}
	</div>
{/if}

<input placeholder={`Player ${players.length + 1}`} on:keydown={(e) => e.key === "Enter" && addPlayer()} type="text" bind:value={textInput} />
<div class="grid">
	{#if players.length == 7}
		<button disabled>Maximum player count reached</button>
	{:else}
		<button on:click={addPlayer}>Add</button>
	{/if}

	{#if players.length == 0}
		<button class="secondary" disabled>Remove</button>
	{:else}
		<button class="secondary" on:click={removePlayer}>Remove</button>
	{/if}
</div>
