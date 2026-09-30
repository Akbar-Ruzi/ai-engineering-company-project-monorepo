export function setupOutput() {
    const output = document.querySelector<HTMLPreElement>("#output");
    const outputPanel = document.querySelector<HTMLElement>("#output-panel");
    let activeSection: HTMLElement | null = null;

    // Keep one output panel and move it below the section being used.
    function moveOutput(event: Event) {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !outputPanel || !output) return;
        if (outputPanel.contains(target)) return;

        const section = target.closest("section");
        if (!section) return;
        if (section !== activeSection) {
            activeSection = section;
            const outputAnchor = section.closest("[data-output-group]") ?? section;
            outputAnchor.after(outputPanel);
            outputPanel.hidden = false;
            output.textContent = section.contains(document.querySelector("#appointment-status"))
                ? "Select an appointment status to see the result..."
                : section.querySelector("#claim-group-key")
                ? "Select a grouping to see the result..."
                : section.querySelector("#find-claim-id")
                ? "Enter a claim or clinician ID to search."
                : "Click a test button to see the result...";
        }

        const button = target.closest("button");
        if (event.type === "click" && button && !["filter-claims", "reset-filters", "sort-claims-asc", "sort-claims-desc", "sort-appointments-asc", "sort-appointments-desc"].includes(button.id)) {
            output.textContent = `${button.textContent?.trim()}: this test is not connected yet.`;
        }
    }

    document.querySelector("main")?.addEventListener("focusin", moveOutput);
    document.querySelector("main")?.addEventListener("click", moveOutput, true);

    return { output, moveOutput };
}

export type TestOutput = ReturnType<typeof setupOutput>;

export function setupClearOutput(output: TestOutput, resetFilters: () => void) {
    document.querySelector("#clear-output")?.addEventListener("click", () => {
        resetFilters();
        if (output.output) output.output.textContent = "";
    });
}
