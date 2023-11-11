"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDLevel = void 0;
const object_1 = require("./object/object");
const speed_portal_1 = require("./object/speed-portal");
const color_trigger_1 = require("./object/trigger/color-trigger");
const alpha_trigger_1 = require("./object/trigger/alpha-trigger");
const pulse_trigger_1 = require("./object/trigger/pulse-trigger");
const move_trigger_1 = require("./object/trigger/move-trigger");
const toggle_trigger_1 = require("./object/trigger/toggle-trigger");
const object_batch_1 = require("./render/object-batch");
const renderer_1 = require("./renderer");
const color_1 = require("./util/color");
const basecolor_1 = require("./util/basecolor");
const playercolor_1 = require("./util/playercolor");
const copycolor_1 = require("./util/copycolor");
const object_sprite_1 = require("./object/info/object-sprite");
const value_trigger_track_1 = require("./value-trigger-track");
const groups_1 = require("./groups");
const hsvshift_1 = require("./util/hsvshift");
const objecthsv_1 = require("./objecthsv");
const profiler_1 = require("./profiler");
class GDLevel {
    constructor(renderer) {
        this.data = [];
        this.objectHSVsLoaded = false;
        this.renderer = renderer;
        this.groupManager = new groups_1.GroupManager(this);
        this.objectHSVManager = new objecthsv_1.ObjectHSVManager(this);
        this.profiler = new profiler_1.Profiler();
    }
    static parseStartColor(level, str) {
        if (str == '')
            return;
        let psplit = str.split('_');
        let props = {};
        for (let p = 0; p < psplit.length; p += 2)
            props[+psplit[p]] = psplit[p + 1];
        let r = object_1.GDObject.parse(props[1], 'number', 255);
        let g = object_1.GDObject.parse(props[2], 'number', 255);
        let b = object_1.GDObject.parse(props[3], 'number', 255);
        let plr = object_1.GDObject.parse(props[4], 'number', 0);
        let blending = object_1.GDObject.parse(props[5], 'boolean', false);
        let id = object_1.GDObject.parse(props[6], 'number', 1);
        let a = object_1.GDObject.parse(props[7], 'number', 1);
        let copyId = object_1.GDObject.parse(props[9], 'number', 0);
        let copyOpacity = object_1.GDObject.parse(props[17], 'boolean', 0);
        let copyHsvShift = hsvshift_1.HSVShift.parse(props[10]);
        let color;
        if (copyId != 0)
            color = new copycolor_1.CopyColor(copyId, copyOpacity, copyHsvShift, a, blending);
        else if (plr != -1)
            color = new playercolor_1.PlayerColor(plr - 1, a, blending);
        else
            color = new basecolor_1.BaseColor(r, g, b, a, blending);
        level.startColors[id] = color;
    }
    static getLevelSpeedEnum(speed) {
        switch (speed) {
            default:
            case 0: return speed_portal_1.PortalSpeed.ONE;
            case 1: return speed_portal_1.PortalSpeed.HALF;
            case 2: return speed_portal_1.PortalSpeed.TWO;
            case 3: return speed_portal_1.PortalSpeed.THREE;
            case 4: return speed_portal_1.PortalSpeed.FOUR;
        }
    }
    static parseLevelProps(level, str) {
        let psplit = str.split(',');
        let props = {};
        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        const speed = object_1.GDObject.parse(props['kA4'], 'number', 0);
        level.speed = GDLevel.getLevelSpeedEnum(speed);
        level.song_offset = object_1.GDObject.parse(props['kA13'], 'number', 0);
        if (props['kS38']) {
            level.startColors = {};
            for (let c of props['kS38'].split('|'))
                this.parseStartColor(level, c);
        }
    }
    static getObject(data) {
        let id = data[1] || 1;
        let obj;
        if (speed_portal_1.SpeedPortal.isOfType(id))
            obj = new speed_portal_1.SpeedPortal();
        else if (color_trigger_1.ColorTrigger.isOfType(id))
            obj = new color_trigger_1.ColorTrigger();
        else if (alpha_trigger_1.AlphaTrigger.isOfType(id))
            obj = new alpha_trigger_1.AlphaTrigger();
        else if (pulse_trigger_1.PulseTrigger.isOfType(id))
            obj = new pulse_trigger_1.PulseTrigger();
        else if (move_trigger_1.MoveTrigger.isOfType(id))
            obj = new move_trigger_1.MoveTrigger();
        else if (toggle_trigger_1.ToggleTrigger.isOfType(id))
            obj = new toggle_trigger_1.ToggleTrigger();
        else
            obj = new object_1.GDObject();
        obj.applyData(data);
        return obj;
    }
    static parse(renderer, data) {
        let level = new GDLevel(renderer);
        let split = data.split(';');
        this.parseLevelProps(level, split[0]);
        for (let i = 1; i < split.length; i++) {
            let psplit = split[i].split(',');
            let props = {};
            for (let p = 0; p < psplit.length; p += 2)
                props[+psplit[p]] = psplit[p + 1];
            level.data.push(this.getObject(props));
        }
        level.init();
        return level;
    }
    getObjects() {
        return this.data;
    }
    getStartColor(ch) {
        if (!this.startColors[ch])
            return basecolor_1.BaseColor.white();
        return this.startColors[ch];
    }
    timeAt(x) {
        let sec = 0, lx = 15, spd = speed_portal_1.SpeedPortal.getSpeed(this.speed);
        for (let i of this.speedportals) {
            let sp = this.data[i];
            if (!sp)
                continue;
            if (sp.x >= x)
                break;
            let delta = sp.x - lx;
            if (delta < 0)
                continue;
            sec += delta / spd;
            lx += delta;
            spd = speed_portal_1.SpeedPortal.getSpeed(sp.speed);
        }
        return sec + (x - lx) / spd;
    }
    posAt(s) {
        let sec = 0, lx = 15, spd = speed_portal_1.SpeedPortal.getSpeed(this.speed);
        for (let i of this.speedportals) {
            let sp = this.data[i];
            if (!sp)
                continue;
            let delta = sp.x - lx;
            if (delta < 0)
                continue;
            let tsec = sec + delta / spd;
            if (tsec >= s)
                break;
            sec = tsec;
            lx += delta;
            spd = speed_portal_1.SpeedPortal.getSpeed(sp.speed);
        }
        return lx + (s - sec) * spd;
    }
    getPlayerColor(plrcol, opacity) {
        if (plrcol == 0)
            return new color_1.Color(1.0, 0.3, 0.3, opacity);
        else if (plrcol == 1)
            return new color_1.Color(0.3, 1.0, 0.3, opacity);
        return new color_1.Color(0, 0, 0, opacity);
    }
    gdColorAt(ch, time) {
        const col = this.colorTrackList.valueAt(ch, time);
        if (!(col instanceof color_trigger_1.ColorTriggerValue))
            return basecolor_1.BaseColor.white();
        return col.color;
    }
    colorAtTime(ch, time, iterations = 8) {
        if (iterations == 8)
            this.profiler.start("Color Trigger Evaluation");
        let [color, blending] = this.gdColorAt(ch, time).evaluate(this, time, iterations);
        if (iterations == 8)
            this.profiler.end();
        if (iterations == 8)
            this.profiler.start("Pulse Trigger Evaluation");
        const pulse = this.pulseTrackList.valueAt(ch, time);
        color = pulse.applyToColor(color);
        if (iterations == 8)
            this.profiler.end();
        return [
            color,
            blending
        ];
    }
    colorAtPos(ch, x) {
        return this.colorAtTime(ch, this.timeAt(x));
    }
    addTexture(object, sprite, groups, hsvId) {
        const objectMatrix = object.getModelMatrix();
        const spriteMatrix = sprite.getRenderModelMatrix();
        this.level_col.add(objectMatrix.multiply(spriteMatrix), object.getColorChannel(sprite.colorType), sprite.sprite, groups, hsvId);
    }
    loadSpeedPortals() {
        this.speedportals = [];
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] && this.data[i] instanceof speed_portal_1.SpeedPortal)
                this.speedportals.push(i);
        this.speedportals.sort((a, b) => this.data[a].x - this.data[b].x);
    }
    loadColorTracks() {
        this.colorTrackList = new value_trigger_track_1.ValueTriggerTrackList(this, color_trigger_1.ColorTriggerValue.default());
        for (let [ch, color] of Object.entries(this.startColors))
            this.colorTrackList.createTrackWithStartValue(+ch, new color_trigger_1.ColorTriggerValue(color));
        this.colorTrackList.loadAllTriggers((trigger) => {
            if (!(trigger instanceof color_trigger_1.ColorTrigger))
                return null;
            return trigger.color;
        });
    }
    loadPulseTracks() {
        this.pulseTrackList = new value_trigger_track_1.ValueTriggerTrackList(this, pulse_trigger_1.PulseTriggerValue.empty());
        this.pulseTrackList.loadAllTriggers((trigger) => {
            if (!(trigger instanceof pulse_trigger_1.PulseTrigger))
                return null;
            if (trigger.targetType != pulse_trigger_1.PulseTargetType.CHANNEL || trigger.targetId == 0)
                return null;
            return trigger.targetId;
        });
    }
    init() {
        this.level_col = new object_batch_1.ObjectBatch(this.renderer.ctx, this.renderer.sheet0, this.renderer.sheet2);
        this.loadSpeedPortals();
        this.loadColorTracks();
        this.loadPulseTracks();
        this.groupManager.reset();
        this.groupManager.loadGroups();
        this.groupManager.compressLargeGroupCombinations(4);
        this.groupManager.loadAlphaTracks();
        this.groupManager.loadMoveTracks();
        this.groupManager.loadToggleTracks();
        this.objectHSVManager.reset();
        this.objectHSVManager.loadObjectHSVs();
        let data = [];
        let ind = 0;
        for (let o of this.data)
            data.push([o, ind++]);
        data.sort((a, b) => {
            let r = object_1.GDObject.compareZOrder(a[0], b[0]);
            if (r != 0)
                return r;
            return a[1] - b[1];
        });
        this.valid_channels = [0];
        for (let [obj] of data) {
            const info = renderer_1.Renderer.objectInfo.getData(obj.id);
            if (!info)
                continue;
            if (info.rootSprite) {
                const groups = this.groupManager.getGroupCombination(obj.groupComb ?? null);
                const baseHSVId = obj.baseHSVShiftId;
                const detailHSVId = obj.detailHSVShiftId;
                info.rootSprite.enumerateAllByDepth(sprite => {
                    let hsvId = 0;
                    if (sprite.colorType == object_sprite_1.ObjectSpriteColor.BASE)
                        hsvId = baseHSVId;
                    if (sprite.colorType == object_sprite_1.ObjectSpriteColor.DETAIL)
                        hsvId = detailHSVId;
                    this.addTexture(obj, sprite, groups, hsvId);
                });
            }
            if (obj.baseCol != 0 && !this.valid_channels.includes(obj.baseCol))
                this.valid_channels.push(obj.baseCol);
            if (obj.detailCol != 0 && !this.valid_channels.includes(obj.detailCol))
                this.valid_channels.push(obj.detailCol);
        }
        this.level_col.compile();
    }
}
exports.GDLevel = GDLevel;
