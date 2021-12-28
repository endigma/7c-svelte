<script lang="ts">
	import ScoreEditor from "./components/ScoreEditor.svelte";
	import PlayerManager from "./components/PlayerManager.svelte";

	import type { Player } from './types'

	let players: Player[] = [];
</script>

<div>
	<div>
		
	</div>
</div>

<main class="container-fluid">
	<PlayerManager bind:players={players}/>

	<hr>
	
	<ScoreEditor bind:players={players} />
</main>

<main class="container">
</main>
