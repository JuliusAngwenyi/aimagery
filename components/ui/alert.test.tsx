import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders with role=alert", () => {
    render(<Alert>Message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("supports variant='danger'", () => {
    render(<Alert variant="danger">Error!</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-danger-bg");
  });

  it("supports variant='success'", () => {
    render(<Alert variant="success">Done!</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-success-bg");
  });

  it("supports variant='warning'", () => {
    render(<Alert variant="warning">Heads up</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-warning-bg");
  });

  it("defaults to variant='default'", () => {
    render(<Alert>Info</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-primary-bg");
  });

  it("applies custom className", () => {
    render(<Alert className="my-class">Test</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("my-class");
  });
});

describe("Alert sub-components", () => {
  it("AlertTitle renders with data-slot", () => {
    render(<AlertTitle>Title</AlertTitle>);
    expect(screen.getByText("Title")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
  });

  it("AlertDescription renders with data-slot", () => {
    render(<AlertDescription>Description</AlertDescription>);
    expect(screen.getByText("Description")).toHaveAttribute(
      "data-slot",
      "alert-description",
    );
  });
});
