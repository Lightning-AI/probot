"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentOnPr = exports.generateProgressDetailsMarkdown = exports.generateProgressDetailsCLI = void 0;
var satisfy_expected_checks_1 = require("./satisfy_expected_checks");
var statusToMark = function (check, postedChecks) {
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
            return "⌛"; // pending
        }
    }
    return "❓";
};
var statusToLink = function (check, postedChecks) {
    if (check in postedChecks) {
        var checkData = postedChecks[check];
        // assert(checkData.name === check)
        // if the check name contains the character "|", it will break the table rendering
        var sanitizedCheck = check.replace(/\|/g, "\\|");
        return "[".concat(sanitizedCheck, "](").concat(checkData.details_url, ")");
    }
    return check;
};
var parseStatus = function (check, postedChecks) {
    if (check in postedChecks) {
        var checkData = postedChecks[check];
        if (checkData.conclusion === null) {
            return checkData.status;
        }
        else {
            return checkData.conclusion;
        }
    }
    return "no_status";
};
var generateProgressDetailsCLI = function (subprojects, postedChecks) {
    var progress = "";
    // these are the required subprojects
    subprojects.forEach(function (subproject) {
        progress += "Summary for sub-project ".concat(subproject.id, "\n");
        // for padding
        var longestLength = Math.max.apply(Math, (subproject.checks.map(function (check) { return check.length; })));
        subproject.checks.forEach(function (check) {
            var mark = statusToMark(check, postedChecks);
            var status = parseStatus(check, postedChecks);
            progress += "".concat(check.padEnd(longestLength, ' '), " | ").concat(mark, " | ").concat(status.padEnd(12, ' '), "\n");
        });
        progress += "\n\n";
    });
    progress += "\n\n";
    progress += "## Currently received checks\n";
    var longestLength = 1;
    for (var availableCheck in postedChecks) {
        longestLength = Math.max(longestLength, availableCheck.length);
    }
    var sortedPostedChecks = Object.fromEntries(Object.keys(postedChecks).sort().map(function (key) { return [key, postedChecks[key]]; }) // Map sorted keys back to their values
    );
    for (var availableCheck in sortedPostedChecks) {
        var mark = statusToMark(availableCheck, postedChecks);
        var status_1 = parseStatus(availableCheck, postedChecks);
        progress += "".concat(availableCheck.padEnd(longestLength, ' '), " | ").concat(mark, " | ").concat(status_1.padEnd(12, ' '), "\n");
    }
    progress += "\n";
    return progress;
};
exports.generateProgressDetailsCLI = generateProgressDetailsCLI;
var generateProgressDetailsMarkdown = function (subprojects, postedChecks) {
    var progress = "## Groups summary\n\n";
    subprojects.forEach(function (subproject) {
        // get the aggregated status of all statuses in the subproject
        var checkResult = (0, satisfy_expected_checks_1.getChecksResult)(subproject.checks, postedChecks);
        var subprojectEmoji = "🟡";
        if (checkResult === "all_passing") {
            subprojectEmoji = "🟢";
        }
        else if (checkResult === "has_failure") {
            subprojectEmoji = "🔴";
        }
        // generate the markdown table
        progress += "<details>\n\n";
        progress += "<summary><b>".concat(subprojectEmoji, " ").concat(subproject.id, "</b></summary>\n\n");
        progress += "| Check ID | Status |     |\n";
        progress += "| -------- | ------ | --- |\n";
        subproject.checks.forEach(function (check) {
            var link = statusToLink(check, postedChecks);
            var status = parseStatus(check, postedChecks);
            var mark = statusToMark(check, postedChecks);
            progress += "| ".concat(link, " | ").concat(status, " | ").concat(mark, " |\n");
        });
        progress += "\nThese checks are required after the changes to `".concat(subproject.paths.join("`, `"), "`.\n");
        progress += "\n</details>\n\n";
    });
    return progress;
};
exports.generateProgressDetailsMarkdown = generateProgressDetailsMarkdown;
var PR_COMMENT_START = "<!-- checkgroup-comment-start -->";
function formPrComment(result, inputs, subprojects, postedChecks) {
    var parsedConclusion = result.replace("_", " ");
    // capitalize
    parsedConclusion = parsedConclusion.charAt(0).toUpperCase() + parsedConclusion.slice(1);
    var hasFailed = result === "has_failure";
    var conclusionEmoji = (result === "all_passing") ? "🟢" : (hasFailed) ? "🔴" : "🟡";
    var lightning = (result === "all_passing") ? "⚡" : (hasFailed) ? "⛈️" : "🌩️";
    var failedMesage = ("> **Warning**\n> This job will need to be re-run to merge your PR."
        + " If you do not have write access to the repository, you can ask `".concat(inputs.maintainers, "` to re-run it.")
        + " If you push a new commit, all of CI will re-trigger.\n\n");
    var sortedPostedChecks = Object.fromEntries(Object.keys(postedChecks).sort().map(function (key) { return [key, postedChecks[key]]; }) // Map sorted keys back to their values
    );
    var progressDetails = (0, exports.generateProgressDetailsMarkdown)(subprojects, sortedPostedChecks);
    return (PR_COMMENT_START
        + "\n# ".concat(lightning, " Required checks status: ").concat(parsedConclusion, " ").concat(conclusionEmoji, "\n\n")
        + ((hasFailed) ? failedMesage : "")
        + ((subprojects.length) ? progressDetails : "No groups match the files changed in this PR.\n\n")
        + "---\n\n"
        + "Thank you for your contribution! 💜\n\n"
        + "> **Note**\n> This comment is automatically generated and updates for ".concat(inputs.timeout, " minutes every ").concat(inputs.interval, " seconds.")
        + " If you have any other questions, contact `".concat(inputs.owner, "` for help."));
}
function getPrComment(context) {
    return __awaiter(this, void 0, void 0, function () {
        var params, commentsRes, _i, _a, comment;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    params = context.issue();
                    return [4 /*yield*/, context.octokit.rest.issues.listComments(params)];
                case 1:
                    commentsRes = _b.sent();
                    for (_i = 0, _a = commentsRes.data; _i < _a.length; _i++) {
                        comment = _a[_i];
                        if (comment.body.includes(PR_COMMENT_START)) {
                            return [2 /*return*/, { id: comment.id, body: comment.body }];
                        }
                    }
                    return [2 /*return*/, { id: 0, body: "" }];
            }
        });
    });
}
function commentOnPr(context, result, inputs, subprojects, postedChecks) {
    return __awaiter(this, void 0, void 0, function () {
        var existingData, newComment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPrComment(context)];
                case 1:
                    existingData = _a.sent();
                    context.log.debug("existingData: ".concat(JSON.stringify(existingData)));
                    newComment = formPrComment(result, inputs, subprojects, postedChecks);
                    if (existingData.body === newComment) {
                        return [2 /*return*/];
                    }
                    if (!(existingData.id === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, context.octokit.issues.createComment(context.issue({ body: newComment }))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, context.octokit.issues.updateComment(context.repo({ body: newComment, comment_id: existingData.id }))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.commentOnPr = commentOnPr;
