"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profiler = exports.Profile = void 0;
function accurateTimeInMS() {
    return window.performance.now();
}
const profileStyle = "display: flex; flex-direction: column;";
const profileNameStyle = "";
const profileChildrenStyle = "display: flex; flex-direction: column; margin-left: 20px;";
function generateProfileElement(profile) {
    const elem = document.createElement('div');
    elem.setAttribute('style', profileStyle);
    const profileName = document.createElement('div');
    profileName.setAttribute('style', profileNameStyle);
    profileName.textContent = `- ${profile.name}: ${profile.duration.toLocaleString('en-US', { maximumFractionDigits: 2 })}ms`;
    elem.appendChild(profileName);
    const profileChildren = document.createElement('div');
    profileChildren.setAttribute('style', profileChildrenStyle);
    if (!profile._long) {
        for (let child of profile.children) {
            profileChildren.appendChild(generateProfileElement(child));
        }
    }
    else {
        const children = profile.children.slice();
        children.sort((a, b) => b.duration - a.duration);
        for (let child of children.slice(0, 10)) {
            profileChildren.appendChild(generateProfileElement(child));
        }
        const etc = document.createElement('div');
        etc.textContent = "...";
        profileChildren.appendChild(etc);
    }
    elem.appendChild(profileChildren);
    return elem;
}
class Profile {
    constructor(name, long = false) {
        this.duration = 0;
        this.children = [];
        this._prevTime = 0;
        this._started = false;
        this._long = false;
        this.name = name;
        this._long = long;
    }
    start() {
        if (this._started)
            return;
        this._prevTime = accurateTimeInMS();
        this._started = true;
    }
    end() {
        if (!this._started)
            return;
        this.duration += accurateTimeInMS() - this._prevTime;
        this._started = false;
    }
    toHTMLElement() {
        return generateProfileElement(this);
    }
}
exports.Profile = Profile;
;
class Profiler {
    constructor() {
        this.profileStack = [];
    }
    peak() {
        if (this.profileStack.length == 0)
            return null;
        return this.profileStack[this.profileStack.length - 1];
    }
    push(profile) {
        this.profileStack.push(profile);
    }
    pop() {
        return this.profileStack.pop();
    }
    start(name, long = false) {
        const peak = this.peak();
        if (!peak) {
            const profile = new Profile(name, long);
            this.push(profile);
            profile.start();
            return;
        }
        let profile = null;
        for (let ch of peak.children)
            if (ch.name == name)
                profile = ch;
        if (profile) {
            this.push(profile);
            profile.start();
        }
        else {
            const profile = new Profile(name, long);
            peak.children.push(profile);
            this.push(profile);
            profile.start();
        }
    }
    end() {
        if (this.profileStack.length == 0)
            return;
        const profile = this.pop();
        profile.end();
        return profile;
    }
}
exports.Profiler = Profiler;
