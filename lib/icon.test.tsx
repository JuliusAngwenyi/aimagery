import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icon";

describe("Icon", () => {
  const testPath = "M12 2L2 22h20L12 2z";

  it("renders an SVG with the given path", () => {
    const { container } = render(<Icon path={testPath} />);
    const svg = container.querySelector("svg");
    const path = container.querySelector("path");

    expect(svg).toBeInTheDocument();
    expect(path).toHaveAttribute("d", testPath);
  });

  it("sets width and height from size prop (number)", () => {
    const { container } = render(<Icon path={testPath} size={32} />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("sets width and height from size prop (string)", () => {
    const { container } = render(<Icon path={testPath} size="48" />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("defaults to size 24 when size is omitted", () => {
    const { container } = render(<Icon path={testPath} />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("does not use transform scale for sizing", () => {
    const { container } = render(<Icon path={testPath} size={2} />);
    const svg = container.querySelector("svg")!;

    expect(svg).not.toHaveAttribute("transform");
  });

  it("is aria-hidden when no title is provided (decorative)", () => {
    const { container } = render(<Icon path={testPath} />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("has role=img and title when title is provided", () => {
    render(<Icon path={testPath} title="My Icon" />);
    const svg = screen.getByRole("img", { name: "My Icon" });

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "false");
    expect(svg.querySelector("title")).toHaveTextContent("My Icon");
  });

  it("uses currentColor fill by default", () => {
    const { container } = render(<Icon path={testPath} />);
    const path = container.querySelector("path")!;

    expect(path).toHaveAttribute("fill", "currentColor");
  });

  it("applies custom fill color", () => {
    const { container } = render(<Icon path={testPath} fill="red" />);
    const path = container.querySelector("path")!;

    expect(path).toHaveAttribute("fill", "red");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Icon path={testPath} className="text-blue-500" />,
    );
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveClass("text-blue-500");
  });
});
