export function showResult(
  output: HTMLPreElement | null,
  title: string,
  result: unknown,
  readable: string,
  rawText?: string,
) {
  if (!output) return;
  const rawResult = document.createElement("span");
  rawResult.textContent =
    rawText ?? JSON.stringify(result, null, 2) ?? String(result);
  const formattedResult = document.createElement("span");
  formattedResult.textContent = readable;
  const results = document.createElement("span");
  results.style.display = "flex";
  results.style.flexWrap = "wrap";
  results.style.columnGap = "8rem";
  results.style.rowGap = "1.5rem";
  results.append(rawResult, formattedResult);
  output.replaceChildren(`${title}\n`, results);
}

export function setupOutput() {
  const output = document.querySelector<HTMLPreElement>("#output");
  const outputPanel = document.querySelector<HTMLElement>("#output-panel");
  let activeSection: HTMLElement | null = null;

  function clearActiveButton() {
    document
      .querySelectorAll<HTMLButtonElement>('main button[aria-pressed="true"]')
      .forEach((button) => button.setAttribute("aria-pressed", "false"));
  }

  document
    .querySelectorAll<HTMLButtonElement>("main section button")
    .forEach((button) => {
      if (!["clear-output", "reset-filters"].includes(button.id)) {
        button.setAttribute("aria-pressed", "false");
      }
    });

  // Keep one output panel and move it below the section being used.
  function moveOutput(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !outputPanel || !output) return;
    if (outputPanel.contains(target)) return;

    // Moving the panel on button focus can shift the button before mouseup,
    // preventing the first click from reaching it. Wait for the click instead.
    const button = target.closest("button");
    if (event.type === "focusin" && button) return;

    const section = target.closest("section");
    if (!section) return;
    const noShowCostButton = section.querySelector("#no-show-cost");
    const isNoShowCostControl = [
      "no-show-cost",
      "no-show-location",
      "no-show-week-ending",
    ].includes(button?.id ?? target.id);
    const outputAnchor =
      (isNoShowCostControl ? noShowCostButton?.parentElement : null) ??
      section.closest("[data-output-group]") ??
      section;
    outputAnchor.after(outputPanel);
    if (section !== activeSection) {
      clearActiveButton();
      activeSection = section;
      outputPanel.hidden = false;
      output.textContent = section.contains(
        document.querySelector("#appointment-status"),
      )
        ? "Select an appointment status to see the result..."
        : section.querySelector("#claim-group-key")
          ? "Select a grouping to see the result..."
          : section.querySelector("#find-claim-id")
            ? "Enter a claim or clinician ID to search."
            : "Click a test button to see the result...";
    }

    if (event.type === "click" && button) {
      clearActiveButton();
      if (button.id !== "reset-filters") {
        button.setAttribute("aria-pressed", "true");
      }
    }
    if (
      event.type === "click" &&
      button &&
      ![
        "filter-claims",
        "reset-filters",
        "sort-claims-asc",
        "sort-claims-desc",
        "sort-appointments-asc",
        "sort-appointments-desc",
        "denial-rate",
        "denial-payer",
        "denial-location",
        "flag-high-denial-payers",
        "no-show-cost",
        "no-show-rate-location",
      ].includes(button.id)
    ) {
      output.textContent = `${button.textContent?.trim()}: this test is not connected yet.`;
    }
  }

  document.querySelector("main")?.addEventListener("focusin", moveOutput);
  document.querySelector("main")?.addEventListener("click", moveOutput, true);
  document.querySelector("main")?.addEventListener("input", clearActiveButton);
  document.querySelector("main")?.addEventListener("change", clearActiveButton);

  return { output, moveOutput, clearActiveButton };
}

export type TestOutput = ReturnType<typeof setupOutput>;

export function setupClearOutput(output: TestOutput, resetFilters: () => void) {
  document.querySelector("#clear-output")?.addEventListener("click", () => {
    output.clearActiveButton();
    resetFilters();
    if (output.output) output.output.textContent = "";
  });
}
