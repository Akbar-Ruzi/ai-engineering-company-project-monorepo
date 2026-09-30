import "./partialHtmls";
import { setupOutput, setupClearOutput } from "./output";
import { setupClaimTests } from "./claims";
import { setupAppointmentTests } from "./appointments";
import { setupSearchTests } from "./search";

const output = setupOutput();
const resetClaims = setupClaimTests(output);
const resetAppointments = setupAppointmentTests(output);
const resetSearch = setupSearchTests(output);

setupClearOutput(output, () => {
    resetClaims();
    resetAppointments();
    resetSearch();
});
