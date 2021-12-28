/// <reference types="svelte" />

import App from './App.svelte';
import "./css/pico.scss";
import "./css/global.css"

const app = new App({
	target: document.body
});

export default app;