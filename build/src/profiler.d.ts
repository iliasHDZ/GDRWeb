export declare class Profile {
    name: string;
    duration: number;
    children: Profile[];
    _prevTime: number;
    _started: boolean;
    _long: boolean;
    constructor(name: string, long?: boolean);
    start(): void;
    end(): void;
    toHTMLElement(): HTMLElement;
}
export declare class Profiler {
    profileStack: Profile[];
    constructor();
    private peak;
    private push;
    private pop;
    start(name: string, long?: boolean): void;
    end(): Profile;
}
