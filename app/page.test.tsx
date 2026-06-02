import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock complex child components to keep this test focused.
vi.mock("@/components/examples/built-in-auth/application-context", () => ({
  ApplicationContext: () => <div data-testid="app-context" />,
}));
vi.mock(
  "@/components/examples/built-in-auth/with-xmc/list-languages",
  () => ({
    ListLanguagesFromClientSdk: () => <div data-testid="list-languages" />,
  }),
);
vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the page heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /marketplace sdk demo/i }),
    ).toBeInTheDocument();
  });

  it("renders the SDK description", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/marketplace sdk with custom authentication/i),
    ).toBeInTheDocument();
  });

  it("renders the child example components", () => {
    render(<HomePage />);
    expect(screen.getByTestId("app-context")).toBeInTheDocument();
    expect(screen.getByTestId("list-languages")).toBeInTheDocument();
  });

  it("has the correct export name (HomePage, not Examples)", () => {
    expect(HomePage.name).toBe("HomePage");
  });
});
