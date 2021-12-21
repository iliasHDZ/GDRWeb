export class GDObject {
    public id: number;

    public x: number;
    public y: number;

    public hflip: boolean;
    public vflip: boolean;
    
    public rotation: number;

    static parse(data: string, type: string, def: any): any {
        if (!data) return def;

        switch (type) {
            case 'number':  return +data;
            case 'boolean': return data == '1';
            default:        return def;
        }
    }

    static fromLevelData(data: {}): GDObject {
        let o = new GDObject();

        o.id       = this.parse(data[1], 'number',  1);
        o.x        = this.parse(data[2], 'number',  0);
        o.y        = this.parse(data[3], 'number',  0);
        o.hflip    = this.parse(data[4], 'boolean', false);
        o.vflip    = this.parse(data[5], 'boolean', false);
        o.rotation = this.parse(data[6], 'number',  0);

        return o;
    }
}