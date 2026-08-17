"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.fetchConfig = exports.CheckGroup = void 0;
/**
 * @module Core
 */
var core = __importStar(require("@actions/core"));
var generate_progress_1 = require("./generate_progress");
var subproj_matching_1 = require("./subproj_matching");
var satisfy_expected_checks_1 = require("./satisfy_expected_checks");
var config_getter_1 = require("./config_getter");
Object.defineProperty(exports, "fetchConfig", { enumerable: true, get: function () { return config_getter_1.fetchConfig; } });
var transient_error_1 = require("./transient_error");
/**
 * The orchestration class.
 */
var CheckGroup = /** @class */ (function () {
    function CheckGroup(pullRequestNumber, config, context, sha) {
        this.intervalTimer = setTimeout(function () { return ''; }, 0);
        this.timeoutTimer = setTimeout(function () { return ''; }, 0);
        this.inputs = {};
        this.canComment = true;
        this.lastTransientError = "";
        this.pullRequestNumber = pullRequestNumber;
        this.config = config;
        this.context = context;
        this.sha = sha;
    }
    CheckGroup.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var filenames, subprojs, expectedChecks, maintainers, owner, interval, timeout;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.files()];
                    case 1:
                        filenames = _a.sent();
                        core.info("Files are: ".concat(JSON.stringify(filenames)));
                        subprojs = (0, subproj_matching_1.matchFilenamesToSubprojects)(filenames, this.config.subProjects);
                        core.debug("Matching subprojects are: ".concat(JSON.stringify(subprojs)));
                        if (core.isDebug()) {
                            expectedChecks = collectExpectedChecks(subprojs);
                            core.debug("Expected checks are: ".concat(JSON.stringify(expectedChecks)));
                        }
                        maintainers = core.getInput('maintainers');
                        this.inputs.maintainers = maintainers;
                        owner = core.getInput('owner');
                        this.inputs.owner = owner;
                        interval = parseInt(core.getInput('interval'));
                        this.inputs.interval = interval;
                        core.info("Check interval: ".concat(interval));
                        this.runCheck(subprojs, 1, interval * 1000);
                        timeout = parseInt(core.getInput('timeout'));
                        this.inputs.timeout = timeout;
                        core.info("Timeout: ".concat(timeout));
                        // set a timeout that will stop the job to avoid polling the GitHub API infinitely
                        this.timeoutTimer = setTimeout(function () {
                            clearTimeout(_this.intervalTimer);
                            core.setFailed("The timeout of ".concat(timeout, " minutes has triggered but not all required jobs were passing.")
                                + (_this.lastTransientError
                                    ? " The GitHub API was also returning errors, the last being: ".concat(_this.lastTransientError)
                                    : "")
                                + " This job will need to be re-run to merge your PR."
                                + " If you do not have write access to the repository you can ask ".concat(maintainers, " to re-run it for you.")
                                + " If you have any other questions, you can reach out to ".concat(owner, " for help."));
                        }, timeout * 60 * 1000);
                        return [2 /*return*/];
                }
            });
        });
    };
    CheckGroup.prototype.runCheck = function (subprojs, tries, interval) {
        return __awaiter(this, void 0, void 0, function () {
            var postedChecks, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // print in a group to reduce verbosity
                        core.startGroup("Check ".concat(tries));
                        return [4 /*yield*/, getPostedChecks(this.context, this.sha)];
                    case 1:
                        postedChecks = _a.sent();
                        core.debug("postedChecks: ".concat(JSON.stringify(postedChecks)));
                        result = (0, satisfy_expected_checks_1.getSubProjResult)(subprojs, postedChecks);
                        return [4 /*yield*/, this.notifyProgress(subprojs, postedChecks, result)];
                    case 2:
                        _a.sent();
                        core.endGroup();
                        if (result === "all_passing") {
                            core.info("All required checks were successful!");
                            clearTimeout(this.intervalTimer);
                            clearTimeout(this.timeoutTimer);
                        }
                        else {
                            this.intervalTimer = setTimeout(function () { return _this.runCheck(subprojs, tries + 1, interval); }, interval);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        core.endGroup();
                        if ((0, transient_error_1.isTransientError)(error_1)) {
                            // A GitHub incident says nothing about the PR, so keep polling until the
                            // timeout timer fires rather than failing a PR whose checks are green.
                            this.lastTransientError = (0, transient_error_1.describeError)(error_1);
                            core.warning("Check ".concat(tries, " hit a transient GitHub API error, retrying in ").concat(interval / 1000, "s:")
                                + " ".concat(this.lastTransientError));
                            this.intervalTimer = setTimeout(function () { return _this.runCheck(subprojs, tries + 1, interval); }, interval);
                            return [2 /*return*/];
                        }
                        // bubble up the error to the job
                        core.setFailed(error_1);
                        clearTimeout(this.intervalTimer);
                        clearTimeout(this.timeoutTimer);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CheckGroup.prototype.notifyProgress = function (subprojs, postedChecks, result) {
        return __awaiter(this, void 0, void 0, function () {
            var details, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        details = (0, generate_progress_1.generateProgressDetailsCLI)(subprojs, postedChecks);
                        core.info("".concat(this.config.customServiceName, " result: '").concat(result, "':\n").concat(details));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, generate_progress_1.commentOnPr)(this.context, result, this.inputs, subprojs, postedChecks)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        // The comment is informational, so a failure to write it must never fail
                        // the job — the check statuses it summarises are unaffected.
                        if ((0, transient_error_1.httpStatus)(e_1) === 403) {
                            // Forbidden: Resource not accessible by integration
                            if (this.canComment) {
                                core.info("Failed to comment on the PR: ".concat((0, transient_error_1.describeError)(e_1)));
                            }
                            // Use this boolean to only print the info message once
                            this.canComment = false;
                        }
                        else {
                            core.warning("Failed to update the PR comment: ".concat((0, transient_error_1.describeError)(e_1)));
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a list of files that are modified in
     * a pull request.
     */
    CheckGroup.prototype.files = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pullRequestFiles, filenames;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, transient_error_1.withTransientRetry)("Listing the files changed in the PR", function () { return _this.context.octokit.paginate(_this.context.octokit.pulls.listFiles, _this.context.repo({ "pull_number": _this.pullRequestNumber }), function (response) { return response.data; }); })];
                    case 1:
                        pullRequestFiles = _a.sent();
                        filenames = [];
                        pullRequestFiles.forEach(function (pullRequestFile) {
                            filenames.push(pullRequestFile.filename);
                        });
                        return [2 /*return*/, filenames];
                }
            });
        });
    };
    return CheckGroup;
}());
exports.CheckGroup = CheckGroup;
/**
 * Fetches a list of already finished
 * checks.
 */
var getPostedChecks = function (context, sha) { return __awaiter(void 0, void 0, void 0, function () {
    var checkRuns, checkNames;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, context.octokit.paginate(context.octokit.checks.listForRef, 
                // only the latest runs, in case it was run multiple times
                context.repo({ ref: sha, filter: "latest" }), function (response) { return response.data; })];
            case 1:
                checkRuns = _a.sent();
                core.debug("checkRuns: ".concat(JSON.stringify(checkRuns)));
                checkNames = {};
                checkRuns.forEach(function (checkRun) {
                    var checkRunData = {
                        name: checkRun.name,
                        status: checkRun.status,
                        conclusion: checkRun.conclusion,
                        details_url: checkRun.details_url,
                        completed_at: new Date(checkRun.completed_at),
                    };
                    if (!checkNames[checkRun.name]) {
                        checkNames[checkRun.name] = checkRunData;
                    }
                    else {
                        core.debug("Conflict for ".concat(checkRun.name, ": previous=").concat(checkNames[checkRun.name].completed_at, ", new=").concat(checkRunData.completed_at));
                        // "filter: latest" doesnt seem to work as expected so we need to check `completed_at` in case of collisions
                        if (checkNames[checkRun.name].completed_at < checkRunData.completed_at) {
                            checkNames[checkRun.name] = checkRunData;
                        }
                    }
                });
                return [2 /*return*/, checkNames];
        }
    });
}); };
var collectExpectedChecks = function (configs) {
    // checks: subprojects[]
    var requiredChecks = {};
    configs.forEach(function (config) {
        config.checks.forEach(function (check) {
            if (check in requiredChecks) {
                requiredChecks[check].push(config.id);
            }
            else {
                requiredChecks[check] = [config.id];
            }
        });
    });
    return requiredChecks;
};
