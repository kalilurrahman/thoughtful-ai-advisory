import * as React from "react";
/** Primary action control. One primary per view; secondary for alternates; seal for sign-off/attestation.
 * @startingPoint section="Core" subtitle="Buttons — primary, secondary, ghost, danger, seal" viewport="700x220" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "seal";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}
export function Button(props: ButtonProps): JSX.Element;
