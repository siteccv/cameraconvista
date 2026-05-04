import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders accessible button text", () => {
    render(<Button>Invia</Button>);
    expect(screen.getByRole("button", { name: "Invia" })).toBeInTheDocument();
  });
});
