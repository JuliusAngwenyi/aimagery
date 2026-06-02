import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders children with the card data-slot", () => {
    render(<Card>Card content</Card>);
    const el = screen.getByText("Card content");
    expect(el).toHaveAttribute("data-slot", "card");
  });

  it("applies custom className", () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText("Content")).toHaveClass("custom-class");
  });

  it("accepts the appearance='outline' variant", () => {
    render(<Card appearance="outline">Outlined</Card>);
    const el = screen.getByText("Outlined");
    expect(el).toHaveClass("bg-body-bg");
    expect(el).toHaveClass("border-border-color");
  });

  it("accepts the appearance='filled' variant", () => {
    render(<Card appearance="filled">Filled</Card>);
    const el = screen.getByText("Filled");
    expect(el).toHaveClass("bg-subtle-bg");
  });

  it("defaults to appearance='flat'", () => {
    render(<Card>Flat</Card>);
    const el = screen.getByText("Flat");
    expect(el).toHaveClass("bg-body-bg");
    expect(el).toHaveClass("border-transparent");
  });

  it("does not accept a 'style' variant prop (renamed to appearance)", () => {
    // TypeScript would catch this, but verify at runtime that style is
    // treated as the native React style prop, not a CVA variant.
    render(<Card style={{ color: "red" }}>Styled</Card>);
    const el = screen.getByText("Styled");
    expect(el.style.color).toBe("red");
  });
});

describe("Card sub-components", () => {
  it("CardHeader renders with correct data-slot", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toHaveAttribute(
      "data-slot",
      "card-header",
    );
  });

  it("CardTitle renders with correct data-slot", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
  });

  it("CardDescription renders with correct data-slot", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
  });

  it("CardContent renders with correct data-slot", () => {
    render(<CardContent>Card body</CardContent>);
    expect(screen.getByText("Card body")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
  });

  it("CardFooter renders with correct data-slot", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
  });
});
