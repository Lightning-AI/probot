import { CheckResult, CheckRunData, SubProjConfig } from "../types";
import { Context } from "probot";
import { getChecksResult } from "./satisfy_expected_checks";


const statusToMark = (
  check: string,
  postedChecks: Record<string, CheckRunData>,
): string => {
  if (check in postedChecks) {
    if (postedChecks[check].conclusion === "success") {
      return "✅";
    }
    if (postedChecks[check].conclusion === "failure") {
      return "❌";
    }
    if (postedChecks[check].conclusion === "cancelled") {
      return "🚫";
    }
    if (postedChecks[check].conclusion === null) {
      return "⌛";  // pending
    }
  }
  return "❓";
};

const statusToLink = (
  check: string,
  postedChecks: Record<string, CheckRunData>,
): string  => {
  if (check in postedChecks) {
    const checkData = postedChecks[check]
    // assert(checkData.name === check)
    // if the check name contains the character "|", it will break the table rendering
    const sanitizedCheck = check.replace(/\|/g, "\\|")
    return `[${sanitizedCheck}](${checkData.details_url})`
  }
  return check
}

const parseStatus = (
  check: string,
  postedChecks: Record<string, CheckRunData>,
): string  => {
  if (check in postedChecks) {
    const checkData = postedChecks[check]
    if (checkData.conclusion === null) {
      return checkData.status
    } else {
      return checkData.conclusion
    }
  }
  return "no_status"
}

export const generateProgressDetailsCLI = (
  subprojects: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): string => {
  let progress = "";

  // these are the required subprojects
  subprojects.forEach((subproject) => {
    progress += `Summary for sub-project ${subproject.id}\n`;
    // for padding
    const longestLength = Math.max(...(subproject.checks.map(check => check.length)));
    subproject.checks.forEach((check) => {
      const mark = statusToMark(check, postedChecks);
      const status = parseStatus(check, postedChecks);
      progress += `${check.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
    });
    progress += "\n\n";
  });
  progress += "\n\n";
  progress += "## Currently received checks\n";
  let longestLength = 1;
  for (const availableCheck in postedChecks) {
    longestLength = Math.max(longestLength, availableCheck.length);
  }
  const sortedPostedChecks: Record<string, CheckRunData> = Object.fromEntries(
      Object.keys(postedChecks).sort().map(key => [key, postedChecks[key]]) // Map sorted keys back to their values
  );
  for (const availableCheck in sortedPostedChecks) {
    const mark = statusToMark(availableCheck, postedChecks);
    const status = parseStatus(availableCheck, postedChecks);
    progress += `${availableCheck.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
  }
  progress += "\n";
  return progress;
};

export const generateProgressDetailsMarkdown = (
  subprojects: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): string => {
  const TOTAL_PATHS_CHAR_BUDGET = 50000;
  const PATHS_SOFT_CHAR_LIMIT = 1000;
  const perSubjectPathCharSoftLimit = Math.min(PATHS_SOFT_CHAR_LIMIT, Math.max(100, Math.floor(TOTAL_PATHS_CHAR_BUDGET / (subprojects.length || 1))));
  let progress = "## Groups summary\n\n";
  subprojects.forEach((subproject) => {
    // get the aggregated status of all statuses in the subproject
    const checkResult = getChecksResult(subproject.checks, postedChecks)
    let subprojectEmoji = "🟡";
    if (checkResult === "all_passing") {
      subprojectEmoji = "🟢";
    } else if (checkResult === "has_failure") {
      subprojectEmoji = "🔴";
    }
    // generate the markdown table
    progress += "<details>\n\n"
    progress += `<summary><b>${subprojectEmoji} ${subproject.id}</b></summary>\n\n`;
    progress += "| Check ID | Status |     |\n";
    progress += "| -------- | ------ | --- |\n";
    subproject.checks.forEach((check) => {
      const link = statusToLink(check, postedChecks);
      const status = parseStatus(check, postedChecks);
      const mark = statusToMark(check, postedChecks);
      progress += `| ${link} | ${status} | ${mark} |\n`;
    })
    let pathsStr = "";
    for (const p of subproject.paths) {
      const entry = pathsStr ? `, \`${p}\`` : `\`${p}\``;
      pathsStr += entry;
      if (pathsStr.length > perSubjectPathCharSoftLimit) {
        const remaining = subproject.paths.length - (pathsStr.match(/`[^`]+`/g) || []).length;
        if (remaining >= 2) {
          pathsStr += `, and ${remaining} more files`;
          break;
        }
      }
    }
    progress += `\nThese checks are required after the changes to ${pathsStr}.\n`
    progress += "\n</details>\n\n";
  });
  return progress;
};

const PR_COMMENT_START = "<!-- checkgroup-comment-start -->";

function formPrComment(
  result: CheckResult,
  inputs: Record<string, any>,
  subprojects: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>
): string {
  let parsedConclusion = result.replace("_", " ")
  // capitalize
  parsedConclusion = parsedConclusion.charAt(0).toUpperCase() + parsedConclusion.slice(1);
  const hasFailed = result === "has_failure"
  const conclusionEmoji = (result === "all_passing") ? "🟢": (hasFailed) ? "🔴" : "🟡"
  const lightning = (result === "all_passing") ? "⚡": (hasFailed) ? "⛈️" : "🌩️"
  const failedMesage = (
    `> **Warning**\n> This job will need to be re-run to merge your PR.`
    + ` If you do not have write access to the repository, you can ask \`${inputs.maintainers}\` to re-run it.`
    + " If you push a new commit, all of CI will re-trigger.\n\n"
  )
  const sortedPostedChecks: Record<string, CheckRunData> = Object.fromEntries(
      Object.keys(postedChecks).sort().map(key => [key, postedChecks[key]]) // Map sorted keys back to their values
  );
  const progressDetails = generateProgressDetailsMarkdown(subprojects, sortedPostedChecks)
  const MAX_COMMENT_LENGTH_GITHUB = 65536;
  // Add some buffer in case we need it
  const MAX_COMMENT_LENGTH = MAX_COMMENT_LENGTH_GITHUB - 1000;
  let comment = (
    PR_COMMENT_START
    + `\n# ${lightning} Required checks status: ${parsedConclusion} ${conclusionEmoji}\n\n`
    + ((hasFailed) ? failedMesage : "")
    + ((subprojects.length) ? progressDetails : "No groups match the files changed in this PR.\n\n")
    + "---\n\n"
    + "Thank you for your contribution! 💜\n\n"
    + `> **Note**\n> This comment is automatically generated and updates for ${inputs.timeout} minutes every ${inputs.interval} seconds.`
    + ` If you have any other questions, contact \`${inputs.owner}\` for help.`
  )
  if (comment.length > MAX_COMMENT_LENGTH) {
    const suffix = "\n\n---\n\n> **Note**: Comment was truncated because it exceeded GitHub's 65536 character limit.";
    comment = comment.slice(0, MAX_COMMENT_LENGTH - suffix.length) + suffix;
  }
  return comment
}

async function getPrComment(context: Context): Promise<{id: number; body: string}> {
  const params = context.issue()
  const commentsRes = await context.octokit.rest.issues.listComments(params);
  for (const comment of commentsRes.data) {
    if (comment.body!.includes(PR_COMMENT_START)) {
      return {id: comment.id, body: comment.body!};
    }
  }
  return {id: 0, body: ""};
}


export async function commentOnPr(
  context: Context,
  result: CheckResult,
  inputs: Record<string, any>,
  subprojects: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
) {
  const existingData = await getPrComment(context);
  context.log.debug(`existingData: ${JSON.stringify(existingData)}`)
  const newComment = formPrComment(result, inputs, subprojects, postedChecks);
  if (existingData.body === newComment) {
    return;
  }
  if (existingData.id === 0) {
    await context.octokit.issues.createComment(context.issue({body: newComment}));
  } else {
    await context.octokit.issues.updateComment(
      context.repo({body: newComment, comment_id: existingData.id})
    );
  }
}
