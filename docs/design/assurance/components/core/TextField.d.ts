import * as React from "react";
/** Labelled text input with hint / error line. */
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; iconLeft?: React.ReactNode; }
export function TextField(props: TextFieldProps): JSX.Element;
