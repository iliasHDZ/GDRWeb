export declare enum EasingStyle {
    NONE = 0,
    EASE_IN_OUT = 1,
    EASE_IN = 2,
    EASE_OUT = 3,
    ELASTIC_IN_OUT = 4,
    ELASTIC_IN = 5,
    ELASTIC_OUT = 6,
    BOUNCE_IN_OUT = 7,
    BOUNCE_IN = 8,
    BOUNCE_OUT = 9,
    EXPONENTIAL_IN_OUT = 10,
    EXPONENTIAL_IN = 11,
    EXPONENTIAL_OUT = 12,
    SINE_IN_OUT = 13,
    SINE_IN = 14,
    SINE_OUT = 15,
    BACK_IN_OUT = 16,
    BACK_IN = 17,
    BACK_OUT = 18
}
export declare function easingFunction(time: number, style: EasingStyle): number;
