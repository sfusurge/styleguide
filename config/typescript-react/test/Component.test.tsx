import { render, screen } from "@testing-library/react";

import React from "react";

import Component from "./Component";

test("renders", () => {
	render(<Component />);
	const renderedElement = screen.getByText(/Hello!/);
	expect(renderedElement).toBeInTheDocument();
});
