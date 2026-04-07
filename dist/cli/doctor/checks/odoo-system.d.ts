interface CheckResult {
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
}
export declare function runDoctorChecks(projectRoot: string): CheckResult[];
export declare function formatDoctorResults(results: CheckResult[]): string;
export {};
