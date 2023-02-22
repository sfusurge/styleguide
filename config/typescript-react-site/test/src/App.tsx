import React from "react";

import "./App.css";
import Data from "./test.jsonc";

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
					Learn React. {Data.hello}
				</a>
			</header>
		</div>
	);
}

export default App;
