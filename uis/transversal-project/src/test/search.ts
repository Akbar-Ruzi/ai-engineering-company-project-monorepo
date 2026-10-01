import { sampleClaims, sampleClinicians } from "../data/sampleData";
import { binarySearchClaimById, findClaimById, findClinicianById } from "../utils/search";
import { sortClaimsById } from "../utils/collections";
import type { TestOutput } from "./output";

export function setupSearchTests({ output }: TestOutput) {
    const sortedClaims = sortClaimsById(sampleClaims, "asc");
    const searches = [
        {
            selector: "#find-claim-id",
            label: "claim",
            find: (id: string) => findClaimById(sampleClaims, id),
        },
        {
            selector: "#find-clinician-id",
            label: "clinician",
            find: (id: string) => findClinicianById(sampleClinicians, id),
        },
        {
            selector: "#binary-search-claim-id",
            label: "claim",
            find: (id: string) => {
                const index = binarySearchClaimById(sortedClaims, id);
                return index === -1
                    ? null
                    : `Index in claims sorted by ID ascending (zero-based): ${index}\n${JSON.stringify(sortedClaims[index], null, 2)}`;
            },
        },
    ];

    const resets = searches.map(({ selector, label, find }) => {
        const input = document.querySelector<HTMLInputElement>(selector)!;
        let searchTimeout: ReturnType<typeof setTimeout> | undefined;

        function cancelSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = undefined;
        }

        function showResult() {
            cancelSearch();
            if (!output) return;
            const id = input.value.trim();
            const result = id ? find(id) : null;
            output.textContent = !id
                ? `Enter a ${label} ID to search.`
                : result
                ? typeof result === "string" ? result : JSON.stringify(result, null, 2)
                : `No ${label} found with ID ${id}.`;
        }

        input.addEventListener("input", () => {
            cancelSearch();
            if (!output) return;
            if (!input.value.trim()) {
                showResult();
                return;
            }

            output.textContent = "Searching...";
            searchTimeout = setTimeout(showResult, 300);
        });

        input.addEventListener("blur", () => {
            if (searchTimeout !== undefined) showResult();
        });

        return () => {
            cancelSearch();
            input.value = "";
        };
    });

    return () => resets.forEach((reset) => reset());
}
