import { fetch as undiciFetch } from "undici";
import { EventSource, type ErrorEvent } from "eventsource";
type Severity = "info" | "error";
interface Options {
    source: string;
    target: string;
    logger?: Pick<Console, Severity>;
    queryForwarding?: boolean;
    fetch?: any;
}
declare class SmeeClient {
    #private;
    constructor({ source, target, logger, fetch, queryForwarding, }: Options);
    static createChannel({ fetch, newChannelUrl, }?: {
        fetch?: typeof undiciFetch | undefined;
        newChannelUrl?: string | undefined;
    }): Promise<string>;
    get onmessage(): ((msg: MessageEvent) => void) | null;
    set onmessage(fn: ((msg: MessageEvent) => void) | null);
    get onerror(): ((ev: ErrorEvent) => void) | null;
    set onerror(fn: ((ev: ErrorEvent) => void) | null);
    get onopen(): ((ev: Event) => void) | null;
    set onopen(fn: ((ev: Event) => void) | null);
    start(): Promise<EventSource>;
    stop(): Promise<void>;
}
export { SmeeClient as default, SmeeClient as "module.exports", // For require(esm) compatibility
SmeeClient, };
