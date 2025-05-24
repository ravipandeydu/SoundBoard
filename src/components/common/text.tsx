import clsx from "clsx";
import { Link } from "./link";

export function Text({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(
        className,
        "text-base/6 text-zinc-600 sm:text-sm/6 dark:text-zinc-300"
      )}
    />
  );
}

export function TextLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        "text-zinc-800 underline decoration-zinc-800/50 data-hover:decoration-zinc-800 dark:text-zinc-200 dark:decoration-zinc-200/50 dark:data-hover:decoration-zinc-200"
      )}
    />
  );
}

export function Strong({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"strong">) {
  return (
    <strong
      {...props}
      className={clsx(
        className,
        "font-medium text-zinc-800 dark:text-zinc-200"
      )}
    />
  );
}

export function Code({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  return (
    <code
      {...props}
      className={clsx(
        className,
        "rounded-sm border border-zinc-800/10 bg-zinc-800/[2.5%] px-0.5 text-sm font-medium text-zinc-800 sm:text-[0.8125rem] dark:border-zinc-200/20 dark:bg-zinc-200/5 dark:text-zinc-200"
      )}
    />
  );
}
