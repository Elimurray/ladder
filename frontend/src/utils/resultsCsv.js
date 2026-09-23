const toLocalDateString = (dateString) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const escapeCell = (value) => {
  if (value === null || value === undefined) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
};

const HEADERS = [
  "Week",
  "P1 Position",
  "Player 1",
  "P1 Games",
  "P2 Games",
  "Player 2",
  "P2 Position",
  "Winner",
  "Levels",
  "Set Scores",
];

export const resultsToCsv = (matches) => {
  const rows = matches.map((m) => [
    toLocalDateString(m.week_date),
    m.player1_position,
    m.player1_name,
    m.player1_games_won,
    m.player2_games_won,
    m.player2_name,
    m.player2_position,
    m.winner,
    m.player1_levels && m.player2_levels ? "Yes" : "No",
    m.player1_set_scores?.sets?.join(", "),
  ]);

  return [HEADERS, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
};

export const downloadCsv = (csv, filename) => {
  // BOM so Excel reads UTF-8 names correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
