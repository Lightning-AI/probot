/* eslint-disable @typescript-eslint/no-unused-vars */
import { SubProjConfig } from "../types";
/* eslint-enable @typescript-eslint/no-unused-vars */
import minimatch from "minimatch";

/**
 * Returns a list of sub-projects inferred from the files in
 * pull requests.
 *
 * @param filenames The list of files listed in pull requests.
 */
export const matchFilenamesToSubprojects = (
  filenames: string[],
  subprojConfigs: SubProjConfig[],
): SubProjConfig[] => {
  const matchingSubProjs: SubProjConfig[] = [];
  subprojConfigs.forEach((subproj) => {
    const hits: Set<string> = new Set();
    subproj.paths.forEach((path: string) => {
      // support for GitHub-style path exclusion
      // https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#example-including-and-excluding-paths
      const isNegation = path.startsWith("!")
      // https://www.npmjs.com/package/minimatch
      const matches = minimatch.match(filenames, path, {"flipNegate": isNegation})
      // if it's a negation, delete from the list of hits, otherwise add
      matches.forEach((match: string) => (isNegation) ? hits.delete(match): hits.add(match))
    });
    if (hits.size) {
      const updatedSubProj = subproj;
      updatedSubProj.paths = Array.from(hits);
      matchingSubProjs.push(updatedSubProj);
    }
  });
  return matchingSubProjs;
};
