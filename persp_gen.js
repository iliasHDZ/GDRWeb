const TEXTURE_CONSTRUCTIONS = [
    [
        {
            "offset": [-16, 0],
            "src": "_02_001"
        },
        {
            "offset": [16, 0],
            "src": "_01_001"
        }
    ],
    [
        {
            "offset": [-16, 0],
            "src": "_01_001"
        },
        {
            "offset": [16, 0],
            "src": "_01_001"
        }
    ],
    "_01_001",
    [
        "_03_001",
        {
            "rot": 90,
            "yf": true,
            "src": "_03_001"
        }
    ],
    [
        {
            "offset": [5, 0],
            "src": "_02_001"
        },
        {
            "rot": 90,
            "yf": true,
            "offset": [0, 5],
            "src": "_02_001"
        }
    ],
    "_03_001",
    "_02_001",
    [
        {
            "offset": [-48, -25],
            "src": "_05_001"
        },
        {
            "offset": [-18, -10],
            "src": "_05_001"
        },
        {
            "offset": [12, 5],
            "src": "_05_001"
        },
        {
            "offset": [42, 20],
            "src": "_05_001"
        }
    ],
    [
        "_04_001",
        {
            "offset": [-20, -20],
            "src": "_04_001"
        },
        {
            "offset": [20, 20],
            "src": "_04_001"
        }
    ]
]

function concatTexName(texcon, tex) {
    if (typeof(texcon) == 'string')
        return tex + texcon;
    else {
        if (Array.isArray(texcon)) {
            let ret = [];
            for (let a of texcon)
                ret.push(concatTexName(a, tex));

            return ret;
        } else {
            let ret = {};
            for (let [k, v] of Object.entries(texcon))
                ret[k] = v;

            ret.src = tex + ret.src;
            return ret;
        }
    }
}

const START_ID = 623;
const BLOCK_TEXTURES = [
    "persp_block001",
    "persp_block002",
];

let generated = {};
let currentId = START_ID;

for (tex of BLOCK_TEXTURES)
    for (let texcon of TEXTURE_CONSTRUCTIONS)
        generated[currentId++] = {
            "zorder": -7,
            "zlayer": 1,
            "baseColor": 1004,
            "detailColor": 0,
            "baseTex": concatTexName(texcon, tex)
        };

console.log(JSON.stringify(generated, null, 4));