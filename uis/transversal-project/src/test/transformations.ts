import { sampleClaims } from "../data/sampleData";
import { calculateDenialRate } from "../utils/transformations";
import type { TestOutput } from "./output";

export function setupTransformationTests({ output }: TestOutput) {
    document.querySelector("#denial-rate")?.addEventListener("click", () => {
        if (!output) return;

        try {
            const rate = calculateDenialRate(sampleClaims);
            output.textContent = `Denial rate: ${rate.toFixed(2)}%`;
        } catch (error) {
            output.textContent = error instanceof Error ? error.message : String(error);
        }
    });
}
