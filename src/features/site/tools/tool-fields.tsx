import { Fragment, type ReactNode } from "react";
import { NO_SOURCE_MESSAGE, getControl } from "../content";
import { ControlLinks } from "../ui";

/** Field definition for the interactive tools (mirrors platform/app/website/aegis_website/tools.py). */
export interface ToolFieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  hint?: string;
  rows?: number;
  options?: ReadonlyArray<readonly [string, string]>;
}

export interface ToolFieldsProps {
  prefix: string;
  fields: readonly ToolFieldDef[];
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
  /** Receives each control element so the parent can move focus to an invalid field. */
  controlRef?: (name: string, el: HTMLElement | null) => void;
}

/** Generic labelled tool fields (port of templates/partials/tool_fields.html). */
export function ToolFields({
  prefix,
  fields,
  values,
  errors,
  onChange,
  controlRef,
}: ToolFieldsProps) {
  return (
    <>
      {fields.map((f) => {
        const fid = `${prefix}-${f.name}`;
        const error = errors[f.name];
        const describedBy =
          [f.hint ? `${fid}-hint` : "", error ? `${fid}-error` : ""].filter(Boolean).join(" ") ||
          undefined;
        const common = {
          id: fid,
          name: f.name,
          value: values[f.name] ?? "",
          required: f.required || undefined,
          "aria-describedby": describedBy,
          "aria-invalid": error ? (true as const) : undefined,
          ref: (el: HTMLElement | null) => controlRef?.(f.name, el),
        };
        let control: ReactNode;
        if (f.type === "select") {
          control = (
            <select {...common} onChange={(e) => onChange(f.name, e.target.value)}>
              {(f.options ?? []).map(([val, lab]) => (
                <option key={val} value={val}>
                  {lab}
                </option>
              ))}
            </select>
          );
        } else if (f.type === "textarea") {
          control = (
            <textarea
              {...common}
              rows={f.rows ?? 3}
              maxLength={2000}
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          );
        } else {
          control = (
            <input
              {...common}
              type="text"
              maxLength={200}
              autoComplete="off"
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          );
        }
        return (
          <div className={f.type === "textarea" ? "field field--wide" : "field"} key={f.name}>
            <label htmlFor={fid}>
              {f.label}
              {f.required && (
                <>
                  {" "}
                  <span className="req">(required)</span>
                </>
              )}
            </label>
            {f.hint && (
              <p className="hint" id={`${fid}-hint`}>
                {f.hint}
              </p>
            )}
            {control}
            <p className="field-error" id={`${fid}-error`} hidden={!error}>
              {error ?? ""}
            </p>
          </div>
        );
      })}
    </>
  );
}

/** `<dl class="kv">` of label/value pairs; empty values are skipped (tools-common.js kv()). */
export function KeyValues({ pairs }: { pairs: ReadonlyArray<readonly [string, ReactNode]> }) {
  const shown = pairs.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="kv">
      {shown.map(([k, v]) => (
        <Fragment key={k}>
          <dt>{k}</dt>
          <dd>{typeof v === "number" || typeof v === "boolean" ? String(v) : v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** Scrollable, labelled data table; the first cell of each row is a row header (tools-common.js table()). */
export function ResultTable({
  label,
  headers,
  rows,
}: {
  label: string;
  headers: readonly string[];
  rows: ReadonlyArray<ReadonlyArray<ReactNode>>;
}) {
  return (
    <div className="table-wrap" role="region" tabIndex={0} aria-label={label}>
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th scope="row" key={j}>
                    {c}
                  </th>
                ) : (
                  <td key={j}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Control links with the "no source" fallback used by the original tools. */
export function CitedControls({ ids, prefix }: { ids: readonly string[]; prefix: string }) {
  const known = ids.filter((id) => getControl(id));
  if (!known.length) {
    return (
      <p className="cite">
        {prefix}
        {NO_SOURCE_MESSAGE}
      </p>
    );
  }
  return <ControlLinks ids={known} prefix={prefix} />;
}

/** Status line (role=status) using the original `.form-status.is-*` classes. */
export function FormStatus({
  id,
  text,
  kind,
  as = "div",
}: {
  id: string;
  text: string;
  kind: "" | "error" | "success";
  as?: "div" | "span";
}) {
  const Tag = as;
  return (
    <Tag
      className={kind ? `form-status is-${kind}` : "form-status"}
      id={id}
      role="status"
      aria-live="polite"
    >
      {text}
    </Tag>
  );
}
