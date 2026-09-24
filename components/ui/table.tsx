import type { ComponentPropsWithRef } from "react"

import styles from "./table.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function Table({ className, ...props }: ComponentPropsWithRef<"table">) {
  return (
    <div className={styles.scroll} data-table-scroll>
      <table className={classes(styles.table, className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: ComponentPropsWithRef<"thead">) {
  return <thead className={classes(styles.header, className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentPropsWithRef<"tbody">) {
  return <tbody className={classes(styles.body, className)} {...props} />
}

export function TableFooter({ className, ...props }: ComponentPropsWithRef<"tfoot">) {
  return <tfoot className={classes(styles.footer, className)} {...props} />
}

export function TableRow({ className, ...props }: ComponentPropsWithRef<"tr">) {
  return <tr className={classes(styles.row, className)} {...props} />
}

type CellAlign = "start" | "center" | "end"

export type TableHeadProps = Omit<ComponentPropsWithRef<"th">, "align"> & { align?: CellAlign }

export function TableHead({ align = "start", className, scope = "col", ...props }: TableHeadProps) {
  return <th className={classes(styles.head, className)} data-align={align} scope={scope} {...props} />
}

export type TableCellProps = Omit<ComponentPropsWithRef<"td">, "align"> & { align?: CellAlign }

export function TableCell({ align = "start", className, ...props }: TableCellProps) {
  return <td className={classes(styles.cell, className)} data-align={align} {...props} />
}

export function TableCaption({ className, ...props }: ComponentPropsWithRef<"caption">) {
  return <caption className={classes(styles.caption, className)} {...props} />
}
