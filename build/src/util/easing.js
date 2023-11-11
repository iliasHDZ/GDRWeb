"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.easingFunction = exports.EasingStyle = void 0;
var EasingStyle;
(function (EasingStyle) {
    EasingStyle[EasingStyle["NONE"] = 0] = "NONE";
    EasingStyle[EasingStyle["EASE_IN_OUT"] = 1] = "EASE_IN_OUT";
    EasingStyle[EasingStyle["EASE_IN"] = 2] = "EASE_IN";
    EasingStyle[EasingStyle["EASE_OUT"] = 3] = "EASE_OUT";
    EasingStyle[EasingStyle["ELASTIC_IN_OUT"] = 4] = "ELASTIC_IN_OUT";
    EasingStyle[EasingStyle["ELASTIC_IN"] = 5] = "ELASTIC_IN";
    EasingStyle[EasingStyle["ELASTIC_OUT"] = 6] = "ELASTIC_OUT";
    EasingStyle[EasingStyle["BOUNCE_IN_OUT"] = 7] = "BOUNCE_IN_OUT";
    EasingStyle[EasingStyle["BOUNCE_IN"] = 8] = "BOUNCE_IN";
    EasingStyle[EasingStyle["BOUNCE_OUT"] = 9] = "BOUNCE_OUT";
    EasingStyle[EasingStyle["EXPONENTIAL_IN_OUT"] = 10] = "EXPONENTIAL_IN_OUT";
    EasingStyle[EasingStyle["EXPONENTIAL_IN"] = 11] = "EXPONENTIAL_IN";
    EasingStyle[EasingStyle["EXPONENTIAL_OUT"] = 12] = "EXPONENTIAL_OUT";
    EasingStyle[EasingStyle["SINE_IN_OUT"] = 13] = "SINE_IN_OUT";
    EasingStyle[EasingStyle["SINE_IN"] = 14] = "SINE_IN";
    EasingStyle[EasingStyle["SINE_OUT"] = 15] = "SINE_OUT";
    EasingStyle[EasingStyle["BACK_IN_OUT"] = 16] = "BACK_IN_OUT";
    EasingStyle[EasingStyle["BACK_IN"] = 17] = "BACK_IN";
    EasingStyle[EasingStyle["BACK_OUT"] = 18] = "BACK_OUT";
})(EasingStyle = exports.EasingStyle || (exports.EasingStyle = {}));
;
const PI_X_2 = Math.PI * 2;
const PI_2 = Math.PI / 2;
/*
    Easing functions from GDRender
*/
function linear(time) {
    return time;
}
// Sine Ease
function sineEaseIn(time) {
    return -1 * Math.cos(time * PI_2) + 1;
}
function sineEaseOut(time) {
    return Math.sin(time * PI_2);
}
function sineEaseInOut(time) {
    return -0.5 * (Math.cos(Math.PI * time) - 1);
}
// Expo Ease
function expoEaseIn(time) {
    return time == 0 ? 0 : Math.pow(2, 10 * (time / 1 - 1)) - 1 * 0.001;
}
function expoEaseOut(time) {
    return time == 1 ? 1 : (-Math.pow(2, -10 * time / 1) + 1);
}
function expoEaseInOut(time) {
    if (time == 0 || time == 1)
        return time;
    if (time < 0.5)
        return 0.5 * Math.pow(2, 10 * (time * 2 - 1));
    return 0.5 * (-Math.pow(2, -10 * (time * 2 - 1)) + 2);
}
// Circ Ease
function circEaseIn(time) {
    return -1 * (Math.sqrt(1 - time * time) - 1);
}
function circEaseOut(time) {
    time = time - 1;
    return Math.sqrt(1 - time * time);
}
function circEaseInOut(time) {
    time = time * 2;
    if (time < 1)
        return -0.5 * (Math.sqrt(1 - time * time) - 1);
    time -= 2;
    return 0.5 * (Math.sqrt(1 - time * time) + 1);
}
// Elastic Ease
function elasticEaseIn(time, period) {
    let newT = 0;
    if (time == 0 || time == 1) {
        newT = time;
    }
    else {
        const s = period / 4;
        time = time - 1;
        newT = -Math.pow(2, 10 * time) * Math.sin((time - s) * PI_X_2 / period);
    }
    return newT;
}
function elasticEaseOut(time, period) {
    let newT = 0;
    if (time == 0 || time == 1) {
        newT = time;
    }
    else {
        const s = period / 4;
        newT = Math.pow(2, -10 * time) * Math.sin((time - s) * PI_X_2 / period) + 1;
    }
    return newT;
}
function elasticEaseInOut(time, period) {
    let newT = 0;
    if (time == 0 || time == 1) {
        newT = time;
    }
    else {
        time = time * 2;
        if (!period) {
            period = 0.3 * 1.5;
        }
        const s = period / 4;
        time = time - 1;
        if (time < 0) {
            newT = -0.5 * Math.pow(2, 10 * time) * Math.sin((time - s) * PI_X_2 / period);
        }
        else {
            newT = Math.pow(2, -10 * time) * Math.sin((time - s) * PI_X_2 / period) * 0.5 + 1;
        }
    }
    return newT;
}
// Back Ease
function backEaseIn(time) {
    const overshoot = 1.70158;
    return time * time * ((overshoot + 1) * time - overshoot);
}
function backEaseOut(time) {
    const overshoot = 1.70158;
    time = time - 1;
    return time * time * ((overshoot + 1) * time + overshoot) + 1;
}
function backEaseInOut(time) {
    const overshoot = 1.70158 * 1.525;
    time = time * 2;
    if (time < 1) {
        return (time * time * ((overshoot + 1) * time - overshoot)) / 2;
    }
    else {
        time = time - 2;
        return (time * time * ((overshoot + 1) * time + overshoot)) / 2 + 1;
    }
}
// Bounce Ease
function bounceTime(time) {
    if (time < 1 / 2.75) {
        return 7.5625 * time * time;
    }
    else if (time < 2 / 2.75) {
        time -= 1.5 / 2.75;
        return 7.5625 * time * time + 0.75;
    }
    else if (time < 2.5 / 2.75) {
        time -= 2.25 / 2.75;
        return 7.5625 * time * time + 0.9375;
    }
    time -= 2.625 / 2.75;
    return 7.5625 * time * time + 0.984375;
}
function bounceEaseIn(time) {
    return 1 - bounceTime(1 - time);
}
function bounceEaseOut(time) {
    return bounceTime(time);
}
function bounceEaseInOut(time) {
    let newT = 0;
    if (time < 0.5) {
        time = time * 2;
        newT = (1 - bounceTime(1 - time)) * 0.5;
    }
    else {
        newT = bounceTime(time * 2 - 1) * 0.5 + 0.5;
    }
    return newT;
}
function easeIn(time, rate) {
    return Math.pow(time, rate);
}
function easeOut(time, rate) {
    return Math.pow(time, 1 / rate);
}
function easeInOut(time, rate) {
    time *= 2;
    if (time < 1) {
        return 0.5 * Math.pow(time, rate);
    }
    else {
        return 1.0 - 0.5 * Math.pow(2 - time, rate);
    }
}
function easingFunction(time, style) {
    switch (style) {
        default:
        case EasingStyle.NONE:
            return linear(time);
        case EasingStyle.EASE_IN_OUT:
            return easeInOut(time, 2);
        case EasingStyle.EASE_IN:
            return easeIn(time, 2);
        case EasingStyle.EASE_OUT:
            return easeOut(time, 2);
        case EasingStyle.ELASTIC_IN_OUT:
            return elasticEaseInOut(time, 0.4);
        case EasingStyle.ELASTIC_IN:
            return elasticEaseIn(time, 0.4);
        case EasingStyle.ELASTIC_OUT:
            return elasticEaseOut(time, 0.4);
        case EasingStyle.BOUNCE_IN_OUT:
            return bounceEaseInOut(time);
        case EasingStyle.BOUNCE_IN:
            return bounceEaseIn(time);
        case EasingStyle.BOUNCE_OUT:
            return bounceEaseOut(time);
        case EasingStyle.EXPONENTIAL_IN_OUT:
            return expoEaseInOut(time);
        case EasingStyle.EXPONENTIAL_IN:
            return expoEaseIn(time);
        case EasingStyle.EXPONENTIAL_OUT:
            return expoEaseOut(time);
        case EasingStyle.SINE_IN_OUT:
            return sineEaseInOut(time);
        case EasingStyle.SINE_IN:
            return sineEaseIn(time);
        case EasingStyle.SINE_OUT:
            return sineEaseOut(time);
        case EasingStyle.BACK_IN_OUT:
            return backEaseInOut(time);
        case EasingStyle.BACK_IN:
            return backEaseIn(time);
        case EasingStyle.BACK_OUT:
            return backEaseOut(time);
    }
    ;
}
exports.easingFunction = easingFunction;
