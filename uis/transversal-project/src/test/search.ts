import { sampleClaims } from "../data/sampleData";
import { findClaimById } from "../utils/search";
import type { TestOutput } from "./output";

export function setupSearchTests({ output }: TestOutput) {
    const claimIdInput = document.querySelector<HTMLInputElement>("#find-claim-id")!;
    let searchTimeout: ReturnType<typeof setTimeout> | undefined;

    function cancelSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = undefined;
    }

    function showResult() {
        cancelSearch();
        if (!output) return;
        const claimId = claimIdInput.value.trim();
        const claim = findClaimById(sampleClaims, claimId);
        output.textContent = !claimId
            ? "Enter a claim ID to search."
            : claim
            ? JSON.stringify(claim, null, 2)
            : `No claim found with ID ${claimId}.`;
    }

    claimIdInput.addEventListener("input", () => {
        cancelSearch();
        if (!output) return;
        const claimId = claimIdInput.value.trim();
        if (!claimId) {
            showResult();
            return;
        }

        output.textContent = "Searching...";
        searchTimeout = setTimeout(showResult, 300);
    });

    claimIdInput.addEventListener("blur", () => {
        if (searchTimeout !== undefined) showResult();
    });

    return () => {
        cancelSearch();
        claimIdInput.value = "";
    };
}
