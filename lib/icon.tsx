import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  path: string;
  title?: string;
  size?: number | string;
  className?: string;
  fill?: string;
};

export function Icon({
  path,
  title,
  size = 24,
  className,
  fill = "currentColor",
  ...rest
}: IconProps) {
  const numericSize = typeof size === "string" ? parseFloat(size) || 24 : size;

  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      aria-hidden={!title}
      aria-label={title}
      role={title ? "img" : undefined}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} fill={fill} />
    </svg>
  );
}
