import "./partialHtmls";
import { setupOutput, setupClearOutput } from "./output";
import { setupClaimTests } from "./claims";
import { setupAppointmentTests } from "./appointments";
import { setupSearchTests } from "./search";
import { setupTransformationTests } from "./transformations";

const output = setupOutput();
const resetClaims = setupClaimTests(output);
const resetAppointments = setupAppointmentTests(output);
const resetSearch = setupSearchTests(output);
const resetTransformations = setupTransformationTests(output);

setupClearOutput(output, () => {
  resetClaims();
  resetAppointments();
  resetSearch();
  resetTransformations();
});
