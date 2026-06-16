import { appendFileSync } from "node:fs";

type SummaryRow = readonly [label: string, value: string | number | bigint];

const renderRows = (rows: readonly SummaryRow[]) =>
  rows
    .map(
      ([label, value]) =>
        `| ${label.replaceAll("|", "\\|")} | ${String(value).replaceAll("|", "\\|")} |`,
    )
    .join("\n");

export const appendEvidenceSummary = (
  title: string,
  rows: readonly SummaryRow[],
) => {
  const markdown = [
    `### ${title}`,
    "",
    "| Evidence | Value |",
    "| --- | --- |",
    renderRows(rows),
    "",
  ].join("\n");

  console.log(markdown);

  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (summaryPath) appendFileSync(summaryPath, markdown);
};

export const inputRef = (input: {
  transactionId(): unknown;
  index(): unknown;
}) => `${input.transactionId()}#${input.index()}`;
