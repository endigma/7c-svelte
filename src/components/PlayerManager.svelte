<script lang="ts">
	import type { Player } from '../types'

	import "../css/player.css"

	export let players: Player[];

	var textInput: string;

	function removePlayer(): void {
		players = players.slice(0, -1);
	}

	function addPlayer(event): void {
		let name = event.detail.text == undefined ? `Player ${players.length + 1}` : event.detail.text;

		let newplayer: Player = {
			id: players.length + 1,
			name: name,
			scores: new Map<string, number>([]),
		}

		players = [...players, newplayer];
	}
</script>

<h3>Players</h3>

{#if players.length != 0}
<div class="grid">
	{#each players as player (player.id)}
	<div class="player">
		<p>{player.name}</p>
	</div>
	{/each}
</div>
	<!-- <table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Total Score</th>
			</tr>
		</thead>
		<tbody>
			{#each players as player (player.id)}
				<tr>
					<td>{player.name}</td>
					<td>{Object.values(player.scores).reduce((acc, val) => acc + val, 0)}</td>
				</tr>
			{/each}
		</tbody>
	</table> -->
{/if}

<input placeholder={`Player ${players.length + 1}`} type="text" bind:value={textInput} />
<div class="grid">
	<button on:click={addPlayer}>Add</button>
	<button class="secondary" on:click={removePlayer}>Remove</button>
</div>
