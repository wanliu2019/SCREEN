import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbDe from '../db/db_de';
import { cache } from '../db/db_cache';
import { lookupEnsembleGene } from '../db/db_cache';
import { Version } from '../schema/schema';


class DE {
    version: Version; gene;
    ct1; ct2;
    pos; names;
    halfWindow; thres; radiusScale;

    constructor(version: Version, gene: string, ct1: string, ct2: string) {
        this.version = version;
        this.gene = gene;
        this.ct1 = ct1;
        this.ct2 = ct2;

        this.halfWindow = 250 * 1000 * 2;
        this.thres = 0;
        this.radiusScale = 10;
    }

    async coord() {
        if (!this.pos) {
            const { pos, names } = await Common.genePos(this.version.assembly, this.gene);
            if (!pos) {
                throw new Error('Invalid pos for ' + this.gene);
            }
            this.pos = pos;
            this.names = names;
        }
        return this.pos;
    }

    async nearbyDEs() {
        // limb_14.5 from C57BL-6_limb_embryo_14.5_days
        const ct1 = this.ct1.replace('C57BL/6_', '').replace('embryo_', '').replace('_days', '').replace('postnatal_', '');
        const ct2 = this.ct2.replace('C57BL/6_', '').replace('embryo_', '').replace('_days', '').replace('postnatal_', '');

        const cd = await this.coord();

        const nearbyDEs = await DbDe.nearbyDEs(this.version.assembly, cd, this.halfWindow, ct1, ct2, 0.05);

        if (nearbyDEs.length === 0) {
            return { 'data': undefined, 'xdomain': undefined };
        }

        // center on middle of DEs
        const cxdomain = [
            Math.max(0, Math.min(...nearbyDEs.map(d => d['start']))),
            Math.max(...nearbyDEs.map(d => d['stop']))
        ];
        const center = (cxdomain[1] - cxdomain[0]) / 2 + cxdomain[0];
        const halfWindow = Math.max(this.halfWindow, (cxdomain[1] - cxdomain[0]) / 2.0);

        // widen each side
        const xdomain = [
            Math.max(0, center - halfWindow),
            center + halfWindow
        ];

        const genes = await this.genesInRegion(Math.min(xdomain[0], cxdomain[0]),
                                    Math.max(xdomain[1], cxdomain[1]));

        const ret = this.DEsForDisplay(nearbyDEs);

        const ymin = ret.map(d => d['fc']).reduce((prev, curr) => !prev ? curr : (curr < prev ? curr : prev));
        const ymax = ret.map(d => d['fc']).reduce((prev, curr) => !prev ? curr : (curr > prev ? curr : prev));

        return {
            'names': this.names,
            'data': ret,
            'xdomain': xdomain,
            'genes': genes,
            'ymin': ymin,
            'ymax': ymax,
        };
    }

    async genesInRegion(start, stop) {
        const pos = await this.coord();
        return Common.genesInRegion(this.version.assembly, pos.chrom, start, stop);
    }

    DEsForDisplay(nearbyDEs) {
        const ret = nearbyDEs.map(d => {
            const { symbol: genename, strand } = lookupEnsembleGene(this.version, d['ensembl']);
            return {
                'fc': +(Math.round(+(d['log2foldchange'] + 'e+3'))  + 'e-3'),
                'gene': genename,
                'start': d['start'],
                'stop': d['stop'],
                'strand': strand,
                'sstart': `${parseInt(d['start']).toLocaleString()} (${strand})`
            };
        });
        return ret;
    }

    parseCE(typ, c) {
        const { accession, start, stop, zscore_1, zscore_2 } = c;
        const radius = (stop - start) / 2;
        return {
            'center': radius + start,
            'value': +(Math.round(+(+(zscore_2 - zscore_1) + 'e+3'))  + 'e-3'),
            'typ': typ,
            'width': 4,
            'accession': accession,
            'start': start,
            'stop': stop,
            'len': stop - start
        };
    }

    async nearbyPromoters() {
        const c = cache(this.version);
        const rmLookup = c.rankMethodToIDxToCellType['H3K4me3'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1PromoterIdx = rmLookup[this.ct1];
        const ct2PromoterIdx = rmLookup[this.ct2];

        const cols = [
            'accession', 'start', 'stop',
            `h3k4me3_zscores[${ct1PromoterIdx}] as zscore_1`,
            `h3k4me3_zscores[${ct2PromoterIdx}] as zscore_2`
        ];
        const cres = await Common.nearbyCREs(this.version.assembly, await this.coord(), 2 * this.halfWindow, cols, true);
        return cres
            .filter(c =>
                c['zscore_1'] > this.thres ||
                c['zscore_2'] > this.thres)
            .map(c => this.parseCE('promoter-like signature', c));
    }

    async nearbyEnhancers() {
        const c = cache(this.version);
        const rmLookup = c.rankMethodToIDxToCellType['H3K27ac'];
        if (!(this.ct1 in rmLookup && this.ct2 in rmLookup)) {
            return [];
        }
        const ct1EnhancerIdx = rmLookup[this.ct1];
        const ct2EnhancerIdx = rmLookup[this.ct2];

        const cols = [
            'accession', 'start', 'stop',
            `h3k27ac_zscores[${ct1EnhancerIdx}] as zscore_1`,
            `h3k27ac_zscores[${ct2EnhancerIdx}] as zscore_2`
        ];
        const cres = await Common.nearbyCREs(this.version.assembly, await this.coord(), 2 * this.halfWindow, cols, false);
        return cres
        .filter(c =>
            c['zscore_1'] > this.thres ||
            c['zscore_2'] > this.thres)
        .map(c => this.parseCE('enhancer-like signature', c));
    }

    async diffCREs(xdomain) {
        const xstart = xdomain[0];
        const xstop = xdomain[1];
        let ret = ([] as Array<any>).concat(await this.nearbyPromoters()).concat(await this.nearbyEnhancers());
        ret = ret.filter(x => x['start'] >= xstart && x['stop'] <= xstop);
        return { 'data': ret };
    }
}

async function de(version: Version, gene: string, ct1: string, ct2: string) {
    const de = new DE(version, gene, ct1, ct2);
    const nearbyDEs = await de.nearbyDEs();

    let diffCREs: any = {};
    if (nearbyDEs['data']) {
        diffCREs = await de.diffCREs(nearbyDEs['xdomain']);
    }

    return {
        'xdomain': nearbyDEs['xdomain'],
        'coord': de.coord(),
        'diffCREs': diffCREs,
        'nearbyDEs': nearbyDEs
    };
}

export const resolve_de: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const version: Version = args.version;
    const gene = args.gene;
    const ct1 = args.ct1;
    const ct2 = args.ct2;
    return de(version, gene, ct1, ct2);
};
