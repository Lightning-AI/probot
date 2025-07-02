import { CheckResult, CheckRunData, SubProjConfig } from "../types";

export const getChecksResult = (
  checks: string[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  for (const check of checks) {
    if (check in postedChecks) {
      const conclusion = postedChecks[check].conclusion;
      if (conclusion === null) {
        // the check is in progress
        result = "pending";
      } else if (conclusion !== "success") {
        // the check already failed
        return "has_failure";
      }
    } else {
      // the check is missing, hopefully queued
      result = "pending";
    }
  };
  return result;
}

export const getSubProjResult = (
  subProjs: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  for (const subProj of subProjs) {
    for (const check of subProj.checks) {
      if (check in postedChecks) {
        const conclusion = postedChecks[check].conclusion;
        if (conclusion === null) {
          // the check is in progress
          result = "pending";
        } else if (conclusion !== "success") {
          // the check already failed
          return "has_failure";
        }
      } else {
        // the check is missing, hopefully queued
        result = "pending";
      }
    };
  };
  return result;
};
