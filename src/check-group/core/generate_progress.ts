import { CheckResult, CheckRunData, SubProjConfig } from "../types";
import { Context } from "probot";


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
    return `[${check}](${checkData.details_url})`
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
  progress += "\n";

  progress += "## Currently received checks\n";
  let longestLength = 1;
  for (const availableCheck in postedChecks) {
    longestLength = Math.max(longestLength, availableCheck.length);
  }
  for (const availableCheck in postedChecks) {
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
  let progress = "## Groups summary\n";
  subprojects.forEach((subproject) => {
    // create a map of the relevant checks with their status
    let subprojectCheckStatus: Record<string, string> = {}
    subproject.checks.forEach((check) => {
      let status = (check in postedChecks) ? postedChecks[check].conclusion : 'no_status'
      subprojectCheckStatus[check] = status
    });
    // get the aggregated status of all statuses in the subproject
    let subprojectEmoji: string = "⌛"
    if (Object.values(subprojectCheckStatus).filter(v => v === "failure").length > 0) {
        subprojectEmoji = "❌";
    } else if (Object.values(subprojectCheckStatus).every(v => v === "success")) {
        subprojectEmoji = "✅";
    }
    // generate the markdown table
    progress += "<details>\n\n"
    progress += `<summary><b>${subprojectEmoji} ${subproject.id}</b></summary>\n\n`;
    progress += "| Check ID | Status |     |\n";
    progress += "| -------- | ------ | --- |\n";
    for (const [check, status] of Object.entries(subprojectCheckStatus)) {
      const link = statusToLink(check, postedChecks);
      const status = parseStatus(check, postedChecks);
      const mark = statusToMark(check, postedChecks);
      progress += `| ${link} | ${status} | ${mark} |\n`;
    }
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
    `\n**⚠️ This job will need to be re-run to merge your PR.`
    + ` If you do not have write access to the repository you can ask \`${inputs.maintainers}\` to re-run it for you.`
    + " If you push a new commit, all of CI will re-trigger ⚠️**"
    + ` If you have any other questions, you can reach out to \`${inputs.owner}\` for help.`
  )
  const progressDetails = generateProgressDetailsMarkdown(subprojects, postedChecks)
  return (
    PR_COMMENT_START
    + `\n# ${lightning} Required checks status: ${parsedConclusion} ${conclusionEmoji}`
    + ((hasFailed) ? failedMesage : "")
    + ((subprojects.length) ? `\n${progressDetails}` : "\nNo groups match the files changed in this PR.")
    + "\n\n---"
    + `\nThis comment was automatically generated and updates for ${inputs.timeout} minutes `
    + `every ${inputs.interval} seconds.`
    + "\n\nThank you for your contribution! 💜"
  )
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