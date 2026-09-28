import "./partialHtmls";
import { setupOutput, setupClearOutput } from "./output";
import { setupClaimTests } from "./claims";
import { setupAppointmentTests } from "./appointments";

const output = setupOutput();
const resetClaims = setupClaimTests(output);
const resetAppointments = setupAppointmentTests(output);

setupClearOutput(output, () => {
    resetClaims();
    resetAppointments();
});
